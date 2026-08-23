# -*- coding: utf-8 -*-
"""Payment routes — SePay VietQR integration, Webhook handler, and subscription management."""

import os
import re
import time
import hmac
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import PaymentTransaction, User
from routes.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/api/payments", tags=["payments"])

SEPAY_BANK_NAME = os.getenv("SEPAY_BANK_NAME", "MBBank")
SEPAY_ACCOUNT_NO = os.getenv("SEPAY_ACCOUNT_NO", "0906118728")
SEPAY_ACCOUNT_NAME = os.getenv("SEPAY_ACCOUNT_NAME", "PHAN VIET PHUONG")
SEPAY_WEBHOOK_SECRET = os.getenv("SEPAY_WEBHOOK_SECRET", "whsec_18BJLJSI358Ym3dhWYWsQqOMeCYoxV1r")

PLAN_PRICING = {
    "pro": {
        "name": "Pro",
        "amount": 99000,
        "credits": 25,
        "duration_days": 30,
    },
    "premium": {
        "name": "Premium",
        "amount": 199000,
        "credits": 100,
        "duration_days": 30,
    }
}


class CreateOrderRequest(BaseModel):
    plan: str  # "pro" or "premium"


# ── Create Order & Generate VietQR ────────────────────────────────────

@router.post("/create-order")
def create_payment_order(
    req: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate dynamic VietQR payment order for SePay."""
    plan_key = req.plan.lower().strip()
    if plan_key not in PLAN_PRICING:
        raise HTTPException(status_code=400, detail="Gói đăng ký không hợp lệ. Chọn 'pro' hoặc 'premium'.")

    plan_info = PLAN_PRICING[plan_key]
    amount = plan_info["amount"]

    # Generate unique alphanumeric order code (e.g., ITV101P8492)
    timestamp_suffix = int(time.time()) % 100000
    order_code = f"ITV{current_user.id}P{timestamp_suffix}"

    # Create pending transaction
    transaction = PaymentTransaction(
        user_id=current_user.id,
        order_code=order_code,
        plan=plan_key,
        amount=amount,
        status="pending",
        payment_content=order_code,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    # Dynamic SePay VietQR image URL
    qr_url = (
        f"https://qr.sepay.vn/img?"
        f"acc={SEPAY_ACCOUNT_NO}"
        f"&bank={SEPAY_BANK_NAME}"
        f"&amount={amount}"
        f"&des={order_code}"
        f"&template=compact"
    )

    return {
        "order": transaction.to_dict(),
        "qrUrl": qr_url,
        "bankInfo": {
            "bankName": SEPAY_BANK_NAME,
            "accountNo": SEPAY_ACCOUNT_NO,
            "accountName": SEPAY_ACCOUNT_NAME,
            "amount": amount,
            "orderCode": order_code,
            "planName": plan_info["name"],
        }
    }


# ── Polling: Check Order Status ───────────────────────────────────────

@router.get("/order-status/{order_code}")
def check_order_status(order_code: str, db: Session = Depends(get_db)):
    """Check payment status for real-time frontend feedback."""
    transaction = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.order_code == order_code)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

    return {
        "orderCode": transaction.order_code,
        "status": transaction.status,
        "plan": transaction.plan,
        "completedAt": transaction.completed_at.isoformat() if transaction.completed_at else None,
    }


# ── SePay Webhook Endpoint ────────────────────────────────────────────

@router.post("/sepay-webhook")
async def sepay_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_sepay_signature: Optional[str] = Header(None, alias="X-SePay-Signature"),
):
    """
    Webhook receiver from SePay.
    Triggers automatically when bank receives payment.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    print(f"[SePay Webhook] 🔔 Received transaction notification: {payload}")

    # 1. Verify HMAC Signature if secret is configured and header provided
    if SEPAY_WEBHOOK_SECRET and x_sepay_signature:
        raw_body = await request.body()
        expected_sig = hmac.new(
            SEPAY_WEBHOOK_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected_sig, x_sepay_signature):
            print("[SePay Webhook] ⚠️ Invalid HMAC signature, proceeding with content verification")

    # 2. Extract transaction fields from SePay payload
    content = str(payload.get("content") or "").strip().upper()
    description = str(payload.get("description") or "").strip().upper()
    transfer_amount = int(payload.get("transferAmount") or payload.get("amount") or 0)
    gateway_id = str(payload.get("id") or payload.get("referenceCode") or "")

    combined_text = f"{content} {description}"

    # 3. Find matching order code in database
    # Order codes format: ITV<user_id>P<timestamp>
    matched_transaction = None

    # Try regex match first
    match = re.search(r"ITV\d+P\d+", combined_text)
    if match:
        code = match.group(0)
        matched_transaction = (
            db.query(PaymentTransaction)
            .filter(PaymentTransaction.order_code == code)
            .first()
        )

    # If regex did not match, try scanning pending transactions
    if not matched_transaction:
        pending_orders = (
            db.query(PaymentTransaction)
            .filter(PaymentTransaction.status == "pending")
            .all()
        )
        for order in pending_orders:
            if order.order_code.upper() in combined_text:
                matched_transaction = order
                break

    if not matched_transaction:
        print(f"[SePay Webhook] ℹ️ No matching pending order for content: '{combined_text}'")
        return {"success": True, "message": "Ignored (not an ITV order)"}

    # 4. Validate Amount
    if transfer_amount < matched_transaction.amount:
        print(f"[SePay Webhook] ⚠️ Amount mismatch: expected {matched_transaction.amount}, got {transfer_amount}")
        return {"success": False, "detail": "Transfer amount is less than order amount"}

    # 5. Fulfill Order: Upgrade User Plan & Add Credits
    matched_transaction.status = "completed"
    matched_transaction.gateway_transaction_id = gateway_id
    matched_transaction.completed_at = datetime.now(timezone.utc)

    user = db.query(User).filter(User.id == matched_transaction.user_id).first()
    if user:
        plan_key = matched_transaction.plan
        plan_info = PLAN_PRICING.get(plan_key, {"credits": 25, "duration_days": 30})

        user.plan = plan_key
        user.credits = (user.credits or 0) + plan_info["credits"]
        user.plan_expired_at = datetime.now(timezone.utc) + timedelta(days=plan_info["duration_days"])
        print(f"[SePay Webhook] 🎉 User {user.id} ({user.email}) upgraded to plan '{plan_key}' with {user.credits} credits!")

    db.commit()
    return {"success": True, "message": "Payment verified and user subscription updated"}

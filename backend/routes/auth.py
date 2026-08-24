# -*- coding: utf-8 -*-
"""Authentication routes — Google OAuth2, JWT session tokens, and user profile."""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import APIRouter, Depends, HTTPException, Header, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

JWT_SECRET = os.getenv("JWT_SECRET", "mockitv-super-secret-jwt-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 30
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


# ── Schemas ──────────────────────────────────────────────────────────

class GoogleLoginRequest(BaseModel):
    credential: str


class AuthResponse(BaseModel):
    token: str
    user: dict



# ── JWT Helpers ──────────────────────────────────────────────────────

def create_access_token(user: User) -> str:
    """Generate a signed JWT token valid for 30 days."""
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency: Extract and verify JWT Bearer token, return User."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
    except (jwt.PyJWTError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """FastAPI dependency: Return User if valid Bearer token provided, else None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ", 1)[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None


# ── Endpoints ────────────────────────────────────────────────────────

@router.post("/google", response_model=AuthResponse)
def login_with_google(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Verify Google Identity Services (GIS) ID token and log in or register user."""
    credential = req.credential.strip()
    if not credential:
        raise HTTPException(status_code=400, detail="Missing Google credential token")

    id_info = None

    # 1. Verify with Google Auth
    try:
        request_adapter = google_requests.Request()
        audience = GOOGLE_CLIENT_ID if GOOGLE_CLIENT_ID else None
        id_info = id_token.verify_oauth2_token(
            credential,
            request_adapter,
            audience=audience,
            clock_skew_in_seconds=10,
        )
    except Exception as e:
        is_dev = os.getenv("ENVIRONMENT", "").lower() in ("dev", "development", "local")
        if is_dev:
            try:
                id_info = jwt.decode(credential, options={"verify_signature": False})
                if not id_info.get("email"):
                    raise ValueError("Missing email in payload")
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid Google token: {str(e)}",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token verification: {str(e)}",
            )

    email = id_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google token does not contain an email address")

    name = id_info.get("name") or email.split("@")[0]
    picture = id_info.get("picture") or f"https://api.dicebear.com/7.x/avataaars/svg?seed={name}"
    google_id = id_info.get("sub")

    # 2. Upsert user in database
    user = db.query(User).filter(
        (User.google_id == google_id) | (User.email == email)
    ).first()

    if user:
        user.name = name
        user.avatar_url = picture
        if google_id:
            user.google_id = google_id
    else:
        user = User(
            email=email,
            name=name,
            avatar_url=picture,
            google_id=google_id,
            plan="free",
            credits=4,
        )
        db.add(user)

    db.commit()
    db.refresh(user)

    # 3. Generate our application's JWT session token
    token = create_access_token(user)
    return {"token": token, "user": user.to_dict()}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Return authenticated user profile."""
    return {"user": current_user.to_dict()}


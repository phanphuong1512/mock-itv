# -*- coding: utf-8 -*-
"""API routes for voice interview — TTS + STT (Groq Whisper) + conversational AI."""

import json
import os
import tempfile
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ai_service import text_to_speech, voice_interview_respond, voice_interview_respond_stream
from database import get_db
from models import MockSession, User
from routes.auth import get_optional_user

router = APIRouter(prefix="/api/voice", tags=["voice"])

# ============================================================
# SCHEMAS
# ============================================================


class TTSRequest(BaseModel):
    text: str


class VoiceMessageRequest(BaseModel):
    message: str
    history: list[dict] = []


# ============================================================
# ENDPOINTS
# ============================================================


@router.post("/tts")
async def tts_endpoint(req: TTSRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")

    try:
        audio_bytes = await text_to_speech(req.text)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        print(f"[TTS] Error for text: '{req.text[:80]}...' -> {e}")
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")


@router.post("/stt")
async def stt_endpoint(file: UploadFile = File(...), language: str = Form("vi")):
    """Receive audio file, transcribe with Groq Whisper API."""
    import httpx

    groq_key = os.getenv("GROQ_API_KEY", "")
    if not groq_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured on server")

    audio_data = await file.read()
    if len(audio_data) < 100:
        raise HTTPException(status_code=400, detail="Audio too short")

    # Determine file extension from content type
    ext = ".webm"
    if file.content_type:
        if "wav" in file.content_type:
            ext = ".wav"
        elif "mp3" in file.content_type or "mpeg" in file.content_type:
            ext = ".mp3"
        elif "ogg" in file.content_type:
            ext = ".ogg"
        elif "mp4" in file.content_type or "m4a" in file.content_type:
            ext = ".m4a"

    # Write to temp file (Groq API needs file upload)
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(audio_data)
        tmp_path = tmp.name

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            with open(tmp_path, "rb") as f:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {groq_key}"},
                    files={"file": (f"audio{ext}", f, file.content_type or "audio/webm")},
                    data={
                        "model": "whisper-large-v3-turbo",
                        "language": language,
                        "response_format": "json",
                    },
                )

        if resp.status_code != 200:
            print(f"[STT] Groq Whisper error {resp.status_code}: {resp.text[:300]}")
            raise HTTPException(status_code=502, detail=f"Groq Whisper error: {resp.text[:200]}")

        result = resp.json()
        text = result.get("text", "").strip()
        print(f"[STT] Groq transcribed: '{text[:100]}'")
        return {"text": text}

    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass





@router.post("/sessions/{session_id}/message")
async def voice_message(
    session_id: int,
    req: VoiceMessageRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    session = db.query(MockSession).filter(MockSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Ownership check
    if session.user_id is not None:
        if not current_user or current_user.id != session.user_id:
            raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập phiên phỏng vấn này")

    job = session.job

    try:
        ai_response = await voice_interview_respond(
            position=job.title,
            level=job.level,
            tech_stack=job.tech_stack_list,
            messages=[{"role": "user", "content": req.message}],
            session_id=str(session_id)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI respond failed: {str(e)}")

    questions = session.questions
    answered_count = sum(1 for q in questions if q.user_answer)
    if answered_count < len(questions):
        q = questions[answered_count]
        q.user_answer = req.message
        db.commit()

    return {"response": ai_response}


@router.post("/sessions/{session_id}/message-stream")
async def voice_message_stream(
    session_id: int,
    req: VoiceMessageRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """SSE streaming version — streams AI response sentence-by-sentence."""
    session = db.query(MockSession).filter(MockSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Ownership check
    if session.user_id is not None:
        if not current_user or current_user.id != session.user_id:
            raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập phiên phỏng vấn này")

    job = session.job

    # Save user answer to DB
    questions = session.questions
    answered_count = sum(1 for q in questions if q.user_answer)
    if answered_count < len(questions):
        q = questions[answered_count]
        q.user_answer = req.message
        db.commit()

    async def event_generator():
        full_text = ""
        try:
            async for sentence in voice_interview_respond_stream(
                position=job.title,
                level=job.level,
                tech_stack=job.tech_stack_list,
                messages=[{"role": "user", "content": req.message}],
                session_id=str(session_id)
            ):
                full_text += (" " + sentence if full_text else sentence)
                yield f"data: {json.dumps({'type': 'sentence', 'text': sentence}, ensure_ascii=False)}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'full_text': full_text}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/check-limit")
def check_voice_limit(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Check if the current user is allowed to perform a voice interview (free plan = 1 per 24h)."""
    if not current_user:
        return {"allowed": False, "reason": "login_required", "plan": "none", "hoursLeft": 0}

    now = datetime.now(timezone.utc)
    plan = current_user.plan or "free"

    # Check expiration if pro or premium
    if plan in ("pro", "premium") and current_user.plan_expired_at:
        expiry = current_user.plan_expired_at
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if now > expiry:
            current_user.plan = "free"
            plan = "free"
            db.commit()

    if plan in ("pro", "premium"):
        return {"allowed": True, "plan": plan, "remainingSeconds": 0, "hoursLeft": 0}

    # Free plan: 1 session per 24 hours
    if not current_user.last_voice_session_at:
        return {"allowed": True, "plan": "free", "remainingSeconds": 0, "hoursLeft": 0}

    last_voice = current_user.last_voice_session_at
    if last_voice.tzinfo is None:
        last_voice = last_voice.replace(tzinfo=timezone.utc)

    delta = now - last_voice
    cooldown_seconds = 24 * 3600
    if delta.total_seconds() < cooldown_seconds:
        remaining_seconds = int(cooldown_seconds - delta.total_seconds())
        hours_left = round(remaining_seconds / 3600, 1)
        return {
            "allowed": False,
            "reason": "cooldown",
            "plan": "free",
            "remainingSeconds": remaining_seconds,
            "hoursLeft": hours_left,
            "lastVoiceAt": last_voice.isoformat(),
        }

    return {"allowed": True, "plan": "free", "remainingSeconds": 0, "hoursLeft": 0}


@router.post("/record-usage")
def record_voice_usage(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Record that a voice session was started for cooldown tracking."""
    if current_user:
        current_user.last_voice_session_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(current_user)
        return {"success": True, "lastVoiceSessionAt": current_user.last_voice_session_at.isoformat()}
    return {"success": False}



# -*- coding: utf-8 -*-
"""API routes for voice interview — TTS + STT (WebSocket streaming) + conversational AI."""

import json
from pathlib import Path

import numpy as np
import sherpa_onnx
from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ai_service import text_to_speech, voice_interview_respond, voice_interview_respond_stream
from database import get_db
from models import MockSession

router = APIRouter(prefix="/api/voice", tags=["voice"])

# ============================================================
# SHERPA-ONNX STREAMING RECOGNIZER (singleton)
# ============================================================

_recognizer = None


def _get_recognizer():
    global _recognizer
    if _recognizer is None:
        base = Path(__file__).resolve().parent.parent / "models" / "sherpa-onnx-streaming-zipformer-ar_en_id_ja_ru_th_vi_zh-2025-02-10"
        _recognizer = sherpa_onnx.OnlineRecognizer.from_transducer(
            tokens=str(base / "tokens.txt"),
            encoder=str(base / "encoder-epoch-75-avg-11-chunk-16-left-128.int8.onnx"),
            decoder=str(base / "decoder-epoch-75-avg-11-chunk-16-left-128.onnx"),
            joiner=str(base / "joiner-epoch-75-avg-11-chunk-16-left-128.int8.onnx"),
            num_threads=2,
            sample_rate=16000,
            feature_dim=80,
            enable_endpoint_detection=True,
            rule1_min_trailing_silence=2.4,
            rule2_min_trailing_silence=1.2,
            rule3_min_utterance_length=300,
            decoding_method="greedy_search",
            provider="cpu",
        )
    return _recognizer


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
async def stt_endpoint(request: Request):
    """Receive raw PCM float32 audio at given sample rate, transcribe with sherpa-onnx."""
    body = await request.body()
    if len(body) < 100:
        raise HTTPException(status_code=400, detail="Audio too short")

    # Header: first 4 bytes = sample rate as uint32 LE, rest = float32 PCM
    sample_rate = int.from_bytes(body[:4], byteorder="little")
    pcm_bytes = body[4:]

    samples = np.frombuffer(pcm_bytes, dtype=np.float32)

    if len(samples) < 1600:
        raise HTTPException(status_code=400, detail="Audio too short")

    recognizer = _get_recognizer()
    stream = recognizer.create_stream()
    stream.accept_waveform(sample_rate, samples)

    # Add tail padding and signal end
    tail_padding = np.zeros(int(sample_rate * 0.5), dtype=np.float32)
    stream.accept_waveform(sample_rate, tail_padding)
    stream.input_finished()

    while recognizer.is_ready(stream):
        recognizer.decode_stream(stream)

    text = recognizer.get_result(stream).strip()

    return {"text": text}


@router.websocket("/ws-stt")
async def ws_stt(websocket: WebSocket):
    """WebSocket streaming STT — receives PCM chunks, returns partial results in real-time."""
    await websocket.accept()

    recognizer = _get_recognizer()
    stream = recognizer.create_stream()
    sample_rate = 48000  # will be overridden by first message
    last_text = ""

    try:
        while True:
            message = await websocket.receive()

            # Text message "END" signals client is done speaking
            if "text" in message:
                if message["text"] == "END":
                    break
                continue

            data = message.get("bytes", b"")

            # First 4 bytes of every chunk = sample rate, rest = float32 PCM
            if len(data) <= 4:
                continue

            sample_rate = int.from_bytes(data[:4], byteorder="little")
            samples = np.frombuffer(data[4:], dtype=np.float32)

            stream.accept_waveform(sample_rate, samples)

            while recognizer.is_ready(stream):
                recognizer.decode_stream(stream)

            text = recognizer.get_result(stream).strip()
            if text and text != last_text:
                last_text = text
                await websocket.send_json({"partial": text})

    except WebSocketDisconnect:
        return
    except Exception:
        return

    # Finalize — client sent "END", connection still open
    try:
        tail_padding = np.zeros(int(sample_rate * 0.3), dtype=np.float32)
        stream.accept_waveform(sample_rate, tail_padding)
        stream.input_finished()
        while recognizer.is_ready(stream):
            recognizer.decode_stream(stream)
        final_text = recognizer.get_result(stream).strip()
        await websocket.send_json({"final": final_text or last_text})
        await websocket.close()
    except Exception:
        pass


@router.post("/sessions/{session_id}/message")
async def voice_message(session_id: int, req: VoiceMessageRequest, db: Session = Depends(get_db)):
    session = db.query(MockSession).filter(MockSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

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
async def voice_message_stream(session_id: int, req: VoiceMessageRequest, db: Session = Depends(get_db)):
    """SSE streaming version — streams AI response sentence-by-sentence."""
    session = db.query(MockSession).filter(MockSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

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


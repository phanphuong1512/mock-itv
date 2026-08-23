# -*- coding: utf-8 -*-
"""
MockITV Backend — FastAPI Application Entry Point.

Run: python main.py
- Auto-creates SQLite database
- Seeds initial data (jobs, sessions, questions)
- Starts uvicorn server on port 8000
"""

import os
import sys

# Ensure UTF-8 output on all platforms
os.environ.setdefault("PYTHONIOENCODING", "utf-8")
if sys.stdout.encoding != "utf-8":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

from dotenv import load_dotenv
load_dotenv()  # Load .env before anything else

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from database import init_db, SessionLocal
from seed_data import seed_database
from routes.jobs import router as jobs_router
from routes.sessions import router as sessions_router
from routes.voice import router as voice_router


app = FastAPI(
    title="MockITV API",
    description="Backend API for MockITV — AI-powered mock interview platform by PhuongPV",
    version="1.0.0",
)

# CORS: Allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(jobs_router)
app.include_router(sessions_router)
app.include_router(voice_router)


# Custom JSON response with UTF-8
@app.middleware("http")
async def utf8_response_middleware(request, call_next):
    response = await call_next(request)
    if "application/json" in response.headers.get("content-type", ""):
        response.headers["content-type"] = "application/json; charset=utf-8"
    return response


@app.on_event("startup")
def on_startup():
    """Initialize database and seed data on server start."""
    print("[MockITV] 🚀 Initializing database...")
    init_db()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    print("[MockITV] ✅ Server ready at http://localhost:8000")
    print("[MockITV] 📖 API docs at http://localhost:8000/docs")


@app.get("/")
def root():
    return {"message": "MockITV API is running", "docs": "/docs"}


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "MockITV Backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
# Auto-reloaded database cleanly

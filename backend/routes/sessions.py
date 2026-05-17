# -*- coding: utf-8 -*-
"""API routes for mock interview sessions — includes AI evaluation."""

import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import MockJob, MockSession, SessionQuestion
from ai_service import generate_questions, batch_evaluate_session

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


# ---- Request Models ----

class CreateSessionRequest(BaseModel):
    job_id: int
    questions_count: int = 7


class SubmitAnswerRequest(BaseModel):
    question_id: int
    answer: str


# ---- Endpoints ----

@router.get("")
def list_sessions(db: Session = Depends(get_db)):
    """Get all completed mock sessions (for history page)."""
    sessions = (
        db.query(MockSession)
        .order_by(MockSession.created_at.desc())
        .all()
    )
    return [s.to_dict() for s in sessions]


@router.get("/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get detailed session with all questions and evaluations."""
    session = db.query(MockSession).filter(MockSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.to_dict(include_questions=True)


@router.post("")
async def create_session(req: CreateSessionRequest, db: Session = Depends(get_db)):
    """
    Create a new mock interview session.
    AI generates interview questions via function calling.
    """
    job = db.query(MockJob).filter(MockJob.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Create session
    session = MockSession(job_id=job.id, status="in_progress")
    db.add(session)
    db.flush()

    # AI generates questions
    try:
        ai_questions = await generate_questions(
            position=job.title,
            level=job.level,
            tech_stack=job.tech_stack_list,
            count=req.questions_count,
        )
    except Exception as e:
        print(f"[AI] ⚠️ Failed to generate questions: {e}")
        # Fallback: generic questions
        ai_questions = [
            {"question_text": f"Câu hỏi kỹ thuật {i+1} cho vị trí {job.title}", "tag": "technical"}
            for i in range(req.questions_count)
        ]

    # Save questions
    for i, q in enumerate(ai_questions):
        question = SessionQuestion(
            session_id=session.id,
            question_order=i + 1,
            tag=q.get("tag", "technical"),
            question_text=q.get("question_text", ""),
        )
        db.add(question)

    db.commit()
    db.refresh(session)
    return session.to_dict(include_questions=True)


@router.post("/{session_id}/answer")
def submit_answer(session_id: int, req: SubmitAnswerRequest, db: Session = Depends(get_db)):
    """Submit a user answer for a specific question."""
    question = db.query(SessionQuestion).filter(
        SessionQuestion.id == req.question_id,
        SessionQuestion.session_id == session_id,
    ).first()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found in this session")

    question.user_answer = req.answer
    db.commit()
    return {"status": "ok", "questionId": question.id}


@router.post("/{session_id}/evaluate")
async def evaluate_session(session_id: int, db: Session = Depends(get_db)):
    """
    Trigger AI evaluation for entire session using batching.
    
    Phase 1: Parallel evaluate all answers
    Phase 2: Generate overall assessment
    """
    session = db.query(MockSession).filter(MockSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    job = session.job
    questions = session.questions

    # Prepare question data for AI
    questions_data = [
        {
            "question_text": q.question_text,
            "user_answer": q.user_answer or "",
        }
        for q in questions
    ]

    # Batch AI evaluation (parallel)
    try:
        results = await batch_evaluate_session(
            position=job.title,
            level=job.level,
            questions=questions_data,
        )
    except Exception as e:
        print(f"[AI] ⚠️ Batch evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI evaluation failed: {str(e)}")

    # Save per-question evaluations
    evaluations = results["evaluations"]
    for i, q in enumerate(questions):
        if i < len(evaluations):
            ev = evaluations[i]
            q.score = ev.get("score", 0)
            q.analysis_chunks = json.dumps(ev.get("analysis_chunks", []), ensure_ascii=False)
            q.feedback_chunks = json.dumps(ev.get("feedback_chunks", []), ensure_ascii=False)
            q.strengths = json.dumps(ev.get("strengths", []), ensure_ascii=False)
            q.weaknesses = json.dumps(ev.get("weaknesses", []), ensure_ascii=False)
            q.recommendations = json.dumps(ev.get("recommendations", []), ensure_ascii=False)

    # Save overall assessment
    overall = results["overall"]
    session.overall_score = overall.get("overall_score", 0)
    session.technical_score = overall.get("technical_score", 0)
    session.communication_score = overall.get("communication_score", 0)
    session.problem_solving_score = overall.get("problem_solving_score", 0)
    session.ai_overall_feedback = overall.get("feedback_text", "")
    session.strengths = json.dumps(overall.get("strengths", []), ensure_ascii=False)
    session.weaknesses = json.dumps(overall.get("weaknesses", []), ensure_ascii=False)
    session.topics_to_learn = json.dumps(overall.get("topics_to_learn", []), ensure_ascii=False)
    session.resources = json.dumps(overall.get("resources", []), ensure_ascii=False)
    session.status = "completed"

    db.commit()
    db.refresh(session)
    return session.to_dict(include_questions=True)

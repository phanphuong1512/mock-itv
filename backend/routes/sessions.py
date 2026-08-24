# -*- coding: utf-8 -*-
"""API routes for mock interview sessions — includes AI evaluation."""

import io
import json
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import MockJob, MockSession, SessionQuestion, User
from routes.auth import get_optional_user
from ai_service import analyze_cv, generate_questions, batch_evaluate_session, generate_custom_questions, index_document


router = APIRouter(prefix="/api/sessions", tags=["sessions"])


# ---- Request Models ----

class AnalyzeCVRequest(BaseModel):
    job_id: int
    cv_text: str


class CreateSessionRequest(BaseModel):
    job_id: int
    questions_count: int = 7
    cv_text: Optional[str] = None


class SubmitAnswerRequest(BaseModel):
    question_id: int
    answer: str


# ---- Constants ----

_MAX_CV_FILE_BYTES = 5 * 1024 * 1024  # 5 MB


# ---- CV File Parsers ----

def _extract_text_from_pdf(content: bytes) -> str:
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(content))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Không thể đọc file PDF: {e}")


def _extract_text_from_docx(content: bytes) -> str:
    try:
        import docx
        doc = docx.Document(io.BytesIO(content))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Không thể đọc file DOCX: {e}")


# ---- Endpoints ----

@router.post("/analyze-cv")
async def analyze_cv_endpoint(req: AnalyzeCVRequest, db: Session = Depends(get_db)):
    """Analyze a candidate's CV against a job and return structured insights."""
    job = db.query(MockJob).filter(MockJob.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    result = await analyze_cv(
        cv_text=req.cv_text,
        position=job.title,
        tech_stack=job.tech_stack_list,
    )
    return result


@router.post("/parse-cv")
async def parse_cv_file(file: UploadFile = File(...)):
    """Extract plain text from an uploaded PDF or DOCX CV file (max 5 MB)."""
    filename = (file.filename or "").lower()
    content = await file.read()

    if len(content) > _MAX_CV_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File quá lớn. Giới hạn tối đa {_MAX_CV_FILE_BYTES // (1024 * 1024)} MB.",
        )

    if filename.endswith(".pdf"):
        text = _extract_text_from_pdf(content)
    elif filename.endswith(".docx"):
        text = _extract_text_from_docx(content)
    else:
        raise HTTPException(
            status_code=400,
            detail="Chỉ hỗ trợ file PDF (.pdf) hoặc Word (.docx)",
        )

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="Không thể đọc nội dung từ file này. File có thể là ảnh scan hoặc bị lỗi.",
        )

    return {"text": text.strip()}


@router.post("/custom-mock")
async def create_custom_mock_session(
    file: UploadFile = File(...),
    type: str = Form(...), # "cv" or "jd"
    questions_count: int = Form(7),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Upload CV/JD, process it, upload to Pinecone, and generate a custom mock session.
    """
    filename = (file.filename or "").lower()
    content = await file.read()

    if len(content) > _MAX_CV_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File quá lớn. Giới hạn tối đa {_MAX_CV_FILE_BYTES // (1024 * 1024)} MB.",
        )

    # Extract text
    if filename.endswith(".pdf"):
        text = _extract_text_from_pdf(content)
    elif filename.endswith(".docx"):
        text = _extract_text_from_docx(content)
    else:
        raise HTTPException(
            status_code=400,
            detail="Chỉ hỗ trợ file PDF (.pdf) hoặc Word (.docx)",
        )

    if not text.strip():
        raise HTTPException(status_code=422, detail="Không thể đọc nội dung từ file.")

    # Create Mock Session tied to Job 999
    job_id = 999
    job = db.query(MockJob).filter(MockJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=500, detail="Custom Mock Job not initialized in DB.")

    session = MockSession(
        job_id=job.id,
        user_id=current_user.id if current_user else None,
        status="in_progress"
    )
    db.add(session)
    db.flush()
    
    namespace = f"session_{session.id}"

    # Index into Pinecone
    try:
        index_document(text, namespace)
    except Exception as e:
        db.rollback()
        print(f"[AI] ⚠️ Pinecone indexing failed: {e}")
        raise HTTPException(status_code=500, detail="Lỗi khi xử lý vector DB.")

    # Generate questions using RAG
    try:
        mock_type_str = "CV" if type.lower() == "cv" else "Job Description"
        ai_questions = await generate_custom_questions(
            namespace=namespace,
            mock_type=mock_type_str,
            count=questions_count
        )
        if not ai_questions or len(ai_questions) == 0:
            raise ValueError("Không nhận được câu hỏi từ AI.")
    except Exception as e:
        db.rollback()
        print(f"[AI] ❌ Failed to generate custom questions: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Không thể khởi tạo câu hỏi từ tài liệu qua AI: {str(e)}"
        )


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


@router.get("")
def list_sessions(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Get all completed mock sessions for the authenticated user only."""
    if not current_user:
        return []
    
    sessions = (
        db.query(MockSession)
        .filter(MockSession.user_id == current_user.id)
        .order_by(MockSession.created_at.desc())
        .all()
    )
    return [s.to_dict() for s in sessions]


@router.get("/{session_id}")
def get_session(
    session_id: int, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Get detailed session with all questions and evaluations."""
    session = db.query(MockSession).filter(MockSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check ownership if session is bound to a user
    if session.user_id is not None:
        if not current_user or current_user.id != session.user_id:
            raise HTTPException(status_code=403, detail="Bạn không có quyền xem bài phỏng vấn này")

    return session.to_dict(include_questions=True)



@router.post("")
async def create_session(
    req: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Create a new mock interview session.
    AI generates interview questions via function calling.
    """
    job = db.query(MockJob).filter(MockJob.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Create session
    session = MockSession(
        job_id=job.id,
        user_id=current_user.id if current_user else None,
        status="in_progress"
    )
    db.add(session)
    db.flush()


    # Analyze CV if provided
    cv_context = None
    if req.cv_text and req.cv_text.strip():
        try:
            cv_context = await analyze_cv(
                cv_text=req.cv_text,
                position=job.title,
                tech_stack=job.tech_stack_list,
            )
        except Exception as e:
            print(f"[AI] ⚠️ CV analysis failed, proceeding without: {e}")

    # AI generates questions
    try:
        ai_questions = await generate_questions(
            position=job.title,
            level=job.level,
            tech_stack=job.tech_stack_list,
            count=req.questions_count,
            cv_context=cv_context,
        )
        if not ai_questions or len(ai_questions) == 0:
            raise ValueError("Không nhận được câu hỏi từ AI.")
    except Exception as e:
        db.rollback()
        print(f"[AI] ❌ Failed to generate questions: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Không thể khởi tạo câu hỏi từ AI: {str(e)}"
        )


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

    question.user_answer = (req.answer or "").strip()
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

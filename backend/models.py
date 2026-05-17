# -*- coding: utf-8 -*-
"""SQLAlchemy ORM models for MockITV."""

import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class MockJob(Base):
    """A mock interview job position."""
    __tablename__ = "mock_jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)      # backend, frontend, devops...
    level = Column(String(50), nullable=False)          # Intern, Fresher, Junior...
    department = Column(String(50), nullable=False)     # Backend, Frontend...
    tech_stack = Column(Text, nullable=False, default="[]")  # JSON array
    rounds = Column(Integer, default=3)
    logo_url = Column(String(500), default="")

    sessions = relationship("MockSession", back_populates="job")

    @property
    def tech_stack_list(self) -> list[str]:
        return json.loads(self.tech_stack) if self.tech_stack else []

    @tech_stack_list.setter
    def tech_stack_list(self, value: list[str]):
        self.tech_stack = json.dumps(value, ensure_ascii=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "category": self.category,
            "level": self.level,
            "department": self.department,
            "techStack": self.tech_stack_list,
            "rounds": self.rounds,
            "logo": self.logo_url,
        }


class MockSession(Base):
    """A completed mock interview session."""
    __tablename__ = "mock_sessions"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("mock_jobs.id"), nullable=False)
    status = Column(String(20), default="in_progress")  # in_progress, completed
    overall_score = Column(Integer, default=0)
    technical_score = Column(Integer, default=0)
    communication_score = Column(Integer, default=0)
    problem_solving_score = Column(Integer, default=0)
    ai_overall_feedback = Column(Text, default="")
    strengths = Column(Text, default="[]")               # JSON array
    weaknesses = Column(Text, default="[]")              # JSON array
    topics_to_learn = Column(Text, default="[]")         # JSON array
    resources = Column(Text, default="[]")               # JSON array
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    job = relationship("MockJob", back_populates="sessions")
    questions = relationship("SessionQuestion", back_populates="session", order_by="SessionQuestion.question_order")

    def to_dict(self, include_questions: bool = False) -> dict:
        job = self.job
        result = {
            "id": self.id,
            "jobId": self.job_id,
            "position": job.title if job else "",
            "department": job.department if job else "",
            "level": job.level if job else "",
            "company": job.company if job else "",
            "techStack": job.tech_stack_list if job else [],
            "status": self.status,
            "date": self.created_at.strftime("%d/%m/%Y") if self.created_at else "",
            "questionsCount": len(self.questions),
            "score": self.overall_score,
            "technicalScore": self.technical_score,
            "communicationScore": self.communication_score,
            "problemSolvingScore": self.problem_solving_score,
            "aiOverallFeedback": self.ai_overall_feedback,
            "strengths": json.loads(self.strengths) if self.strengths else [],
            "weaknesses": json.loads(self.weaknesses) if self.weaknesses else [],
            "topicsToLearn": json.loads(self.topics_to_learn) if self.topics_to_learn else [],
            "resources": json.loads(self.resources) if self.resources else [],
        }
        if include_questions:
            result["questions"] = [q.to_dict() for q in self.questions]
        return result


class SessionQuestion(Base):
    """A question within a mock interview session."""
    __tablename__ = "session_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("mock_sessions.id"), nullable=False)
    question_order = Column(Integer, nullable=False)
    tag = Column(String(50), default="technical")
    question_text = Column(Text, nullable=False)
    user_answer = Column(Text, default="")
    score = Column(Integer, default=0)
    analysis_chunks = Column(Text, default="[]")   # JSON array of HighlightItem
    feedback_chunks = Column(Text, default="[]")   # JSON array of HighlightItem
    strengths = Column(Text, default="[]")         # JSON array
    weaknesses = Column(Text, default="[]")        # JSON array
    recommendations = Column(Text, default="[]")   # JSON array

    session = relationship("MockSession", back_populates="questions")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "text": f"C\u00e2u h\u1ecfi {self.question_order}",
            "tag": self.tag,
            "score": self.score,
            "questionText": self.question_text,
            "userAnswer": self.user_answer,
            "analysisChunks": json.loads(self.analysis_chunks) if self.analysis_chunks else [],
            "feedbackChunks": json.loads(self.feedback_chunks) if self.feedback_chunks else [],
            "strengths": json.loads(self.strengths) if self.strengths else [],
            "weaknesses": json.loads(self.weaknesses) if self.weaknesses else [],
            "recommendations": json.loads(self.recommendations) if self.recommendations else [],
        }

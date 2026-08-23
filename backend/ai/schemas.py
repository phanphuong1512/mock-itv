from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Literal

QuestionTag = Literal["technical", "behavioral", "problem-solving"]
ChunkType = Literal["success", "warning", "danger", "normal"]

class QuestionItem(BaseModel):
    question_text: str
    tag: QuestionTag

class GenerateQuestionsArgs(BaseModel):
    questions: list[QuestionItem]

class AnalysisChunk(BaseModel):
    id: str
    text: str
    type: ChunkType
    popupTitle: str
    popupDesc: str
    statusText: str

class FeedbackChunk(BaseModel):
    id: str
    text: str
    type: ChunkType
    popupTitle: str
    popupDesc: str
    statusText: str

class PerQuestionEvaluation(BaseModel):
    question_index: int
    score: int
    analysis_chunks: list[AnalysisChunk] = Field(default_factory=list)
    feedback_chunks: list[FeedbackChunk] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

class OverallEvaluation(BaseModel):
    overall_score: int
    technical_score: int
    communication_score: int
    problem_solving_score: int
    feedback_text: str
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    topics_to_learn: list[str] = Field(default_factory=list)
    resources: list[str] = Field(default_factory=list)

class EvaluateSessionArgs(BaseModel):
    evaluations: list[PerQuestionEvaluation]
    overall: OverallEvaluation

# Output giữ giống shape bạn đang return
class CleanPerQuestionEvaluation(BaseModel):
    score: int
    analysis_chunks: list[dict] = Field(default_factory=list)
    feedback_chunks: list[dict] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

class CleanOverall(BaseModel):
    overall_score: int
    technical_score: int
    communication_score: int
    problem_solving_score: int
    feedback_text: str
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    topics_to_learn: list[str] = Field(default_factory=list)
    resources: list[str] = Field(default_factory=list)

class CleanEvaluateSessionResult(BaseModel):
    evaluations: list[CleanPerQuestionEvaluation]
    overall: CleanOverall


# ── CV Analysis ──────────────────────────────────────────────

CandidateLevel = Literal[
    "Intern", "Fresher", "Junior", "Middle", "Senior", "Lead"
]


class NotableProject(BaseModel):
    name: str
    tech_used: list[str] = Field(default_factory=list)
    ask_about: str = Field(
        default="",
        description="Specific angle to probe during the interview",
    )


class AnalyzeCVArgs(BaseModel):
    candidate_level: CandidateLevel
    confirmed_skills: list[str] = Field(default_factory=list)
    skill_gaps: list[str] = Field(default_factory=list)
    notable_projects: list[NotableProject] = Field(default_factory=list)
    interview_focus_areas: list[str] = Field(default_factory=list)
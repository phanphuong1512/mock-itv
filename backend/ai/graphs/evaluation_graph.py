import json
from typing import TypedDict, List, Dict, Any, Literal
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field

from ..config import load_config
from ..chains import build_llm, ainvoke_with_retry_429
from ..validators import build_qa_block, validate_verbatim_chunks, VerbatimChunksError

# --- State ---
class EvaluationState(TypedDict):
    position: str
    level: str
    questions: List[Dict[str, Any]]
    qa_block: str
    
    technical_evals: Dict[str, Any]
    behavioral_evals: Dict[str, Any]
    
    verbatim_chunks_per_q: Dict[str, Any]
    verbatim_errors: str
    verbatim_retries: int
    
    final_result: Dict[str, Any]

# --- Schemas for Tools ---
class TechQuestionEval(BaseModel):
    question_index: int
    technical_score: int
    technical_strengths: list[str] = Field(default_factory=list)
    technical_weaknesses: list[str] = Field(default_factory=list)

class TechEvalResult(BaseModel):
    evaluations: list[TechQuestionEval]
    overall_technical_score: int
    topics_to_learn: list[str] = Field(default_factory=list)

class BehavQuestionEval(BaseModel):
    question_index: int
    communication_score: int
    problem_solving_score: int
    behavioral_strengths: list[str] = Field(default_factory=list)
    behavioral_weaknesses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

class BehavEvalResult(BaseModel):
    evaluations: list[BehavQuestionEval]
    overall_communication_score: int
    overall_problem_solving_score: int
    resources: list[str] = Field(default_factory=list)

class AnalysisChunk(BaseModel):
    id: str
    text: str
    type: Literal["success", "warning", "danger", "normal"]
    popupTitle: str
    popupDesc: str
    statusText: str

class FeedbackChunk(BaseModel):
    id: str
    text: str
    type: Literal["success", "warning", "danger", "normal"]
    popupTitle: str
    popupDesc: str
    statusText: str

class VerbatimQuestionEval(BaseModel):
    question_index: int
    analysis_chunks: list[AnalysisChunk] = Field(default_factory=list)
    feedback_chunks: list[FeedbackChunk] = Field(default_factory=list)

class VerbatimEvalResult(BaseModel):
    evaluations: list[VerbatimQuestionEval]

class OverallSynthesis(BaseModel):
    feedback_text: str
    strengths: list[str]
    weaknesses: list[str]


# --- Nodes ---
async def technical_grader_node(state: EvaluationState) -> EvaluationState:
    cfg = load_config()
    llm = build_llm(cfg, temperature=0.2).with_structured_output(TechEvalResult)
    
    prompt = f"""Bạn là một Giám đốc Kỹ thuật. Hãy đánh giá kỹ năng chuyên môn (technical) của ứng viên cho vị trí {state['level']} {state['position']}.
    Dưới đây là phần trả lời của họ:
    {state['qa_block']}
    
    Hãy chấm điểm technical_score (0-100) cho từng câu, và overall_technical_score cho toàn bộ."""
    
    try:
        res = await ainvoke_with_retry_429(llm, [HumanMessage(content=prompt)], retries=cfg.max_retries_429)
        state['technical_evals'] = res.model_dump()
    except Exception as e:
        print(f"[AI] Tech grader error: {e}")
        state['technical_evals'] = {"evaluations": [], "overall_technical_score": 0, "topics_to_learn": ["Không thể phân tích do lỗi kết nối AI"]}
    return state


async def behavioral_grader_node(state: EvaluationState) -> EvaluationState:
    cfg = load_config()
    llm = build_llm(cfg, temperature=0.2).with_structured_output(BehavEvalResult)
    
    prompt = f"""Bạn là chuyên gia nhân sự. Hãy đánh giá kỹ năng giao tiếp và giải quyết vấn đề của ứng viên cho vị trí {state['level']} {state['position']}.
    Dưới đây là phần trả lời của họ:
    {state['qa_block']}
    
    Hãy chấm điểm communication_score và problem_solving_score (0-100) cho từng câu, kèm theo tổng điểm."""
    
    try:
        res = await ainvoke_with_retry_429(llm, [HumanMessage(content=prompt)], retries=cfg.max_retries_429)
        state['behavioral_evals'] = res.model_dump()
    except Exception as e:
        print(f"[AI] Behav grader error: {e}")
        state['behavioral_evals'] = {"evaluations": [], "overall_communication_score": 0, "overall_problem_solving_score": 0, "resources": ["Không thể phân tích do lỗi kết nối AI"]}
    return state


async def verbatim_highlighter_node(state: EvaluationState) -> EvaluationState:
    cfg = load_config()
    llm = build_llm(cfg, temperature=0.1).with_structured_output(VerbatimEvalResult)
    
    prompt = f"""Bạn là một chuyên gia rà soát nguyên văn. Hãy bóc tách chính xác nguyên văn câu trả lời của ứng viên thành các analysis_chunks.
    Dưới đây là phần trả lời gốc:
    {state['qa_block']}
    
    QUAN TRỌNG:
    - analysis_chunks[].text khi nối lại phải khớp 100% với câu trả lời gốc của ứng viên.
    - Phân loại type: success, warning, danger, normal.
    - Cung cấp popupTitle, popupDesc giải thích lỗi sai.
    - Cũng sinh ra feedback_chunks nhận xét chung cho câu."""
    
    if state.get('verbatim_errors'):
        prompt += f"\n\nLẦN TRƯỚC BẠN ĐÃ LÀM SAI:\n{state['verbatim_errors']}\nHÃY SỬA LẠI CHO ĐÚNG NGUYÊN VĂN!"

    try:
        res = await ainvoke_with_retry_429(llm, [HumanMessage(content=prompt)], retries=cfg.max_retries_429)
        state['verbatim_chunks_per_q'] = res.model_dump()
    except Exception as e:
        print(f"[AI] Verbatim highlighter error: {e}")
        state['verbatim_chunks_per_q'] = {"evaluations": []}
    return state


async def verbatim_verifier_node(state: EvaluationState) -> EvaluationState:
    try:
        evals = state['verbatim_chunks_per_q'].get('evaluations', [])
        for idx, q in enumerate(state['questions']):
            user_answer = q.get("user_answer", "") or ""
            # Find matching eval
            ev = next((e for e in evals if e['question_index'] == idx + 1), None)
            if not ev:
                raise VerbatimChunksError(f"Missing verbatim chunks for question {idx + 1}")
            validate_verbatim_chunks(user_answer, ev['analysis_chunks'], question_index=idx + 1)
        
        state['verbatim_errors'] = ""
    except VerbatimChunksError as e:
        state['verbatim_errors'] = str(e)
        state['verbatim_retries'] = state.get('verbatim_retries', 0) + 1
    
    return state


def route_verbatim(state: EvaluationState) -> str:
    cfg = load_config()
    if state.get('verbatim_errors') and state.get('verbatim_retries', 0) <= cfg.verbatim_fix_retries:
        return "retry"
    return "synthesize"


async def synthesizer_node(state: EvaluationState) -> EvaluationState:
    tech_evals = state.get('technical_evals', {})
    behav_evals = state.get('behavioral_evals', {})
    verb_evals = state.get('verbatim_chunks_per_q', {})
    
    t_list = {e['question_index']: e for e in tech_evals.get('evaluations', [])}
    b_list = {e['question_index']: e for e in behav_evals.get('evaluations', [])}
    v_list = {e['question_index']: e for e in verb_evals.get('evaluations', [])}
    
    clean_evals = []
    
    overall_tech = tech_evals.get('overall_technical_score', 50)
    overall_comm = behav_evals.get('overall_communication_score', 50)
    overall_prob = behav_evals.get('overall_problem_solving_score', 50)
    
    overall_score = int((overall_tech + overall_comm + overall_prob) / 3)
    
    # Merge
    for idx, q in enumerate(state['questions']):
        q_idx = idx + 1
        t = t_list.get(q_idx, {})
        b = b_list.get(q_idx, {})
        v = v_list.get(q_idx, {})
        
        score = int((t.get('technical_score', 0) + b.get('communication_score', 0) + b.get('problem_solving_score', 0)) / 3)
        if score == 0:
            score = 50
            
        clean_evals.append({
            "score": score,
            "analysis_chunks": v.get('analysis_chunks', [{"id": "1", "text": q.get('user_answer', ''), "type": "normal", "popupTitle": "", "popupDesc": "", "statusText": ""}]),
            "feedback_chunks": v.get('feedback_chunks', []),
            "strengths": t.get('technical_strengths', []) + b.get('behavioral_strengths', []),
            "weaknesses": t.get('technical_weaknesses', []) + b.get('behavioral_weaknesses', []),
            "recommendations": b.get('recommendations', [])
        })

    cfg = load_config()
    try:
        llm = build_llm(cfg, temperature=0.3).with_structured_output(OverallSynthesis)
        prompt = f"""Dựa vào phần trả lời của ứng viên, hãy tổng hợp nhận xét chung.
Vị trí: {state['position']} ({state['level']})

Chi tiết đánh giá chuyên môn:
{tech_evals}

Chi tiết đánh giá kỹ năng mềm:
{behav_evals}

Hãy viết một đoạn feedback_text tóm tắt toàn diện, khách quan (3-4 câu).
Cùng với đó, chỉ ra tối đa 3 điểm mạnh nổi bật nhất và 3 điểm yếu lớn nhất của ứng viên trong toàn bộ buổi phỏng vấn."""
        
        synthesis = await ainvoke_with_retry_429(llm, [HumanMessage(content=prompt)], retries=cfg.max_retries_429)
        fb_text = synthesis.feedback_text
        sts = synthesis.strengths
        wks = synthesis.weaknesses
    except Exception as e:
        print(f"[AI] Synthesizer LLM error: {e}")
        fb_text = "Không thể tạo nhận xét chung do lỗi hệ thống AI. Vui lòng thử lại sau."
        sts = ["Không có dữ liệu do lỗi hệ thống AI"]
        wks = ["Không có dữ liệu do lỗi hệ thống AI"]

    state['final_result'] = {
        "evaluations": clean_evals,
        "overall": {
            "overall_score": overall_score,
            "technical_score": overall_tech,
            "communication_score": overall_comm,
            "problem_solving_score": overall_prob,
            "feedback_text": fb_text,
            "strengths": sts,
            "weaknesses": wks,
            "topics_to_learn": tech_evals.get('topics_to_learn', []),
            "resources": behav_evals.get('resources', [])
        }
    }
    return state


def build_evaluation_graph():
    builder = StateGraph(EvaluationState)
    
    builder.add_node("technical_grader", technical_grader_node)
    builder.add_node("behavioral_grader", behavioral_grader_node)
    builder.add_node("verbatim_highlighter", verbatim_highlighter_node)
    builder.add_node("verbatim_verifier", verbatim_verifier_node)
    builder.add_node("synthesizer", synthesizer_node)
    
    builder.add_edge(START, "technical_grader")
    builder.add_edge("technical_grader", "behavioral_grader")
    builder.add_edge("behavioral_grader", "verbatim_highlighter")
    builder.add_edge("verbatim_highlighter", "verbatim_verifier")
    
    builder.add_conditional_edges("verbatim_verifier", route_verbatim, {
        "retry": "verbatim_highlighter",
        "synthesize": "synthesizer"
    })
    
    builder.add_edge("synthesizer", END)
    
    return builder.compile()

async def run_evaluation_graph(position: str, level: str, questions: list[dict]) -> dict:
    qa_block = build_qa_block(questions)
    
    initial_state = EvaluationState(
        position=position,
        level=level,
        questions=questions,
        qa_block=qa_block,
        technical_evals={},
        behavioral_evals={},
        verbatim_chunks_per_q={},
        verbatim_errors="",
        verbatim_retries=0,
        final_result={}
    )
    
    graph = build_evaluation_graph()
    result_state = await graph.ainvoke(initial_state)
    return result_state["final_result"]

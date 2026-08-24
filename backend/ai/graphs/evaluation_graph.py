import json
from typing import TypedDict, List, Dict, Any, Literal
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field

from ..config import load_config
from ..chains import build_llm, ainvoke_with_retry_429, extract_first_tool_args
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


from langchain_core.tools import tool
import time
import random

def make_eval_tool(tool_name: str, schema_cls):
    @tool(tool_name, args_schema=schema_cls)
    def dynamic_eval_tool(**kwargs) -> str:
        """Submit structured evaluation result."""
        return "ok"
    return dynamic_eval_tool


# --- Nodes ---
async def technical_grader_node(state: EvaluationState) -> EvaluationState:
    cfg = load_config()
    tool_name = f"tech_eval_{int(time.time())}_{random.randint(100, 999)}"
    dynamic_tool = make_eval_tool(tool_name, TechEvalResult)
    llm = build_llm(cfg, temperature=0.2).bind_tools(
        [dynamic_tool],
        tool_choice=tool_name
    )
    
    prompt = f"""Bạn là một Giám đốc Kỹ thuật (Technical Director / VP of Engineering) rất nghiêm túc và công tâm.
Hãy đánh giá kỹ năng chuyên môn (technical) của ứng viên cho vị trí {state['level']} {state['position']}.

Dưới đây là danh sách câu hỏi và câu trả lời của ứng viên:
{state['qa_block']}

QUY TẮC CHẤM ĐIỂM CHUYÊN MÔN:
1. THANG ĐIỂM BẮT BUỘC: 0 đến 100 điểm (ví dụ: 65, 75, 85, 90). TUYỆT ĐỐI KHÔNG DÙNG THANG ĐIỂM 1-10!
2. Nếu câu trả lời TRỐNG, để trống, hoặc ứng viên nói "không biết", "em chịu", "bỏ qua": BẮT BUỘC chấm technical_score = 0!
3. Nếu câu trả lời sai lệch hoặc hời hợt: Chấm điểm thấp (10 - 40 điểm).
4. Nếu trả lời đúng trọng tâm cơ bản: Chấm điểm trung bình (50 - 70 điểm).
5. Nếu trả lời xuất sắc, có phân tích kiến trúc, trade-offs, best practices: Chấm điểm cao (75 - 100 điểm).
6. Hãy chấm technical_score (0-100) cho từng câu, và overall_technical_score cho toàn bộ.

BẮT BUỘC gọi function {tool_name}."""
    
    try:
        res = await ainvoke_with_retry_429(llm, [HumanMessage(content=prompt)], retries=cfg.max_retries_429)
        args = extract_first_tool_args(res)
        if args:
            state['technical_evals'] = TechEvalResult.model_validate(args).model_dump()
        else:
            state['technical_evals'] = {"evaluations": [], "overall_technical_score": 0, "topics_to_learn": []}
    except Exception as e:
        print(f"[AI] Tech grader error: {e}")
        state['technical_evals'] = {"evaluations": [], "overall_technical_score": 0, "topics_to_learn": ["Không thể phân tích do lỗi kết nối AI"]}
    return state


async def behavioral_grader_node(state: EvaluationState) -> EvaluationState:
    cfg = load_config()
    tool_name = f"behav_eval_{int(time.time())}_{random.randint(100, 999)}"
    dynamic_tool = make_eval_tool(tool_name, BehavEvalResult)
    llm = build_llm(cfg, temperature=0.2).bind_tools(
        [dynamic_tool],
        tool_choice=tool_name
    )
    
    prompt = f"""Bạn là chuyên gia nhân sự và đánh giá năng lực phỏng vấn.
Hãy đánh giá kỹ năng giao tiếp (communication) và tư duy giải quyết vấn đề (problem solving) của ứng viên cho vị trí {state['level']} {state['position']}.

Dưới đây là phần trả lời của họ:
{state['qa_block']}

QUY TẮC CHẤM ĐIỂM:
1. THANG ĐIỂM BẮT BUỘC: 0 đến 100 điểm (ví dụ: 65, 75, 85, 90). TUYỆT ĐỐI KHÔNG DÙNG THANG ĐIỂM 1-10!
2. Nếu câu trả lời TRỐNG hoặc bỏ qua: BẮT BUỘC chấm communication_score = 0 và problem_solving_score = 0!
3. Chấm điểm communication_score và problem_solving_score (0-100) chính xác theo độ rõ ràng, cấu trúc mạch lạc (STAR method) và tư duy logic.

BẮT BUỘC gọi function {tool_name}."""
    
    try:
        res = await ainvoke_with_retry_429(llm, [HumanMessage(content=prompt)], retries=cfg.max_retries_429)
        args = extract_first_tool_args(res)
        if args:
            state['behavioral_evals'] = BehavEvalResult.model_validate(args).model_dump()
        else:
            state['behavioral_evals'] = {"evaluations": [], "overall_communication_score": 0, "overall_problem_solving_score": 0, "resources": []}
    except Exception as e:
        print(f"[AI] Behav grader error: {e}")
        state['behavioral_evals'] = {"evaluations": [], "overall_communication_score": 0, "overall_problem_solving_score": 0, "resources": ["Không thể phân tích do lỗi kết nối AI"]}
    return state


async def verbatim_highlighter_node(state: EvaluationState) -> EvaluationState:
    cfg = load_config()
    tool_name = f"verbatim_eval_{int(time.time())}_{random.randint(100, 999)}"
    dynamic_tool = make_eval_tool(tool_name, VerbatimEvalResult)
    llm = build_llm(cfg, temperature=0.1).bind_tools(
        [dynamic_tool],
        tool_choice=tool_name
    )
    
    prompt = f"""Bạn là một chuyên gia rà soát nguyên văn. Hãy bóc tách chính xác nguyên văn câu trả lời của ứng viên thành các analysis_chunks.
Dưới đây là phần trả lời gốc:
{state['qa_block']}

QUAN TRỌNG:
- analysis_chunks[].text khi nối lại phải khớp 100% với câu trả lời gốc của ứng viên.
- Nếu câu trả lời của ứng viên trống (""), analysis_chunks chỉ cần 1 chunk với text="" và type="normal".
- Phân loại type: success (ý đúng), warning (đúng một phần), danger (sai/thiếu), normal (từ nối).
- Cung cấp popupTitle, popupDesc giải thích lỗi sai.
- Cũng sinh ra feedback_chunks nhận xét chung cho câu.

BẮT BUỘC gọi function {tool_name}."""
    
    if state.get('verbatim_errors'):
        prompt += f"\n\nLẦN TRƯỚC BẠN ĐÃ LÀM SAI:\n{state['verbatim_errors']}\nHÃY SỬA LẠI CHO ĐÚNG NGUYÊN VĂN!"

    try:
        res = await ainvoke_with_retry_429(llm, [HumanMessage(content=prompt)], retries=cfg.max_retries_429)
        args = extract_first_tool_args(res)
        if args:
            state['verbatim_chunks_per_q'] = VerbatimEvalResult.model_validate(args).model_dump()
        else:
            state['verbatim_chunks_per_q'] = {"evaluations": []}
    except Exception as e:
        print(f"[AI] Verbatim highlighter error: {e}")
        state['verbatim_chunks_per_q'] = {"evaluations": []}
    return state


async def verbatim_verifier_node(state: EvaluationState) -> EvaluationState:
    try:
        evals = state['verbatim_chunks_per_q'].get('evaluations', [])
        for idx, q in enumerate(state['questions']):
            user_answer = q.get("user_answer", "") or ""
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
    question_scores = []
    
    # Merge per question
    for idx, q in enumerate(state['questions']):
        q_idx = idx + 1
        user_ans = (q.get('user_answer') or '').strip()
        t = t_list.get(q_idx, {})
        b = b_list.get(q_idx, {})
        v = v_list.get(q_idx, {})
        
        # If user did not answer the question
        if not user_ans:
            score = 0
            analysis_chunks = v.get('analysis_chunks') or [
                {"id": f"q{q_idx}_a0", "text": "", "type": "normal", "popupTitle": "Không có câu trả lời", "popupDesc": "Ứng viên chưa cung cấp câu trả lời cho câu hỏi này.", "statusText": "0 điểm"}
            ]
            feedback_chunks = v.get('feedback_chunks') or [
                {"id": f"q{q_idx}_f0", "text": "Ứng viên không cung cấp câu trả lời cho câu hỏi này. Cần chuẩn bị và trả lời đầy đủ.", "type": "danger", "popupTitle": "Chưa trả lời", "popupDesc": "Không có dữ liệu đánh giá.", "statusText": "0 điểm"}
            ]
            strengths = []
            weaknesses = ["Ứng viên bỏ trống câu hỏi này, không cung cấp câu trả lời."]
            recommendations = ["Cần ôn tập và hoàn thành câu trả lời trong các buổi phỏng vấn sau."]
        else:
            t_score = t.get('technical_score', 0)
            c_score = b.get('communication_score', 0)
            p_score = b.get('problem_solving_score', 0)
            score = int((t_score * 0.6) + (c_score * 0.2) + (p_score * 0.2))
            
            analysis_chunks = v.get('analysis_chunks') or [
                {"id": f"q{q_idx}_a1", "text": user_ans, "type": "normal", "popupTitle": "Phân tích câu trả lời", "popupDesc": "", "statusText": ""}
            ]
            feedback_chunks = v.get('feedback_chunks') or []
            strengths = t.get('technical_strengths', []) + b.get('behavioral_strengths', [])
            weaknesses = t.get('technical_weaknesses', []) + b.get('behavioral_weaknesses', [])
            recommendations = b.get('recommendations', [])

        question_scores.append(score)
        clean_evals.append({
            "score": score,
            "analysis_chunks": analysis_chunks,
            "feedback_chunks": feedback_chunks,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendations": recommendations
        })

    # Overall Scores
    if question_scores:
        overall_score = int(sum(question_scores) / len(question_scores))
    else:
        overall_score = 0

    overall_tech = tech_evals.get('overall_technical_score', 0)
    overall_comm = behav_evals.get('overall_communication_score', 0)
    overall_prob = behav_evals.get('overall_problem_solving_score', 0)

    # If all answers were blank
    if all(not (q.get('user_answer') or '').strip() for q in state['questions']):
        overall_score = 0
        overall_tech = 0
        overall_comm = 0
        overall_prob = 0
        fb_text = "Ứng viên chưa cung cấp câu trả lời cho các câu hỏi trong phiên phỏng vấn này. Hãy luyện tập và hoàn thành đầy đủ câu trả lời trong các buổi phỏng vấn tiếp theo."
        sts = []
        wks = ["Chưa hoàn thành câu trả lời cho bất kỳ câu hỏi nào trong phiên phỏng vấn."]
    else:
        cfg = load_config()
        tool_name = f"synthesizer_{int(time.time())}_{random.randint(100, 999)}"
        dynamic_tool = make_eval_tool(tool_name, OverallSynthesis)
        try:
            llm = build_llm(cfg, temperature=0.3).bind_tools(
                [dynamic_tool],
                tool_choice=tool_name
            )
            prompt = f"""Dựa vào phần trả lời của ứng viên, hãy tổng hợp nhận xét chung.
Vị trí: {state['position']} ({state['level']})

Chi tiết đánh giá chuyên môn:
{tech_evals}

Chi tiết đánh giá kỹ năng mềm:
{behav_evals}

Hãy viết một đoạn feedback_text tóm tắt toàn diện, khách quan (3-4 câu).
Cùng với đó, chỉ ra tối đa 3 điểm mạnh nổi bật nhất và 3 điểm yếu lớn nhất của ứng viên trong toàn bộ buổi phỏng vấn.

BẮT BUỘC gọi function {tool_name}."""
            
            synthesis_msg = await ainvoke_with_retry_429(llm, [HumanMessage(content=prompt)], retries=cfg.max_retries_429)
            args = extract_first_tool_args(synthesis_msg)
            if args:
                synthesis = OverallSynthesis.model_validate(args)
                fb_text = synthesis.feedback_text
                sts = synthesis.strengths
                wks = synthesis.weaknesses
            else:
                fb_text = "Hoàn tất đánh giá phiên phỏng vấn."
                sts = ["Có kiến thức chuyên môn cơ bản"]
                wks = ["Cần rèn luyện thêm kỹ năng trả lời phỏng vấn"]
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
    # ── Zero-Token Fast-Path for All Blank Answers ──────────────
    has_any_answer = any((q.get("user_answer") or "").strip() for q in questions)
    if not has_any_answer:
        clean_evals = []
        for idx, q in enumerate(questions):
            q_idx = idx + 1
            clean_evals.append({
                "score": 0,
                "analysis_chunks": [
                    {
                        "id": f"q{q_idx}_a0",
                        "text": "",
                        "type": "normal",
                        "popupTitle": "Không có câu trả lời",
                        "popupDesc": "Ứng viên chưa cung cấp câu trả lời cho câu hỏi này.",
                        "statusText": "0 điểm"
                    }
                ],
                "feedback_chunks": [
                    {
                        "id": f"q{q_idx}_f0",
                        "text": "Ứng viên không cung cấp câu trả lời cho câu hỏi này. Cần chuẩn bị và trả lời đầy đủ.",
                        "type": "danger",
                        "popupTitle": "Chưa trả lời",
                        "popupDesc": "Không có dữ liệu đánh giá.",
                        "statusText": "0 điểm"
                    }
                ],
                "strengths": [],
                "weaknesses": ["Ứng viên bỏ trống câu hỏi này, không cung cấp câu trả lời."],
                "recommendations": ["Cần ôn tập và hoàn thành câu trả lời trong các buổi phỏng vấn sau."]
            })
        return {
            "evaluations": clean_evals,
            "overall": {
                "overall_score": 0,
                "technical_score": 0,
                "communication_score": 0,
                "problem_solving_score": 0,
                "feedback_text": "Ứng viên chưa cung cấp câu trả lời cho các câu hỏi trong phiên phỏng vấn này. Hãy luyện tập và hoàn thành đầy đủ câu trả lời trong các buổi phỏng vấn tiếp theo.",
                "strengths": [],
                "weaknesses": ["Chưa hoàn thành câu trả lời cho bất kỳ câu hỏi nào trong phiên phỏng vấn."],
                "topics_to_learn": ["Ôn tập toàn diện kiến thức chuyên môn và kỹ năng phỏng vấn"],
                "resources": ["Tài liệu ôn tập kiến thức chuyên ngành và cấu trúc trả lời STAR"]
            }
        }

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

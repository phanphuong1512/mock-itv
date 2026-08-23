from __future__ import annotations

from typing import Optional

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.tools import tool

from .config import AIConfig, load_config
from .prompts import (
    GENERATE_QUESTIONS_PROMPT,
    GENERATE_QUESTIONS_WITH_CV_PROMPT,
    GENERATE_CUSTOM_QUESTIONS_PROMPT,
    EVALUATE_SESSION_PROMPT,
    ANALYZE_CV_PROMPT,
    VOICE_SYSTEM_PROMPT,
)
from .chains import (
    build_llm,
    ainvoke_with_retry_429,
    extract_first_tool_args,
    parse_generate_questions_args,
    parse_evaluate_session_args,
    parse_analyze_cv_args,
)
from .validators import build_qa_block, validate_verbatim_chunks, VerbatimChunksError
from .schemas import CleanEvaluateSessionResult, CleanPerQuestionEvaluation, CleanOverall


# ── LangChain Tool Schemas ───────────────────────────────────

from .schemas import QuestionItem, PerQuestionEvaluation, OverallEvaluation, NotableProject

@tool
def generate_interview_questions(questions: list[QuestionItem]) -> str:
    """Schema tool for returning interview questions."""
    return "ok"

@tool
def evaluate_mock_interview_session(evaluations: list[PerQuestionEvaluation], overall: OverallEvaluation) -> str:
    """Schema tool for returning full evaluation."""
    return "ok"

@tool
def analyze_candidate_cv(
    candidate_level: str,
    confirmed_skills: list[str],
    skill_gaps: list[str],
    notable_projects: list[NotableProject],
    interview_focus_areas: list[str],
) -> str:
    """Analyze a candidate's CV/resume against a job position and extract structured insights to personalize interview questions."""
    return "ok"


# ── Config Singleton ─────────────────────────────────────────

def _get_cfg() -> AIConfig:
    from dotenv import load_dotenv
    load_dotenv(override=True)
    return load_config()



# ── CV Analysis ──────────────────────────────────────────────

_MAX_CV_CHARS = 4000


async def analyze_cv(
    cv_text: str,
    position: str,
    tech_stack: list[str],
) -> dict:
    """Analyze a candidate's CV and return structured insights for interview personalization."""
    cfg = _get_cfg()

    llm = build_llm(cfg, temperature=0.7).bind_tools(
        [analyze_candidate_cv],
        tool_choice="analyze_candidate_cv",
    )

    messages = ANALYZE_CV_PROMPT.format_messages(
        position=position,
        tech_stack=", ".join(tech_stack),
        cv_text=cv_text[:_MAX_CV_CHARS],
    )

    try:
        msg = await ainvoke_with_retry_429(
            llm, messages, retries=cfg.max_retries_429, delay=cfg.retry_delay_sec
        )

        args = extract_first_tool_args(msg)
        if args:
            parsed = parse_analyze_cv_args(args)
            return parsed.model_dump()

    except Exception as e:
        print(f"[AI] ⚠️ analyze_cv failed: {e}")

    return {
        "candidate_level": "",
        "confirmed_skills": [],
        "skill_gaps": [],
        "notable_projects": [],
        "interview_focus_areas": [],
    }


# ── Generate Questions ───────────────────────────────────────

def _build_cv_projects_section(notable_projects: list[dict]) -> str:
    """Build the notable projects section string for the CV-aware prompt."""
    if not notable_projects:
        return ""
    lines = ["\nDỰ ÁN TRONG CV (hỏi cụ thể về đây):"]
    for p in notable_projects:
        lines.append(f"- {p.get('name', '')}: hỏi về {p.get('ask_about', '')}")
    return "\n".join(lines)


async def generate_questions(
    position: str,
    level: str,
    tech_stack: list[str],
    count: int = 7,
    cv_context: Optional[dict] = None,
) -> list[dict]:
    """Generate interview questions, optionally personalized with CV insights."""
    cfg = _get_cfg()

    llm = build_llm(cfg, temperature=1).bind_tools(
        [generate_interview_questions],
        tool_choice="generate_interview_questions",
    )

    if cv_context:
        messages = GENERATE_QUESTIONS_WITH_CV_PROMPT.format_messages(
            position=position,
            level=level,
            tech_stack=", ".join(tech_stack),
            count=count,
            cv_level=cv_context.get("candidate_level", ""),
            cv_confirmed_skills=", ".join(cv_context.get("confirmed_skills", [])),
            cv_skill_gaps=", ".join(cv_context.get("skill_gaps", [])),
            cv_focus_areas=", ".join(cv_context.get("interview_focus_areas", [])),
            cv_projects_section=_build_cv_projects_section(
                cv_context.get("notable_projects", [])
            ),
        )
    else:
        messages = GENERATE_QUESTIONS_PROMPT.format_messages(
            position=position,
            level=level,
            tech_stack=", ".join(tech_stack),
            count=count,
        )

    msg = await ainvoke_with_retry_429(
        llm, messages, retries=cfg.max_retries_429, delay=cfg.retry_delay_sec
    )

    args = extract_first_tool_args(msg)
    if args:
        parsed = parse_generate_questions_args(args)
        return [q.model_dump() for q in parsed.questions]

    raise ValueError("AI không phản hồi danh sách câu hỏi theo đúng định dạng.")


async def generate_custom_questions(
    namespace: str,
    mock_type: str, # "CV" or "Job Description"
    count: int = 7,
) -> list[dict]:
    """Generate custom interview questions using RAG from Pinecone."""
    from .graphs.crag_graph import run_crag_graph
    return await run_crag_graph(namespace, mock_type, count)



# ── Batch Evaluate Session ───────────────────────────────────

async def batch_evaluate_session(position: str, level: str, questions: list[dict]) -> dict:
    from .graphs.evaluation_graph import run_evaluation_graph
    try:
        return await run_evaluation_graph(position, level, questions)
    except Exception as e:
        print(f"[AI] ⚠️ batch_evaluate_session failed: {e}")
        fallback_evaluations = []
        for q in questions:
            fallback_evaluations.append(
                {
                    "score": 0,
                    "analysis_chunks": [{"id": "a0", "text": q.get("user_answer", ""), "type": "danger", "popupTitle": "Lỗi hệ thống AI", "popupDesc": "Không thể kết nối với AI để phân tích", "statusText": "Lỗi"}],
                    "feedback_chunks": [{"id": "f0", "text": "Không thể tạo phản hồi do lỗi hệ thống AI.", "type": "danger", "popupTitle": "Lỗi hệ thống AI", "popupDesc": "Không thể kết nối với AI để phản hồi", "statusText": "Lỗi"}],
                    "strengths": ["Không thể phân tích do lỗi hệ thống AI"],
                    "weaknesses": ["Không thể phân tích do lỗi hệ thống AI"],
                    "recommendations": ["Vui lòng thử lại sau"],
                }
            )

        return {
            "evaluations": fallback_evaluations,
            "overall": {
                "overall_score": 0,
                "technical_score": 0,
                "communication_score": 0,
                "problem_solving_score": 0,
                "feedback_text": f"Đã xảy ra lỗi trong quá trình kết nối AI: {str(e)}",
                "strengths": ["Không thể tổng hợp do lỗi hệ thống AI"],
                "weaknesses": ["Không thể tổng hợp do lỗi hệ thống AI"],
                "topics_to_learn": ["Không thể phân tích do lỗi hệ thống AI"],
                "resources": []
            },
        }


# ── Voice Interview ──────────────────────────────────────────

async def voice_interview_respond(position: str, level: str, tech_stack: list[str], messages: list[dict], session_id: str) -> str:
    from .graphs.voice_graph import run_voice_graph
    try:
        return await run_voice_graph(position, level, tech_stack, messages, session_id)
    except Exception as e:
        print(f"[AI] ⚠️ voice_interview_respond failed: {e}")
        return "Xin lỗi, đường truyền của tôi đang gặp vấn đề. Bạn có thể nhắc lại không?"


def _clean_spoken_text(text: str) -> str:
    """Strip any JSON reasoning objects, thought tags, or stage markers before yielding to user/TTS."""
    # Remove any JSON object like {"reasoning": ..., "next_action": ...}
    text = _re.sub(r'\{[^{}]*\}', '', text)
    # Remove any nested JSON-like structure
    text = _re.sub(r'\{.*?"next_action".*?\}', '', text, flags=_re.DOTALL)
    # Remove thought tags
    text = _re.sub(r'<think>.*?</think>', '', text, flags=_re.DOTALL)
    # Remove leading brackets
    text = _re.sub(r'^\[.*?\]\s*', '', text)
    return text.strip()


async def voice_interview_respond_stream(
    position: str, level: str, tech_stack: list[str], messages: list[dict], session_id: str
):
    """Streaming version — yields complete sentences as they arrive from the LLM via LangGraph."""
    from .graphs.voice_graph import build_voice_graph, VoiceInterviewState
    
    graph = build_voice_graph()
    config = {"configurable": {"thread_id": session_id}}
    current_state = await graph.aget_state(config)
    
    if current_state and current_state.values:
        inputs = {"messages": messages}
    else:
        inputs = VoiceInterviewState(
            position=position,
            level=level,
            tech_stack=tech_stack,
            messages=messages,
            interview_stage="ongoing",
            questions_asked=0,
            analysis_reasoning="",
            next_action="ask_new",
            ai_response=""
        )

    buffer = ""
    async for event in graph.astream_events(inputs, config=config, version="v2"):
        # ONLY capture tokens from the interviewer node, NEVER from analyzer node
        node_name = event.get("metadata", {}).get("langgraph_node")
        if event.get("event") == "on_chat_model_stream" and node_name == "interviewer":
            chunk = event.get("data", {}).get("chunk")
            token = getattr(chunk, "content", "") or ""
            if not token:
                continue
            buffer += token

            while True:
                match = _SENTENCE_END.search(buffer)
                if not match:
                    break
                end_pos = match.end()
                sentence = buffer[:end_pos].strip()
                buffer = buffer[end_pos:]
                cleaned_sentence = _clean_spoken_text(sentence)
                if cleaned_sentence:
                    yield cleaned_sentence

    # Yield any remaining text
    leftover = _clean_spoken_text(buffer.strip())
    if leftover:
        yield leftover



# ── Text to Speech ───────────────────────────────────────────

async def text_to_speech(text: str) -> bytes:
    """Generate TTS audio bytes using Edge TTS with retry logic."""
    import edge_tts
    import asyncio
    import re
    
    cleaned = re.sub(r'^\[[\w\s/]+\]\s*', '', text.strip())
    if not cleaned:
        cleaned = text.strip()
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            communicate = edge_tts.Communicate(text=cleaned, voice="vi-VN-NamMinhNeural")
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            
            if not audio_data:
                raise ValueError("No audio was received.")
            return audio_data
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"[TTS Error] Final attempt failed for text: {text[:50]}... -> {e}")
                raise e
            print(f"[TTS Warning] Attempt {attempt + 1} failed, retrying... ({e})")
            await asyncio.sleep(0.5)
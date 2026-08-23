from typing import TypedDict, List, Dict, Any, Literal
from langgraph.graph import StateGraph, START, END
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field

from ..config import load_config
from ..chains import build_llm, ainvoke_with_retry_429, extract_first_tool_args, parse_generate_questions_args
from ..prompts import GENERATE_CUSTOM_QUESTIONS_PROMPT
from ..schemas import QuestionItem

class CRAGState(TypedDict):
    namespace: str
    mock_type: str
    count: int
    
    query: str
    context_docs: List[str]
    is_context_relevant: bool
    retries: int
    
    final_questions: List[Dict[str, Any]]

class GradeResult(BaseModel):
    is_relevant: bool = Field(description="Đánh giá xem nội dung có liên quan đến kỹ năng, kinh nghiệm, và yêu cầu công việc hay không.")

class RewriteResult(BaseModel):
    improved_query: str = Field(description="Câu truy vấn tìm kiếm mới tối ưu hơn.")

async def retrieve_node(state: CRAGState) -> CRAGState:
    try:
        from ..pinecone_service import get_retriever
        retriever = get_retriever(state["namespace"], k=10)
        docs = retriever.invoke(state["query"])
        state["context_docs"] = [doc.page_content for doc in docs]
    except Exception as e:
        print(f"[AI] CRAG Retrieve Error: {e}")
        state["context_docs"] = []
    return state

async def grade_node(state: CRAGState) -> CRAGState:
    cfg = load_config()
    llm = build_llm(cfg, temperature=0.1).with_structured_output(GradeResult)
    
    context_text = "\n\n---\n\n".join(state["context_docs"])
    if not context_text.strip():
        state["is_context_relevant"] = False
        return state
        
    prompt = f"""Bạn là một chuyên gia đánh giá dữ liệu. Hãy xem xét đoạn văn bản sau đây được trích xuất từ tài liệu {state['mock_type']}:
    {context_text}
    
    Nhiệm vụ: Đánh giá xem đoạn văn bản trên có chứa thông tin hữu ích về kỹ năng, kinh nghiệm làm việc, học vấn, hoặc yêu cầu chuyên môn không? Trả về True nếu có, False nếu toàn là thông tin rác (như địa chỉ, sở thích không liên quan, boilerplate text)."""
    
    try:
        result = await ainvoke_with_retry_429(llm, [HumanMessage(content=prompt)], retries=cfg.max_retries_429)
        state["is_context_relevant"] = result.is_relevant
    except Exception as e:
        print(f"[AI] CRAG Grade Error: {e}")
        state["is_context_relevant"] = True  # Fallback to true to avoid infinite loops
        
    return state

def route_crag(state: CRAGState) -> str:
    if state["is_context_relevant"] or state["retries"] >= 2:
        return "generate"
    return "rewrite"

async def rewrite_node(state: CRAGState) -> CRAGState:
    cfg = load_config()
    llm = build_llm(cfg, temperature=0.5).with_structured_output(RewriteResult)
    
    prompt = f"""Câu truy vấn trước đó "{state['query']}" không tìm thấy nội dung liên quan trong cơ sở dữ liệu vector.
    Hãy viết lại một câu truy vấn tìm kiếm MỚI ngắn gọn bằng tiếng Anh để tìm kiếm các từ khóa cốt lõi về kỹ năng kỹ thuật, kinh nghiệm dự án (tech stack, programming languages, system architecture, projects)."""
    
    try:
        result = await ainvoke_with_retry_429(llm, [HumanMessage(content=prompt)], retries=cfg.max_retries_429)
        state["query"] = result.improved_query
    except Exception as e:
        print(f"[AI] CRAG Rewrite Error: {e}")
        
    state["retries"] += 1
    return state

from ..service import generate_interview_questions

async def generate_node(state: CRAGState) -> CRAGState:
    cfg = load_config()
    
    context_text = "\n\n---\n\n".join(state["context_docs"])
    if not context_text.strip():
        context_text = "Không thể lấy ngữ cảnh từ Vector DB. Hãy tự nghĩ ra các câu hỏi phổ biến."

    llm = build_llm(cfg, temperature=1).bind_tools(
        [generate_interview_questions],
        tool_choice="generate_interview_questions",
    )

    messages = GENERATE_CUSTOM_QUESTIONS_PROMPT.format_messages(
        mock_type=state['mock_type'],
        count=state['count'],
        context=context_text,
    )

    msg = await ainvoke_with_retry_429(llm, messages, retries=cfg.max_retries_429, delay=cfg.retry_delay_sec)
    args = extract_first_tool_args(msg)
    if args:
        parsed = parse_generate_questions_args(args)
        state["final_questions"] = [q.model_dump() for q in parsed.questions]
        return state

    raise ValueError("AI CRAG không trích xuất được câu hỏi phù hợp từ tài liệu.")


def build_crag_graph():
    builder = StateGraph(CRAGState)
    
    builder.add_node("retrieve", retrieve_node)
    builder.add_node("grade", grade_node)
    builder.add_node("rewrite", rewrite_node)
    builder.add_node("generate", generate_node)
    
    builder.add_edge(START, "retrieve")
    builder.add_edge("retrieve", "grade")
    
    builder.add_conditional_edges("grade", route_crag, {
        "generate": "generate",
        "rewrite": "rewrite"
    })
    
    builder.add_edge("rewrite", "retrieve")
    builder.add_edge("generate", END)
    
    return builder.compile()

async def run_crag_graph(namespace: str, mock_type: str, count: int) -> list[dict]:
    initial_state = CRAGState(
        namespace=namespace,
        mock_type=mock_type,
        count=count,
        query="skills, experience, and requirements, technical stack",
        context_docs=[],
        is_context_relevant=False,
        retries=0,
        final_questions=[]
    )
    
    graph = build_crag_graph()
    result = await graph.ainvoke(initial_state)
    return result["final_questions"]

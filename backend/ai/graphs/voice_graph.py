from typing import TypedDict, List, Dict, Any, Literal, Annotated
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, AnyMessage
from pydantic import BaseModel, Field

from ..config import load_config
from ..chains import build_llm, ainvoke_with_retry_429
from ..prompts import VOICE_SYSTEM_PROMPT

# Global memory saver for state persistence
memory = MemorySaver()

class VoiceInterviewState(TypedDict):
    position: str
    level: str
    tech_stack: List[str]
    messages: Annotated[list, add_messages]
    
    interview_stage: str
    questions_asked: int
    
    analysis_reasoning: str
    next_action: Literal["ask_new", "follow_up", "conclude"]
    
    ai_response: str

class VoiceAnalysis(BaseModel):
    reasoning: str = Field(description="Suy luận về câu trả lời của ứng viên.")
    questions_asked_so_far: int = Field(description="Tổng số câu hỏi chính đã hỏi tính đến hiện tại.")
    next_action: Literal["ask_new", "follow_up", "conclude"] = Field(
        description="Hành động tiếp theo: 'ask_new' (hỏi câu mới chuyển chủ đề), 'follow_up' (hỏi xoáy sâu vào câu trả lời cũ), 'conclude' (kết thúc phỏng vấn nếu đã đủ 5 câu hoặc ứng viên muốn dừng)."
    )

async def analyzer_node(state: VoiceInterviewState) -> VoiceInterviewState:
    cfg = load_config()
    llm = build_llm(cfg, temperature=0.1).with_structured_output(VoiceAnalysis)
    
    history_text = ""
    for m in state["messages"][-6:]:  # Chỉ cần nhìn 6 tin gần nhất để đánh giá
        role = getattr(m, "type", "user")
        if role == "human": role = "user"
        if role == "ai": role = "assistant"
        content = getattr(m, "content", "")
        history_text += f"{role.upper()}: {content}\n"
        
    prompt = f"""Bạn là một hệ thống phân tích luồng phỏng vấn cho vị trí {state['level']} {state['position']}.
    Dưới đây là đoạn hội thoại gần nhất:
    {history_text}
    
    Số câu hỏi chính đã hỏi (trước tin nhắn này): {state.get('questions_asked', 0)}
    
    Hãy đánh giá câu trả lời cuối cùng của ứng viên:
    - Nếu trả lời hời hợt hoặc có điểm thú vị cần đào sâu -> follow_up
    - Nếu đã trả lời trọn vẹn và số câu hỏi < 5 -> ask_new (cộng thêm 1 vào questions_asked_so_far)
    - Nếu đã hỏi >= 5 câu hoặc ứng viên ngỏ ý muốn kết thúc -> conclude
    """
    
    try:
        analysis = await ainvoke_with_retry_429(llm, [HumanMessage(content=prompt)], retries=cfg.max_retries_429)
        state['analysis_reasoning'] = analysis.reasoning
        state['questions_asked'] = analysis.questions_asked_so_far
        state['next_action'] = analysis.next_action
        
        if analysis.questions_asked_so_far >= 5 and analysis.next_action != "conclude":
            state['next_action'] = "conclude"
            
    except Exception as e:
        print(f"[AI] Voice Analyzer Error: {e}")
        state['next_action'] = "ask_new"
        state['questions_asked'] = state.get('questions_asked', 0) + 1
        
    return state

def route_voice(state: VoiceInterviewState) -> str:
    return "interviewer"

async def interviewer_node(state: VoiceInterviewState) -> VoiceInterviewState:
    cfg = load_config()
    llm = build_llm(cfg, temperature=0.7)
    
    base_sys_prompt = VOICE_SYSTEM_PROMPT.format(
        position=state['position'],
        level=state['level'],
        tech_stack=", ".join(state['tech_stack']),
    )
    
    action_instruction = ""
    if state['next_action'] == "follow_up":
        action_instruction = "HƯỚNG DẪN: Hãy đặt MỘT câu hỏi xoáy sâu (follow-up) vào câu trả lời vừa rồi của ứng viên. Ngắn gọn, súc tích."
    elif state['next_action'] == "ask_new":
        action_instruction = f"HƯỚNG DẪN: Hãy đặt MỘT câu hỏi MỚI hoàn toàn. Đây là câu hỏi thứ {state.get('questions_asked', 1)}/5. Ngắn gọn."
    elif state['next_action'] == "conclude":
        action_instruction = "HƯỚNG DẪN: Đã đủ câu hỏi hoặc ứng viên muốn dừng. Hãy đưa ra lời nhận xét ngắn gọn và KẾT THÚC buổi phỏng vấn. Chào tạm biệt."
        
    chat_messages = [SystemMessage(content=base_sys_prompt + "\n\n" + action_instruction)]
    
    for m in state["messages"]:
        # m is a BaseMessage, just append it
        if getattr(m, "type", "") == "system":
            continue
        chat_messages.append(m)
            
    try:
        msg = await ainvoke_with_retry_429(llm, chat_messages, retries=cfg.max_retries_429)
        state['ai_response'] = getattr(msg, "content", "") or ""
    except Exception as e:
        print(f"[AI] Voice Interviewer Error: {e}")
        state['ai_response'] = "Xin lỗi, đường truyền của tôi đang gặp vấn đề. Bạn có thể nhắc lại không?"
        
    return state

def build_voice_graph():
    builder = StateGraph(VoiceInterviewState)
    builder.add_node("analyzer", analyzer_node)
    builder.add_node("interviewer", interviewer_node)
    
    builder.add_edge(START, "analyzer")
    builder.add_edge("analyzer", "interviewer")
    builder.add_edge("interviewer", END)
    
    return builder.compile(checkpointer=memory)

async def run_voice_graph(position: str, level: str, tech_stack: list[str], messages: list, session_id: str) -> str:
    # Convert dicts to HumanMessage/AIMessage if needed, but add_messages handles dicts.
    
    # Check if thread exists by fetching state
    graph = build_voice_graph()
    config = {"configurable": {"thread_id": session_id}}
    current_state = await graph.aget_state(config)
    
    questions_asked = 0
    if current_state and current_state.values:
        questions_asked = current_state.values.get("questions_asked", 0)
        # Update state directly with new messages
        result = await graph.ainvoke({"messages": messages}, config=config)
    else:
        initial_state = VoiceInterviewState(
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
        result = await graph.ainvoke(initial_state, config=config)
        
    return result["ai_response"]

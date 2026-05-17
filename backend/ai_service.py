# -*- coding: utf-8 -*-
"""
AI Service for MockITV — Gemini Function Calling + Batching.

This module implements the core AI evaluation pipeline:
1. generate_interview_questions — creates questions for a mock session
2. evaluate_answer — analyzes a single user answer with highlight chunks
3. generate_overall_assessment — produces session-wide scoring and feedback
4. generate_recommendations — suggests learning topics and resources

Batching: evaluate_answer is called in parallel for all questions,
then overall_assessment + recommendations run in parallel.
"""

import os
import json
import asyncio
from typing import Optional
from google import genai
from google.genai import types

# Initialize Gemini client
_client: Optional[genai.Client] = None

MODEL_NAME = "gemini-2.5-flash"


def _get_client() -> genai.Client:
    """Lazy-initialize the Gemini client."""
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is not set in environment variables.")
        _client = genai.Client(api_key=api_key)
    return _client


async def _generate_content_with_retry(client, model, contents, config, retries=5, delay=3.0):
    """Wrapper to make Gemini API calls with exponential backoff on rate limits."""
    for attempt in range(retries):
        try:
            return await asyncio.to_thread(
                client.models.generate_content,
                model=model,
                contents=contents,
                config=config,
            )
        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                print(f"[AI] ⚠️ Rate limit hit. Retrying in {delay:.1f}s... (Attempt {attempt+1}/{retries})")
                await asyncio.sleep(delay)
                delay *= 2.0  # Exponential backoff
            else:
                raise e
    # Final try
    return await asyncio.to_thread(
        client.models.generate_content,
        model=model,
        contents=contents,
        config=config,
    )


# ============================================================
# FUNCTION CALLING TOOL DEFINITIONS
# ============================================================

GENERATE_QUESTIONS_TOOL = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="generate_interview_questions",
            description="Generate technical interview questions for a mock interview session based on the job position, level, and tech stack.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "questions": types.Schema(
                        type=types.Type.ARRAY,
                        description="List of interview questions",
                        items=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                "question_text": types.Schema(type=types.Type.STRING, description="The interview question in Vietnamese"),
                                "tag": types.Schema(type=types.Type.STRING, description="Question category: technical, behavioral, or problem-solving"),
                            },
                            required=["question_text", "tag"],
                        ),
                    ),
                },
                required=["questions"],
            ),
        ),
    ]
)




# ============================================================
# CORE AI FUNCTIONS
# ============================================================

async def generate_questions(position: str, level: str, tech_stack: list[str], count: int = 7) -> list[dict]:
    """Generate interview questions using Gemini function calling."""
    client = _get_client()
    
    prompt = (
        f"Bạn là một chuyên gia phỏng vấn IT senior. Hãy tạo {count} câu hỏi phỏng vấn kỹ thuật "
        f"cho vị trí {position} (cấp bậc: {level}). "
        f"Tech stack yêu cầu: {', '.join(tech_stack)}. "
        f"Câu hỏi phải bằng tiếng Việt, sát thực tế, và phù hợp với cấp bậc. "
        f"Bao gồm cả câu technical, behavioral, và problem-solving. "
        f"Gọi function generate_interview_questions với danh sách câu hỏi."
    )
    
    config = types.GenerateContentConfig(
        tools=[GENERATE_QUESTIONS_TOOL],
        temperature=0.7,
    )
    
    response = await _generate_content_with_retry(
        client=client,
        model=MODEL_NAME,
        contents=prompt,
        config=config,
    )
    
    # Extract function call result
    for part in response.candidates[0].content.parts:
        if part.function_call and part.function_call.name == "generate_interview_questions":
            args = dict(part.function_call.args)
            questions = args.get("questions", [])
            return [dict(q) for q in questions]
    
    return [{"question_text": f"Câu hỏi kỹ thuật {i+1} cho {position}", "tag": "technical"} for i in range(count)]


async def batch_evaluate_session(
    position: str, level: str,
    questions: list[dict],
) -> dict:
    """
    Evaluate the entire session in ONE SINGLE Gemini API request in JSON Mode!
    Saves massive amounts of tokens, avoids all rate limits, and is extremely fast!
    """
    client = _get_client()
    
    # Construct the complete prompt
    prompt = (
        f"Bạn là một chuyên gia phỏng vấn IT senior đang đánh giá toàn bộ buổi phỏng vấn mock.\n\n"
        f"VỊ TRÍ: {position} (cấp bậc: {level})\n\n"
        f"DANH SÁCH CÂU HỎI VÀ CÂU TRẢ LỜI CỦA ỨNG VIÊN:\n"
    )
    for idx, q in enumerate(questions):
        prompt += f"--- CÂU HỎI {idx+1} ---\n{q['question_text']}\n"
        prompt += f"CÂU TRẢ LỜI CỦA ỨNG VIÊN: {q.get('user_answer', '')}\n\n"
        
    prompt += (
        f"Hãy đánh giá chi tiết buổi phỏng vấn này và trả về kết quả dưới định dạng JSON duy nhất và chính xác như cấu trúc ví dụ dưới đây:\n"
        f"{{\n"
        f"  \"evaluations\": [\n"
        f"    {{\n"
        f"      \"question_index\": 1,\n"
        f"      \"score\": 85,\n"
        f"      \"analysis_chunks\": [\n"
        f"        {{\n"
        f"          \"id\": \"a0\",\n"
        f"          \"text\": \"Gateway, Load Balancer\",\n"
        f"          \"type\": \"success\",\n"
        f"          \"popupTitle\": \"Tốt\",\n"
        f"          \"popupDesc\": \"Đưa ra các thành phần phân tán tải tốt.\",\n"
        f"          \"statusText\": \"Phù hợp\"\n"
        f"        }}\n"
        f"      ],\n"
        f"      \"feedback_chunks\": [\n"
        f"        {{\n"
        f"          \"id\": \"f0\",\n"
        f"          \"text\": \"Ý tưởng tốt nhưng cần bổ sung thêm service mesh.\",\n"
        f"          \"type\": \"warning\",\n"
        f"          \"popupTitle\": \"Bổ sung\",\n"
        f"          \"popupDesc\": \"Service mesh giúp quản lý giao tiếp microservices tốt hơn.\",\n"
        f"          \"statusText\": \"Cải thiện\"\n"
        f"        }}\n"
        f"      ],\n"
        f"      \"strengths\": [\"Hiểu biết về Gateway và Load Balancer\"],\n"
        f"      \"weaknesses\": [\"Chưa nhắc đến Service Mesh hoặc Circuit Breaker\"],\n"
        f"      \"recommendations\": [\"Nên tìm hiểu thêm về Consul hoặc Istio\"]\n"
        f"    }}\n"
        f"  ],\n"
        f"  \"overall\": {{\n"
        f"    \"overall_score\": 80,\n"
        f"    \"technical_score\": 85,\n"
        f"    \"communication_score\": 75,\n"
        f"    \"problem_solving_score\": 80,\n"
        f"    \"feedback_text\": \"Ứng viên có tiềm năng lớn nhưng cần cải thiện kỹ năng giải thích chi tiết hơn.\",\n"
        f"    \"strengths\": [\"Kiến thức nền tảng hệ thống phân tán tốt\"],\n"
        f"    \"weaknesses\": [\"Kỹ năng phân tích chiều sâu còn thiếu sót\"],\n"
        f"    \"topics_to_learn\": [\"Service Mesh\", \"Distributed Tracing\"],\n"
        f"    \"resources\": [\"Microservices Architecture by Sam Newman\"]\n"
        f"  }}\n"
        f"}}\n\n"
        f"LƯU Ý QUAN TRỌNG KHI ĐÁNH GIÁ:\n"
        f"1. Phải đánh giá đầy đủ tất cả các câu hỏi trong danh sách câu hỏi được đưa ra.\n"
        f"2. CẤU TRÚC BẮT BUỘC CỦA 'analysis_chunks' để hiển thị giao diện:\n"
        f"   - Phải phân đoạn NGUYÊN VĂN 100% (verbatim, từng từ, từng khoảng trắng) toàn bộ câu trả lời thô của ứng viên (user_answer).\n"
        f"   - CẤM TUYỆT ĐỐI tự ý thêm các cụm từ dẫn dắt như 'Câu trả lời của bạn: ', 'Phần này đúng nhưng...', dấu ngoặc kép, gạch nối, hoặc bất kỳ nhận xét ngoài lề nào vào trong 'analysis_chunks'.\n"
        f"   - Toàn bộ các chunks ghép lại trong 'analysis_chunks' phải khớp chính xác 100% từng kí tự với câu trả lời thô của ứng viên (user_answer).\n"
        f"     + Cụm từ nào đúng/tốt: gán type=\"success\" (tô màu xanh), kèm popupTitle, popupDesc (ví dụ: \"Đúng\", \"Giải thích khái niệm chính xác\").\n"
        f"     + Cụm từ nào chưa đầy đủ/sơ sài: gán type=\"warning\" (tô màu vàng), kèm popupTitle, popupDesc.\n"
        f"     + Cụm từ nào sai lệch/ngộ nhận: gán type=\"danger\" (tô màu đỏ), kèm popupTitle, popupDesc.\n"
        f"     + Các cụm từ liên kết hoặc bình thường khác: gán type=\"normal\".\n"
        f"3. NẾU ỨNG VIÊN KHÔNG TRẢ LỜI (hoặc ghi 'em chả nhớ', 'bỏ qua', 'chưa biết', hoặc bỏ trống):\n"
        f"   - Hãy gán score = 0 cho câu đó.\n"
        f"   - Phần 'analysis_chunks' vẫn phải chứa đúng 1 single chunk chứa nguyên văn câu trả lời thô của họ (ví dụ: \"em chả nhớ\" hoặc \"em ếu biết\"), gán toàn bộ câu đó thành type=\"danger\" hoặc type=\"warning\". Tuyệt đối không thêm bất kỳ tiền tố, hậu tố nào.\n"
        f"4. Tất cả nội dung text phân tích, popup, strengths, weaknesses, feedback_text phải được viết bằng TIẾNG VIỆT chuẩn kỹ thuật và tự nhiên nhất.\n"
        f"5. Hãy đảm bảo chuỗi JSON trả về hợp lệ và không chứa bất kỳ thẻ markdown ```json nào bên ngoài."
    )
    
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=0.3,
    )
    
    try:
        response = await _generate_content_with_retry(
            client=client,
            model=MODEL_NAME,
            contents=prompt,
            config=config,
        )
        
        # Parse the JSON response
        data = json.loads(response.text)
        evaluations = data.get("evaluations", [])
        overall = data.get("overall", {})
        
        # Sort evaluations by question_index to align with the prompt questions
        clean_evaluations = []
        try:
            evaluations_sorted = sorted(evaluations, key=lambda x: int(dict(x).get("question_index", 1)))
            for ev in evaluations_sorted:
                ev_dict = dict(ev)
                clean_evaluations.append({
                    "score": int(ev_dict.get("score", 0)),
                    "analysis_chunks": [dict(c) for c in ev_dict.get("analysis_chunks", [])],
                    "feedback_chunks": [dict(c) for c in ev_dict.get("feedback_chunks", [])],
                    "strengths": list(ev_dict.get("strengths", [])),
                    "weaknesses": list(ev_dict.get("weaknesses", [])),
                    "recommendations": list(ev_dict.get("recommendations", [])),
                })
        except Exception as e:
            print(f"[AI] Sorting evaluations failed, fallback parsing: {e}")
            clean_evaluations = []
            for ev in evaluations:
                ev_dict = dict(ev)
                clean_evaluations.append({
                    "score": int(ev_dict.get("score", 0)),
                    "analysis_chunks": [dict(c) for c in ev_dict.get("analysis_chunks", [])],
                    "feedback_chunks": [dict(c) for c in ev_dict.get("feedback_chunks", [])],
                    "strengths": list(ev_dict.get("strengths", [])),
                    "weaknesses": list(ev_dict.get("weaknesses", [])),
                    "recommendations": list(ev_dict.get("recommendations", [])),
                })
        
        # Make sure we have evaluated exactly the same number of questions
        while len(clean_evaluations) < len(questions):
            clean_evaluations.append({
                "score": 0, "analysis_chunks": [], "feedback_chunks": [],
                "strengths": [], "weaknesses": [], "recommendations": [],
            })
            
        clean_overall = {
            "overall_score": int(overall.get("overall_score", 0)),
            "technical_score": int(overall.get("technical_score", 0)),
            "communication_score": int(overall.get("communication_score", 0)),
            "problem_solving_score": int(overall.get("problem_solving_score", 0)),
            "feedback_text": str(overall.get("feedback_text", "")),
            "strengths": list(overall.get("strengths", [])),
            "weaknesses": list(overall.get("weaknesses", [])),
            "topics_to_learn": list(overall.get("topics_to_learn", [])),
            "resources": list(overall.get("resources", [])),
        }
        
        return {
            "evaluations": clean_evaluations,
            "overall": clean_overall,
        }
        
    except Exception as e:
        print(f"[AI] ⚠️ batch_evaluate_session failed: {e}. Using fallback.")
        fallback_evaluations = []
        for q in questions:
            fallback_evaluations.append({
                "score": 50,
                "analysis_chunks": [{"id": "a0", "text": q.get("user_answer", ""), "type": "normal"}],
                "feedback_chunks": [{"id": "f0", "text": "Đang phân tích câu trả lời...", "type": "normal"}],
                "strengths": [], "weaknesses": [], "recommendations": [],
            })
        return {
            "evaluations": fallback_evaluations,
            "overall": {
                "overall_score": 50, "technical_score": 50, "communication_score": 50, "problem_solving_score": 50,
                "feedback_text": f"Đánh giá gặp lỗi hệ thống: {str(e)}",
            }
        }

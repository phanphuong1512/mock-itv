from __future__ import annotations

import asyncio
from typing import Any, Optional

from langchain_openai import ChatOpenAI
from langchain_core.runnables import Runnable
from langchain_core.messages import BaseMessage

from pydantic import ValidationError

from .config import AIConfig
from .schemas import GenerateQuestionsArgs, EvaluateSessionArgs, AnalyzeCVArgs


def build_llm(cfg: AIConfig, *, temperature: Optional[float] = None) -> ChatOpenAI:
    return ChatOpenAI(
        model=cfg.model,
        api_key=cfg.api_key,
        base_url=cfg.base_url,
        temperature=cfg.temperature if temperature is None else temperature,
    )

async def ainvoke_with_retry_429(
    runnable: Runnable,
    messages: list[BaseMessage],
    *,
    retries: int,
    delay: float = 1.0,
) -> Any:
    cur_delay = delay
    for attempt in range(retries):
        try:
            return await runnable.ainvoke(messages)
        except Exception as e:
            if "429" in str(e):
                print(
                    f"[AI] ⚠️ Rate limit hit. Retrying in {cur_delay:.1f}s... "
                    f"(Attempt {attempt + 1}/{retries})"
                )
                await asyncio.sleep(cur_delay)
                cur_delay *= 2
                continue
            raise
    return await runnable.ainvoke(messages)

def extract_first_tool_args(msg: Any) -> dict:
    tool_calls = getattr(msg, "tool_calls", None) or []
    if not tool_calls:
        return {}
    return tool_calls[0].get("args", {}) or {}

def parse_generate_questions_args(tool_args: dict) -> GenerateQuestionsArgs:
    try:
        return GenerateQuestionsArgs.model_validate(tool_args)
    except ValidationError as e:
        raise ValueError(f"Tool args schema invalid (generate_questions): {e}") from e

def parse_evaluate_session_args(tool_args: dict) -> EvaluateSessionArgs:
    try:
        return EvaluateSessionArgs.model_validate(tool_args)
    except ValidationError as e:
        raise ValueError(f"Tool args schema invalid (evaluate_session): {e}") from e

def parse_analyze_cv_args(tool_args: dict) -> AnalyzeCVArgs:
    try:
        return AnalyzeCVArgs.model_validate(tool_args)
    except ValidationError as e:
        raise ValueError(f"Tool args schema invalid (analyze_cv): {e}") from e
import os
from dataclasses import dataclass
from typing import Optional

@dataclass(frozen=True)
class AIConfig:
    api_key: str
    model: str
    base_url: Optional[str] = None
    temperature: float = 1.0
    max_retries_429: int = 5
    retry_delay_sec: float = 3.0
    verbatim_fix_retries: int = 2

def load_config() -> AIConfig:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set.")

    model = os.getenv("OPENAI_MODEL", "")
    if not model:
        raise ValueError("OPENAI_MODEL is not set.")

    base_url = os.getenv("OPENAI_ENDPOINT") or None

    return AIConfig(api_key=api_key, model=model, base_url=base_url)
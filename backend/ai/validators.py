class VerbatimChunksError(ValueError):
    pass

def join_chunk_text(chunks: list[dict]) -> str:
    return "".join([(c.get("text") or "") for c in chunks])

def validate_verbatim_chunks(user_answer: str, chunks: list[dict], *, question_index: int) -> None:
    expected = (user_answer or "").strip()
    actual = join_chunk_text(chunks).strip()
    
    import re
    expected_clean = re.sub(r'\s+', ' ', expected)
    actual_clean = re.sub(r'\s+', ' ', actual)
    
    if actual_clean != expected_clean:
        raise VerbatimChunksError(
            f"analysis_chunks verbatim mismatch at question_index={question_index}. "
            f"expected_len={len(expected_clean)} actual_len={len(actual_clean)}"
        )

def build_qa_block(questions: list[dict]) -> str:
    parts: list[str] = []
    for idx, q in enumerate(questions):
        parts.append(f"--- CÂU HỎI {idx + 1} ---")
        parts.append(str(q.get("question_text", "")))
        parts.append("")
        parts.append("CÂU TRẢ LỜI:")
        parts.append(str(q.get("user_answer", "")))
        parts.append("")
    return "\n".join(parts).strip()
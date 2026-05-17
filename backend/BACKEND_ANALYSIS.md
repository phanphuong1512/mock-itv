# MockITV — Backend Analysis

Ngày: 2026-05-17

## 1. Tóm tắt nhanh

Tài liệu này mô tả chi tiết toàn bộ mã nguồn trong thư mục `backend` của dự án MockITV: kiến trúc, mô hình dữ liệu, luồng gọi hàm (call flow), tích hợp AI (Gemini/genai), cơ chế batching/retry, seed data, endpoints và các điểm rủi ro/đề xuất cải thiện.

## 2. Cấu trúc thư mục (quan trọng)

- `main.py` — entrypoint FastAPI, đăng ký routes, khởi tạo DB và seed dữ liệu.
- `database.py` — SQLAlchemy engine, `SessionLocal`, `get_db()` dependency, `init_db()`.
- `models.py` — ORM models: `MockJob`, `MockSession`, `SessionQuestion`.
- `seed_data.py` — seed dữ liệu mẫu (jobs, sessions, questions).
- `ai_service.py` — logic AI (Gemini/genai): generate questions, batch evaluate, retry/backoff.
- `routes/jobs.py` — endpoints jobs (`/api/jobs`).
- `routes/sessions.py` — endpoints sessions (`/api/sessions`) — tạo session, submit answer, evaluate (gọi AI).
- `.env.example`, `requirements.txt`, `.gitignore` — cấu hình & dependencies.

> Ghi chú: có `routes/__init__.py` có nội dung tương tự `routes/jobs.py` (trùng lặp nhẹ).

## 3. Mô hình dữ liệu (ORM)

### `MockJob` (`mock_jobs`)

- Trường chính: `id, title, company, category, level, department, tech_stack (JSON string), rounds, logo_url`.
- Quan hệ: `sessions` (1-to-many -> `MockSession`).
- Thuận tiện: property `tech_stack_list` để load/save JSON list.

### `MockSession` (`mock_sessions`)

- Trường chính: `id, job_id(FK), status, overall_score, technical_score, communication_score, problem_solving_score, ai_overall_feedback`.
- Lưu nhiều mảng JSON dưới dạng `Text` (strengths, weaknesses, topics_to_learn, resources).
- `questions` quan hệ 1-to-many tới `SessionQuestion`, có `to_dict(include_questions)` để trả payload API.

### `SessionQuestion` (`session_questions`)

- Trường: `id, session_id, question_order, tag, question_text, user_answer, score`.
- Lưu các chunk JSON: `analysis_chunks`, `feedback_chunks`, `strengths`, `weaknesses`, `recommendations`.
- `to_dict()` chuyển sang định dạng frontend mong muốn.

## 4. Luồng khởi động & seed dữ liệu

- Khi FastAPI khởi động (`main.on_startup`) gọi `init_db()` tạo tables, sau đó mở `SessionLocal()` và gọi `seed_database(db)` (nếu DB trống sẽ thêm một bộ jobs, sessions và session_questions mẫu).
- Seed chứa ví dụ `analysis_chunks`/`feedback_chunks` thể hiện cấu trúc UI mong muốn.

## 5. API Endpoints (chi tiết)

### Jobs (`/api/jobs`)

- `GET /api/jobs` — list jobs, hỗ trợ query filter `category` và `level`.
- `GET /api/jobs/{job_id}` — lấy chi tiết job.

### Sessions (`/api/sessions`)

- `GET /api/sessions` — lịch sử (tất cả sessions).
- `GET /api/sessions/{session_id}` — chi tiết session (bao gồm câu hỏi khi `include_questions=True`).
- `POST /api/sessions` — tạo session mới:
  1. Tạo `MockSession(status="in_progress")` và `db.flush()` để có `session.id`.
  2. Gọi `await generate_questions(...)` từ `ai_service.py` (function calling) để tạo `questions_count` câu hỏi.
  3. Nếu AI lỗi, fallback tạo câu hỏi generic.
  4. Lưu `SessionQuestion` vào DB, commit và trả session kèm questions.
- `POST /api/sessions/{session_id}/answer` — ghi `user_answer` cho một `SessionQuestion`.
- `POST /api/sessions/{session_id}/evaluate` — trigger đánh giá AI cho cả session (batching):
  1. Thu thập `questions` với `user_answer`.
  2. Gọi `await batch_evaluate_session(position, level, questions)` — một call Gemini trả JSON tổng hợp.
  3. Parse `evaluations` và `overall`, cập nhật từng `SessionQuestion` và `MockSession`, set `status = "completed"`, commit, trả session.

## 6. `ai_service.py` — chi tiết kỹ thuật

- Khởi tạo client Gemini/genai lazy bằng `_get_client()` cần `GEMINI_API_KEY` (env).
- `_generate_content_with_retry(...)` thực hiện gọi `client.models.generate_content` trong `asyncio.to_thread(...)` và có exponential backoff cho lỗi rate-limit (429 / RESOURCE_EXHAUSTED).

### generate_questions(...)

- Sử dụng Function Calling: gửi prompt tiếng Việt cùng `GENERATE_QUESTIONS_TOOL` (mô tả hàm `generate_interview_questions`).
- Sau response, tìm `function_call` với tên `generate_interview_questions` trong `response.candidates[0].content.parts` rồi trích `args["questions"]`.
- Fallback: nếu không tìm được function call, tạo danh sách câu hỏi generic.

### batch_evaluate_session(...)

- Thiết kế: gom toàn bộ câu hỏi + câu trả lời vào một prompt lớn và yêu cầu model trả về **một chuỗi JSON duy nhất** có cấu trúc:
  - `evaluations`: array các object per-question (score, analysis_chunks, feedback_chunks, strengths, weaknesses, recommendations)
  - `overall`: tổng hợp điểm, `feedback_text`, `strengths`, `weaknesses`, `topics_to_learn`, `resources`
- Cấu hình `GenerateContentConfig(response_mime_type="application/json", temperature=0.3)` để bắt JSON.
- Parse `response.text` bằng `json.loads`, sắp xếp `evaluations` theo `question_index`, map sang `clean_evaluations` an toàn (ép kiểu int/lists).
- Nếu parsing/sort lỗi, fallback tạo đánh giá mặc định cho các câu (score 50) và overall báo lỗi.

### Lợi ích batching

- Giảm số request tới model (tiết kiệm token và tránh rate limits).
- Thực thi nhanh hơn khi model xử lý toàn bộ context 1 lần.

### Rủi ro của approach

- Prompt lớn + nhiều answer dài có thể vượt giới hạn token -> request lỗi.
- Cần model trả đúng JSON chính xác; nếu model trả kèm text khác hoặc format lệch sẽ gây parsing error.
- Yêu cầu "analysis_chunks" phải match nguyên văn 100% rất dễ làm model sai chữ/escaping => cần validate.

## 7. Error handling & Fallback

- `create_session`: nếu `generate_questions` lỗi, backend dùng fallback question list và tiếp tục (UX tốt).
- `evaluate_session`: nếu `batch_evaluate_session` raise exception toàn cục, endpoint trả HTTP 500. Tuy nhiên `batch_evaluate_session` có fallback nội tại khi parsing lỗi (trả đánh giá mặc định và overall báo lỗi) — endpoint sẽ nhận được fallback và tiếp tục cập nhật DB.
- `_generate_content_with_retry` thực hiện retry chỉ cho lỗi rate-limit, các lỗi khác được re-raise.

## 8. Environment & Dependencies

- Env cần: `GEMINI_API_KEY` (bắt buộc để gọi Gemini/genai). `DATABASE_URL` (tuỳ chọn, default `sqlite:///./mockitv.db`).
- Dependencies chính (xem `requirements.txt`): `fastapi`, `uvicorn`, `sqlalchemy`, `python-dotenv`, `pydantic`, `google-genai` (tên package used: import `from google import genai` / `from google.genai import types`).

## 9. Chạy ứng dụng local (nhanh)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export GEMINI_API_KEY="your_gemini_key"
python main.py
# hoặc
uvicorn main:app --reload --port 8000
```

- Docs: `http://localhost:8000/docs`

## 10. Điểm cải thiện & đề xuất (ưu tiên)

- Thêm validation cho `analysis_chunks`: đảm bảo khi ghép tất cả chunks lại phải bằng nguyên văn `user_answer` (để tránh mismatch UI). Nếu validation thất bại, dùng fallback chunk đơn lẻ chứa nguyên văn.
- Giới hạn `questions_count` hoặc chia batch khi session có nhiều câu để tránh token limit. Ví dụ: nếu > 12 câu, chia thành 2 batch.
- Làm `MODEL_NAME` và các config quan trọng thành biến môi trường (`GEMINI_MODEL`) để dễ điều chỉnh.
- Dùng `logging` thay vì `print` cho production observability.
- Thêm unit tests / mocks cho `ai_service` (mock responses) để test offline.
- Xoá/chuẩn hoá duplicate file `routes/__init__.py` nếu không cần.

## 11. Toàn bộ call flow (ngắn gọn từng bước)

1. Frontend -> `POST /api/sessions` (job_id, questions_count)
2. Backend tạo `MockSession` -> gọi `generate_questions` (AI function calling) -> lưu `SessionQuestion`.
3. Frontend gửi `POST /api/sessions/{id}/answer` cho từng câu.
4. Frontend trigger `POST /api/sessions/{id}/evaluate` -> backend thu tất cả câu và `user_answer` -> gọi `batch_evaluate_session` (1 request JSON) -> parse -> cập nhật DB -> trả session completed.

## 12. Next steps tôi có thể làm giúp bạn

- Chạy server local và demo một flow (tạo session, submit answers, evaluate) với mock AI (nếu bạn muốn tôi chạy).
- Thêm unit tests và mocks cho `ai_service.py`.
- Thêm validation/chunking tự động cho `analysis_chunks` và logic chia batch khi cần.

---

Tôi đã tóm tắt đầy đủ logic và các điểm cần chú ý — bạn muốn tôi tiếp tục thực hiện bước nào ở trên không?

# MockITV — Kế Hoạch Kiểm Thử (Test Plan) và Tổng Hợp Kết Quả

## 1. Chiến Lược Kiểm Thử (Test Strategy)

### Phương Pháp Tiếp Cận (Approach)

MockITV sử dụng chiến lược kiểm thử đa tầng để đảm bảo độ tin cậy:

| Tầng | Loại Kiểm Thử | Công cụ | Phạm vi (Scope) |
|---|---|---|---|
| **Unit** | Giả lập (Mock) dịch vụ AI | Python `unittest.mock` | Tích hợp AI ở Backend |
| **Integration** | Kiểm thử API Endpoint | FastAPI `TestClient` | Chu trình Request/Response HTTP |
| **Isolation** | Cơ sở dữ liệu riêng biệt | SQLite `test_mockitv.db` | Không ảnh hưởng dữ liệu Production |

### Cấu Trúc Kiểm Thử (Test Infrastructure)

- **Tệp kiểm thử:** `backend/test_main.py`
- **Database kiểm thử:** `sqlite:///./test_mockitv.db` (tự động tạo và xóa sau mỗi lần chạy)
- **Giả lập AI:** Dùng `unittest.mock.AsyncMock` cho `generate_questions()`, `batch_evaluate_session()`, `generate_custom_questions()`, `index_document()`
- **Ghi đè phụ thuộc (Dependency override):** `app.dependency_overrides[get_db] = override_get_db`
- **Đầu ra (Output):** Terminal có màu sắc (ANSI colors) kèm tóm tắt kết quả Pass/Fail.

### Cách Chạy Kiểm Thử

```bash
cd backend
source venv/bin/activate
python test_main.py
```

---

## 2. Các Kịch Bản Kiểm Thử (Test Cases)

### TC-01: GET /api/jobs — Danh sách Công việc

| Thuộc tính | Giá trị |
|---|---|
| **Mã (ID)** | TC-01 |
| **Mô tả** | Đảm bảo API danh sách công việc trả về đúng dữ liệu đã khởi tạo (seed) |
| **Điều kiện tiên quyết** | Database kiểm thử đã được khởi tạo với ít nhất 1 MockJob |
| **Các bước** | 1. Gửi request GET tới `/api/jobs` |
| **Kết quả mong đợi** | Status 200, mảng JSON có ≥1 công việc, schema bao gồm: id, title, company, level, techStack, rounds |
| **Độ ưu tiên** | P0 — Nghiêm trọng (Critical) |

### TC-02: GET /api/sessions — Lịch sử Phỏng vấn

| Thuộc tính | Giá trị |
|---|---|
| **Mã (ID)** | TC-02 |
| **Mô tả** | Đảm bảo API lịch sử trả về danh sách các phiên phỏng vấn chính xác |
| **Điều kiện tiên quyết** | Database kiểm thử đã có 2 MockSession (1 hoàn thành, 1 đang diễn ra) |
| **Các bước** | 1. Gửi request GET tới `/api/sessions` |
| **Kết quả mong đợi** | Status 200, mảng JSON có ≥1 phiên |
| **Độ ưu tiên** | P0 — Nghiêm trọng (Critical) |

### TC-03: POST /api/sessions — Tạo Phiên Phỏng Vấn Mới

| Thuộc tính | Giá trị |
|---|---|
| **Mã (ID)** | TC-03 |
| **Mô tả** | Đảm bảo tạo thành công một phiên phỏng vấn mới cùng các câu hỏi do AI sinh ra |
| **Điều kiện tiên quyết** | Đã có ≥1 MockJob; hàm AI `generate_questions()` được giả lập |
| **Các bước** | 1. GET `/api/jobs` lấy ID công việc đầu tiên<br>2. POST `/api/sessions` với `{"job_id": <id>}` |
| **Kết quả mong đợi** | Status 200, phiên có `status = "in_progress"`, mảng `questions` có ≥1 câu hỏi |
| **Giả lập (Mock)** | `generate_questions()` trả về 3 câu hỏi (kỹ thuật, hành vi, giải quyết vấn đề) |
| **Độ ưu tiên** | P0 — Nghiêm trọng (Critical) |

### TC-04: GET /api/sessions/{id} — Chi tiết Phiên Phỏng Vấn

| Thuộc tính | Giá trị |
|---|---|
| **Mã (ID)** | TC-04 |
| **Mô tả** | Đảm bảo lấy được toàn bộ chi tiết phiên phỏng vấn kèm câu hỏi và đánh giá |
| **Điều kiện tiên quyết** | Database đã có ≥1 MockSession và SessionQuestions |
| **Các bước** | 1. Truy vấn phiên đầu tiên từ DB<br>2. GET `/api/sessions/{id}` |
| **Kết quả mong đợi** | Status 200, đúng ID phiên, có mảng `questions` |
| **Độ ưu tiên** | P0 — Nghiêm trọng (Critical) |

### TC-05: POST /api/sessions/{id}/evaluate — AI Chấm Điểm

| Thuộc tính | Giá trị |
|---|---|
| **Mã (ID)** | TC-05 |
| **Mô tả** | Đảm bảo tính năng AI chấm điểm hàng loạt (batch) hoạt động và cập nhật trạng thái hoàn thành |
| **Điều kiện tiên quyết** | DB có ≥1 phiên `in_progress`; hàm `batch_evaluate_session()` được giả lập |
| **Các bước** | 1. Tìm một phiên in_progress<br>2. POST `/api/sessions/{id}/evaluate` |
| **Kết quả mong đợi** | Status 200, trạng thái thành `completed`, overall_score > 0 |
| **Giả lập (Mock)** | `batch_evaluate_session()` trả về đánh giá với điểm số 85 và tổng điểm 80 |
| **Độ ưu tiên** | P0 — Nghiêm trọng (Critical) |

### TC-06: POST /api/sessions/custom-mock — RAG Custom Mock

| Thuộc tính | Giá trị |
|---|---|
| **Mã (ID)** | TC-06 |
| **Mô tả** | Kiểm tra luồng upload CV/JD để tạo câu hỏi cá nhân hóa (RAG) |
| **Điều kiện tiên quyết** | Hàm `index_document` và `generate_custom_questions` được giả lập |
| **Các bước** | 1. POST file PDF dummy đến `/api/sessions/custom-mock` |
| **Kết quả mong đợi** | Status 200, tạo phiên với Job ID = 999, có mảng câu hỏi |
| **Độ ưu tiên** | P0 — Nghiêm trọng (Critical) |

### TC-07: POST /api/sessions/parse-cv — Phân tích File CV

| Thuộc tính | Giá trị |
|---|---|
| **Mã (ID)** | TC-07 |
| **Mô tả** | Kiểm tra logic bóc tách văn bản từ file PDF/DOCX tải lên |
| **Điều kiện tiên quyết** | Mock hàm đọc file PDF `_extract_text_from_pdf` |
| **Các bước** | 1. POST file PDF đến `/api/sessions/parse-cv` |
| **Kết quả mong đợi** | Status 200, trả về JSON chứa field `text` chính xác |
| **Độ ưu tiên** | P1 — Cao (High) |

---

## 3. Dữ Liệu Kiểm Thử (Test Data)

### Công việc mẫu (Seeded Job)

```json
{
  "id": 1,
  "title": "Software Engineer Intern",
  "company": "Tech Unicorn",
  "category": "backend",
  "level": "Intern",
  "department": "Backend",
  "tech_stack": ["Java", "Spring Boot", "MySQL"],
  "rounds": 3
}
```

### Phản hồi Giả lập AI (Mock AI Responses)

**Hàm generate_questions():**
```json
[
  {"question_text": "Mock Question 1", "tag": "technical"},
  {"question_text": "Mock Question 2", "tag": "behavioral"},
  {"question_text": "Mock Question 3", "tag": "problem-solving"}
]
```

**Hàm batch_evaluate_session():**
```json
{
  "evaluations": [{
    "score": 85,
    "analysis_chunks": [{"id": "a0", "text": "Đoạn trả lời mẫu", "type": "success", "popupTitle": "Tốt", "popupDesc": "Khá tốt", "statusText": "Đạt"}],
    "feedback_chunks": [],
    "strengths": ["Điểm mạnh 1"],
    "weaknesses": ["Điểm yếu 1"],
    "recommendations": ["Khuyến nghị 1"]
  }],
  "overall": {
    "overall_score": 80,
    "technical_score": 85,
    "communication_score": 75,
    "problem_solving_score": 80,
    "feedback_text": "Nhìn chung rất tốt",
    "strengths": ["Điểm mạnh tổng thể"],
    "weaknesses": ["Điểm yếu tổng thể"],
    "topics_to_learn": ["Chủ đề cần học"],
    "resources": ["Tài nguyên học tập"]
  }
}
```

---

## 4. Tóm Tắt Kết Quả Kiểm Thử (Test Results Summary)

### Lần Chạy Mới Nhất

```
╔════════════════════════════════════════════════════════════╗
║               MockITV Integration Test Suite               ║
╚════════════════════════════════════════════════════════════╝

 ✅ PASS : GET /api/jobs (Job Openings List)
            ↳ Successfully fetched 2 job postings in 0.010s.
 ✅ PASS : GET /api/sessions (Sessions History)
            ↳ Successfully loaded 2 mock interview sessions in 0.006s.
 ✅ PASS : POST /api/sessions (Create Mock Session)
            ↳ Created Session ID 3 with 3 questions in 0.007s.
 ✅ PASS : GET /api/sessions/{id} (Session Details)
            ↳ Retrieved detailed payload for Session ID 1 in 0.003s.
 ✅ PASS : POST /api/sessions/{id}/evaluate (Evaluate)
            ↳ AI Evaluation PASSED successfully for Session ID 2 in 0.006s.
 ✅ PASS : POST /api/sessions/custom-mock (RAG Flow)
            ↳ Custom Mock Session created successfully in 0.005s.
 ✅ PASS : POST /api/sessions/parse-cv (File Upload)
            ↳ CV Parsing PASSED successfully in 0.001s.

╚════════════════════════════════════════════════════════════╝

Test Summary: 7/7 Passed (0.04s)
```

---

## 5. Phân Tích Độ Phủ (Coverage Analysis)

### API Endpoints Đã Kiểm Thử

| Endpoint | Phương thức (Method) | Đã Test? |
|---|---|---|
| `/api/jobs` | GET | ✅ |
| `/api/jobs/{id}` | GET | ⚠️ Gián tiếp (qua danh sách) |
| `/api/sessions` | GET | ✅ |
| `/api/sessions` | POST | ✅ |
| `/api/sessions/{id}` | GET | ✅ |
| `/api/sessions/{id}/answer` | POST | ⚠️ Chưa test trực tiếp |
| `/api/sessions/{id}/evaluate` | POST | ✅ |
| `/api/sessions/parse-cv` | POST | ✅ |
| `/api/sessions/analyze-cv` | POST | ⚠️ Phụ thuộc AI |
| `/api/sessions/custom-mock` | POST | ✅ (Đã Mock Pinecone) |
| `/api/voice/tts` | POST | ⚠️ Dịch vụ ngoài (External) |
| `/api/voice/stt` | POST | ⚠️ Cần tải model STT |
| `/api/voice/ws-stt` | WebSocket | ⚠️ WebSocket |
| `/api/voice/sessions/{id}/message` | POST | ⚠️ Phụ thuộc AI |
| `/api/voice/sessions/{id}/message-stream` | POST | ⚠️ Cần kết nối SSE |
| `/api/health` | GET | ⚠️ Chưa test |

### Tổng Quan Độ Phủ

| Khu vực (Area) | Độ Phủ (Coverage) |
|---|---|
| Core CRUD endpoints | **5/6** (83%) |
| Tích hợp AI (Mocked) | **2/2** luồng chính (100%) |
| Tích hợp Upload & RAG (Mocked) | **2/3** luồng RAG (66%) |
| Voice endpoints | **0/5** (Phụ thuộc bên thứ ba) |
| **Tổng quan API coverage** | **7/16** endpoints (43%) — Bao phủ toàn bộ luồng chính yếu |

### Hạn Chế (Limitations)

- Các endpoint liên quan đến Voice yêu cầu model Sherpa-ONNX thực tế (không có sẵn trong môi trường test).
- Các luồng RAG với Pinecone yêu cầu API key thực tế.
- Kiểm thử tích hợp AI hiện đang sử dụng mock — hành vi API thực tế có thể có đôi chút sai khác.

---

## 6. Danh Sách Kiểm Thử Thủ Công (Manual Testing Checklist)

| # | Kịch Bản Kiểm Thử (Test Scenario) | Kết Quả Mong Đợi (Expected) | Trạng Thái |
|---|---|---|---|
| M-01 | Mở trang landing (/) | Hiển thị Hero section, danh sách tính năng, animations | ✅ Đã xác nhận |
| M-02 | Chuyển đến /mocks | Hiển thị thẻ công việc, bộ lọc (filter) hoạt động | ✅ Đã xác nhận |
| M-03 | Bắt đầu phỏng vấn văn bản | AI sinh câu hỏi, đồng hồ đếm ngược chạy | ✅ Đã xác nhận |
| M-04 | Trả lời & nộp bài | Hiển thị Verbatim highlight, tính điểm chính xác | ✅ Đã xác nhận |
| M-05 | Xem chi tiết lịch sử | Vẽ biểu đồ RadialProgress, tooltip bật lên bình thường | ✅ Đã xác nhận |
| M-06 | Bật tắt Giao diện Tối/Sáng | Chuyển đổi Theme mượt mà | ✅ Đã xác nhận |
| M-07 | Chuyển đổi ngôn ngữ VI/EN | Toàn bộ văn bản tĩnh thay đổi ngôn ngữ | ✅ Đã xác nhận |
| M-08 | Phỏng vấn qua Giọng nói | Hiển thị text từ STT, phát âm thanh từ TTS | ✅ Đã xác nhận |
| M-09 | Tải lên CV (PDF) | Bóc tách text thành công, tạo câu hỏi dựa trên CV | ✅ Đã xác nhận |
| M-10 | Custom Mock (RAG) | Tải CV → Pinecone index → Trả về câu hỏi RAG | ✅ Đã xác nhận |
| M-11 | Giao diện trên thiết bị di động | Bố cục responsive, thân thiện với cảm ứng | ✅ Đã xác nhận |
| M-12 | Khởi động Zero-config (start.sh) | Cả 2 server (FE & BE) khởi chạy thành công | ✅ Đã xác nhận |

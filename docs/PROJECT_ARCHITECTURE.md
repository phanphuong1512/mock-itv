# PROJECT_ARCHITECTURE.md — Nền tảng MockITV

## 1. Tổng quan dự án

**MockITV** là nền tảng luyện phỏng vấn IT với AI, cho phép người dùng:

- Chọn vị trí công việc mô phỏng (Backend, Frontend, DevOps, AI/ML, Fullstack...)
- Thực hiện phỏng vấn thử 1-1 với AI (câu hỏi được sinh tự động)
- Nhận đánh giá chi tiết từng câu trả lời với highlight màu (xanh/vàng/đỏ)
- Xem lịch sử phỏng vấn, điểm số, phân tích điểm mạnh/yếu

**Tác giả:** PhuongPV  
**Ngôn ngữ chính:** Tiếng Việt (hỗ trợ song ngữ VI/EN)  
**Mục tiêu:** Mô phỏng sát thực tế phỏng vấn tại doanh nghiệp công nghệ lớn

---

## 2. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│                     http://localhost:3000                   │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Next.js 15 (React 18 + TypeScript)        │ │
│  │  ┌──────┐  ┌──────┐  ┌─────────┐  ┌───────┐  ┌─────┐│  │
│  │  │ Home │  │ Jobs │  │ History │  │ Login │  │Price││  │
│  │  └──────┘  └──────┘  └─────────┘  └───────┘  └─────┘│  │
│  └────────────────────────────────────────────────────────┘  │
│                            │                                  │
│                  fetch('/api/...') thông qua                  │
│                  Next.js Rewrite Proxy                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Máy chủ FastAPI)                   │
│                     http://localhost:8000                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    FastAPI App                         │   │
│  │  ┌─────────────┐  ┌──────────────────┐              │   │
│  │  │ /api/jobs   │  │ /api/sessions    │              │   │
│  │  └─────────────┘  └──────────────────┘              │   │
│  │                         │                             │   │
│  │                    ┌────▼─────┐                       │   │
│  │                    │Dịch vụ AI│                       │   │
│  │                    └────┬─────┘                       │   │
│  └─────────────────────────┼────────────────────────────┘   │
│                             │                                 │
│  ┌──────────────────┐      │      ┌────────────────────────┐│
│  │  SQLite (WAL)    │      │      │  OpenAI API (Custom)   ││
│  │  mockitv.db      │      └──────│  Function Calling      ││
│  └──────────────────┘             └────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Ngăn Xếp Công Nghệ (Tech Stack)

| Lớp (Layer)        | Công nghệ           | Phiên bản   |
| ------------------ | -------------------- | --------- |
| Frontend Framework | Next.js (App Router) | 15.3.3    |
| Thư viện UI        | React                | 18.3.1    |
| Ngôn ngữ (FE)      | TypeScript           | ^5        |
| Tạo kiểu (Styling) | Tailwind CSS         | ^4        |
| Hoạt ảnh (Animation)| Framer Motion        | ^12.38.0  |
| Biểu tượng (Icons) | lucide-react         | ^1.16.0   |
| Giao diện (Theme)  | next-themes          | ^0.4.6    |
| Backend Framework  | FastAPI              | >=0.115.0 |
| Ngôn ngữ (BE)      | Python               | 3.10+     |
| Trình kết nối ORM  | SQLAlchemy           | >=2.0.0   |
| Cơ sở dữ liệu      | SQLite (Chế độ WAL)  | -         |
| Dịch vụ AI         | OpenAI SDK (Async)   | >=1.30.0  |
| Xác thực dữ liệu   | Pydantic             | >=2.0.0   |
| Máy chủ (Server)   | Uvicorn (ASGI)       | >=0.34.0  |

---

## 4. Cấu Trúc Thư Mục

```
workshop-2/
├── docs/                         # Tài liệu dự án (source of truth)
│   ├── PROJECT_ARCHITECT.md      # Tài liệu tổng thể
│   ├── BACKEND_ARCHITECT.md      # Chi tiết backend
│   ├── FRONTEND_ARCHITECT.md     # Chi tiết frontend
│   ├── BUSINESS_DESCRIPTION.md   # Phân tích nghiệp vụ
│   └── PRESENTATION.md           # Tài liệu thuyết trình kỹ thuật
├── backend/                      # Máy chủ FastAPI Python backend
│   ├── main.py                   # Điểm khởi chạy (Entry point), CORS, middleware
│   ├── database.py               # Công cụ & phiên làm việc SQLAlchemy
│   ├── models.py                 # Các mô hình ORM (3 bảng)
│   ├── ai_service.py             # Dịch vụ gọi hàm chức năng AI
│   ├── seed_data.py              # Tạo dữ liệu giả mẫu (Demo data seeding)
│   ├── requirements.txt          # Các thư viện phụ thuộc của Python
│   ├── .env                      # Các biến môi trường
│   ├── .env.example              # Mẫu thư mục .env
│   └── routes/
│       ├── __init__.py
│       ├── jobs.py               # Nơi chứa các api cho danh sách việc làm
│       ├── sessions.py           # Nơi chứa các api phiên và bài đánh giá
│       └── voice.py              # Các API về phỏng vấn TTS + tin nhắn
├── frontend/                     # Máy chủ giao diện Next.js React frontend
│   ├── app/                      # Bộ định tuyến App Router pages
│   │   ├── layout.tsx            # Bố cục gốc (providers)
│   │   ├── globals.css           # Cấu hình Tailwind + CSS variables
│   │   ├── page.tsx              # Landing page
│   │   ├── jobs/page.tsx         # Luồng phỏng vấn
│   │   ├── history/page.tsx      # Lịch sử và kết quả
│   │   ├── login/page.tsx        # Trang đăng nhập
│   │   └── pricing/page.tsx      # Trang thiết lập mức giá
│   ├── components/
│   │   ├── Navbar.tsx            # Thanh điều hướng trên cùng
│   │   ├── Footer.tsx            # Chân trang
│   │   ├── ThemeProvider.tsx     # Bộ cung cấp cho chế độ Tối/Sáng
│   │   └── LanguageProvider.tsx  # Ngôn ngữ hiển thị (VI/EN)
│   ├── public/                   # Thư mục chứa các tệp tĩnh
│   ├── package.json
│   ├── next.config.ts            # Cấu hình rewrite định tuyến API proxy
│   ├── tsconfig.json             # Cấu hình TypeScript
│   └── postcss.config.mjs        # Cấu hình PostCSS + Tailwind
├── start.sh                      # Lệnh khởi chạy với 1 click (macOS/Linux)
├── start.bat                     # Lệnh khởi chạy với 1 click (Windows)
├── README.md
├── BUSINESS_DESCRIPTION.md
└── .gitignore
```

---

## 5. Luồng hoạt động chính (User Flow)

### 5.1. Luồng phỏng vấn Mock

```
[Người dùng chọn Công việc] → [Xem chi tiết] → [Bấm "Bắt đầu phỏng vấn"]
       │
       ▼
[POST /api/sessions] → AI sinh câu hỏi (Qua Function Calling)
       │
       ▼
[Người dùng trả lời từng câu] → [POST /api/sessions/:id/answer]
       │                     (lưu câu trả lời vào DB)
       │
       ▼ (sau câu cuối)
[POST /api/sessions/:id/evaluate]
       │
       ▼
[AI tự động đánh giá hàng loạt (batch evaluate) toàn bộ phiên phỏng vấn]
       │
       ▼
[Chuyển hướng (Redirect) → /history] → [Xem kết quả chi tiết]
```

### 5.2. Luồng phỏng vấn giọng nói (Voice Interview)

```
[Người dùng chọn Công việc] → [Xem chi tiết] → [Bấm "Phỏng vấn giọng nói"]
       │
       ▼
[POST /api/sessions] → AI sinh câu hỏi → Phiên làm việc được tạo
       │
       ▼
[Câu hỏi đầu tiên] → [POST /api/voice/tts] → Âm thanh phát qua loa
       │
       ▼
[Người dùng nhấn nút Micro] → Truyền dữ liệu WebSocket STT (sherpa-onnx)
       │              → Bản dịch chữ thời gian thực được hiển thị
       │
       ▼ (Người dùng nhấn Dừng)
[Gửi tín hiệu "END" thông qua WebSocket] → nhận về {"final": nội_dung_chữ}
       │
       ▼
[POST /api/voice/sessions/:id/message]
       │   (gửi kèm nội_dung_chữ + lịch sử trò chuyện)
       │
       ▼
[AI phản hồi] → [POST /api/voice/tts] → Âm thanh phát qua loa
       │
       ▼ (Lặp lại cho đến khi kết thúc)
[Người dùng bấm "Kết thúc"] → [POST /api/sessions/:id/evaluate]
       │
       ▼
[Chuyển hướng (Redirect) → /history]
```

### 5.3. Luồng xem lịch sử

```
[GET /api/sessions] → Hiển thị danh sách phiên đã làm
       │
       ▼
[Chọn 1 phiên phỏng vấn] → [GET /api/sessions/:id] → Hiển thị chi tiết:
  - Điểm tổng (Biểu đồ tròn - Radial Chart)
  - Điểm Kỹ thuật (Technical) / Giao tiếp (Communication) / Giải quyết vấn đề (Problem Solving)
  - Từng câu hỏi: highlight phân tích cụ thể + feedback
  - Điểm mạnh / Điểm yếu / Chủ đề cần bổ sung / Tài liệu tham khảo
```

---

## 6. Kết nối Frontend ↔ Backend

### Cấu hình Proxy

Hệ thống Frontend khi gọi `/api/*` → Next.js sẽ chuyển tiếp (rewrite) đến → `http://localhost:8000/api/*`

```typescript
// frontend/next.config.ts
async rewrites() {
  return [{ source: "/api/:path*", destination: "http://localhost:8000/api/:path*" }];
}
```

### CORS (Backend)

```python
allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"]
allow_methods=["*"]
allow_headers=["*"]
```

---

## 7. Cách chạy dự án

### Khởi Động Nhanh (Khuyến nghị)

```bash
# hệ điều hành macOS/Linux
chmod +x start.sh && ./start.sh

# hệ điều hành Windows
start.bat
```

### Thiết Lập Thủ Công

```bash
# Terminal 1 — Backend
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # Cấu hình API key
python main.py                    # → Backend sẽ chạy ở http://localhost:8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev                       # → Frontend sẽ chạy ở http://localhost:3000
```

### Các Điểm Truy Cập Hệ Thống

| URL                              | Mô tả                     |
| -------------------------------- | ------------------------- |
| http://localhost:3000            | Frontend (Giao diện Next.js)|
| http://localhost:8000            | Backend API (FastAPI)     |
| http://localhost:8000/docs       | Tài liệu Swagger API |
| http://localhost:8000/api/health | Kiểm tra tình trạng sức khỏe ứng dụng |

---

## 8. Biến Môi Trường (Environment Variables)

```env
# backend/.env
DATABASE_URL=sqlite:///./mockitv.db
OPENAI_ENDPOINT=https://aiportalapi.stu-platform.live/jpe    # Đường dẫn (Endpoint) OpenAI được tùy chỉnh
OPENAI_API_KEY=<your-api-key>
OPENAI_MODEL=GPT-5.4-mini                                    # Tên mô hình
```

---

## 9. Cơ Sở Dữ Liệu (Database)

- **Engine:** Hệ quản trị SQLite kết hợp với chế độ WAL (Write-Ahead Logging)
- **Tệp:** `backend/mockitv.db` (hệ thống sẽ tự động tạo tệp này khi khởi động)
- **Auto-seed:** Trong trường hợp DB trống, chương trình tự động rải 6 công việc + 3 phiên phỏng vấn mẫu
- **Khả năng đồng thời (Concurrency):** Nhờ WAL mode + thời gian chờ (timeout) 30s giúp tối ưu cho việc đọc/ghi đồng thời

---

## 10. Tích Hợp Trí Tuệ Nhân Tạo (AI Integration)

- **Nhà cung cấp (Provider):** OpenAI SDK (cho phép tùy biến URL base_url cho các mạng proxy hoặc tự cấu hình self-hosted)
- **Mẫu (Pattern):** Gọi hàm (Function Calling) (trả về dữ liệu cấu trúc dạng JSON)
- **Cơ chế thử lại (Retry):** Dùng cơ chế lũy tiến (Exponential backoff) cho các lỗi giới hạn tốc độ (rate limit 429), tối đa 5 lần
- **Bất đồng bộ (Async):** Toàn bộ các câu truy vấn AI đều được thực thi song song qua async/await
- **4 tính năng AI cơ bản:**
  1. `generate_questions()` — Tự sinh danh sách câu hỏi phỏng vấn bám sát công việc/cấp độ/tech stack
  2. `batch_evaluate_session()` — Chấm điểm toàn bộ bài thi chỉ trong 1 lần yêu cầu API
  3. `voice_interview_respond()` — Trí tuệ AI trò chuyện phản xạ thông qua âm thanh giọng nói
  4. `text_to_speech()` — Đổi chữ thành giọng đọc thực tế (sử dụng Edge-TTS, mã giọng vi-VN-NamMinhNeural)

---

## 11. Tính Năng Chính

| Tính năng                | Mô tả                                               |
| ---------------------- | --------------------------------------------------- |
| Danh sách công việc (Job Listing) | Mạng lưới các công việc có thể được lọc theo danh mục và cấp độ |
| Tự sinh câu hỏi với AI (AI Question) | Sinh câu hỏi sát thực tế bằng kỹ thuật Function Calling |
| Phỏng vấn trực tiếp (Live Interview) | Người dùng phản hồi từng câu kèm bộ đếm ngược và thanh biểu đồ tiến trình |
| Phỏng vấn bằng giọng nói (Voice) | Trò chuyện trực tiếp cùng AI với độ trễ thấp (Kết hợp TTS + STT) |
| Đánh giá số lượng lớn (Batch Evaluation) | Tiết kiệm chi phí gọi API vì toàn bộ cả phiên sẽ được gom đánh giá 1 lần |
| Phân tích màu sắc (Highlight Analysis) | Phân tích sâu rồi bôi màu theo từng cụm từ trong câu trả lời (xanh/vàng/đỏ) |
| Bảng điểm chi tiết (Score Dashboard) | Các biểu đồ vòng tròn hiển thị điểm phân theo 4 nhóm năng lực |
| Chế độ màu (Dark/Light Mode) | Thay đổi linh hoạt giao diện sáng tối sử dụng thư viện next-themes |
| Đa ngôn ngữ (Bilingual) | Tùy chọn qua lại tiếng Anh/tiếng Việt liền mạch |
| Giao diện đáp ứng (Responsive Design) | Ưu tiên nền tảng di động, tương thích với mọi màn hình nhỏ/vừa/lớn |
| Giao diện chuyển động (Animated UI) | Sử dụng Framer Motion giúp ứng dụng có các hoạt ảnh trơn tru toàn diện |
| Dễ dàng thiết lập (Zero-Config Setup) | Nhấp đúp chuột vào file start.sh hoặc start.bat là ứng dụng sẽ tự lo cài đặt tất cả |

---

## 12. Các Quyết Định Thiết Kế

1. **Sử dụng SQLite thay vì PostgreSQL** — Do đây là một dự án luyện tập/workshop, ta ưu tiên thiết lập đơn giản (zero-config)
2. **Function Calling thay vì gõ văn bản thường (free-text)** — Giúp lập trình viên đảm bảo AI tuân thủ nghiêm ngặt định dạng lược đồ JSON
3. **Đánh giá cả lô (Batch evaluate) thay vì đánh giá từng câu (per-question)** — Giúp hệ thống tiết kiệm tiền token, đồng thời giữ AI có thể nắm bắt ngữ cảnh tốt
4. **Proxy thông qua Next.js** — Ngăn chặn các lỗi bảo mật CORS rắc rối khi triển khai lên môi trường sản xuất
5. **Không có hệ thống tài khoản (No auth)** — Chỉ tập trung ở mức workshop
6. **Không có bộ quản lý trạng thái ngoại (No external state management)** — Các Hooks mặc định của React (useState + Context) là quá đủ
7. **Đào tạo Prompt hướng Tiếng Việt trước** — Đối tượng tiếp cận của nền tảng tập trung sâu vào lập trình viên tại Việt Nam

---

## 13. Hạn Chế & Vấn Đề Đã Biết

- Dự án không tích hợp tính năng xác thực và phân quyền tài khoản (authentication/authorization)
- Công nghệ SQLite không thực sự được thiết kế hoàn hảo cho môi trường có dữ liệu vào liên tục (nhiều người viết đồng thời)
- Chưa có tầng tạo bộ nhớ đệm (caching layer)
- Phía Backend chưa cài đặt giới hạn hạn ngạch gọi API (rate limiting)
- Thiếu hụt các đường ống CI/CD (CI/CD pipeline)
- Frontend hiện chưa được bao phủ bởi các unit tests

---

## 14. Hợp Đồng API (Mapping Frontend - Backend)

Để đảm bảo Frontend và Backend giao tiếp dữ liệu chính xác, tránh các lỗi gán nhầm dẫn đến thông số `undefined`, dự án áp dụng các TypeScript Interfaces sau để quy chuẩn hóa Tải trọng dữ liệu và Phản hồi.

### 14.1. Khai báo Các Lõi (Core Interfaces)

```typescript
// frontend/types/api.ts

export interface HighlightChunk {
  id?: string;
  text: string;
  type: "normal" | "success" | "warning" | "danger";
  popupTitle?: string;
  popupDesc?: string;
  statusText?: string;
}

export interface SessionQuestionResponse {
  id: number;
  text: string;
  tag: string;
  score: number;
  questionText: string;
  userAnswer: string;
  analysisChunks: HighlightChunk[];
  feedbackChunks: HighlightChunk[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface MockSessionResponse {
  id: number;
  jobId: number;
  position: string;
  department: string;
  level: string;
  company: string;
  techStack: string[];
  status: string;
  date: string;
  questionsCount: number;
  score: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  aiOverallFeedback: string;
  strengths: string[];
  weaknesses: string[];
  topicsToLearn: string[];
  resources: string[];
  questions?: SessionQuestionResponse[];
}

export interface JobResponse {
  id: number;
  title: string;
  company: string;
  category: string;
  level: string;
  department: string;
  description: string;
  tech_stack: string;
  tech_stack_list: string[];
  rounds: number;
  expected_skills: string;
}
```

### 14.2. Các Đường Dẫn API Chính

- `GET /api/sessions`: Kết quả trả về là `MockSessionResponse[]` (không đính kèm thuộc tính mảng `questions`).
- `GET /api/sessions/{id}`: Kết quả trả về là `MockSessionResponse` (nhưng có đính kèm thuộc tính mảng `questions`).
- `GET /api/jobs`: Kết quả trả về là `JobResponse[]`.
- `GET /api/jobs/{id}`: Kết quả trả về là `JobResponse`.
- `POST /api/sessions`: Kết quả trả về là `MockSessionResponse` (chứa phiên làm việc vừa được tạo).

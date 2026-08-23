# BACKEND_ARCHITECTURE.md — MockITV Backend

## 1. Tổng quan

Backend MockITV là một **FastAPI** server cung cấp REST API cho nền tảng phỏng vấn mock với AI. Server sử dụng SQLite làm database, LangChain + OpenAI SDK cho AI service, Pinecone VectorDB cho RAG pipeline, và hỗ trợ các xử lý bất đồng bộ (fully async operations).

**Runtime:** Python 3.10+  
**Framework:** FastAPI  
**Cổng (Port):** 8000  
**Điểm vào ứng dụng (Entry point):** `main.py`

---

## 2. Các Thư Viện (Dependencies)

```text
# requirements.txt
fastapi>=0.115.0           # Web framework (xử lý bất đồng bộ, type-safe)
uvicorn[standard]>=0.34.0  # ASGI server
sqlalchemy>=2.0.0          # ORM để tương tác database
google-genai>=1.0.0        # Thư viện cũ, giữ lại để tương thích (compatibility)
python-dotenv>=1.0.0       # Tải các biến môi trường từ file .env
pydantic>=2.0.0            # Xác thực dữ liệu Request/Response + AI schema
openai>=1.30.0             # AI service client (async)
langchain-openai>=0.1.0    # Lớp vỏ bọc LangChain cho OpenAI (ChatOpenAI, tool binding)
langchain-core>=0.3.0      # Lõi LangChain (prompts, runnables, messages)
edge-tts>=6.1.0            # Text-to-Speech (Sử dụng Microsoft Neural Voices)
sherpa-onnx>=1.10.0        # Speech-to-Text (nhận diện luồng thời gian thực, offline)
numpy>=1.24.0              # Xử lý âm thanh (PCM float32)
python-multipart>=0.0.9    # Phân tách file upload (CV upload)
pypdf>=4.0.0               # Trích xuất văn bản từ PDF (CV parsing)
python-docx>=1.1.0         # Trích xuất văn bản từ DOCX (CV parsing)
pinecone-client>=3.0.0     # Pinecone VectorDB client
langchain-pinecone>=0.1.0  # Tích hợp LangChain với Pinecone
pinecone>=7.0.0            # Pinecone SDK
langchain-text-splitters>=0.3.0  # Chia nhỏ văn bản cho luồng RAG
```

---

## 3. Cấu Trúc Tệp (File Structure & Responsibility)

```
backend/
├── main.py              # Điểm khởi chạy: khởi tạo FastAPI, CORS, middleware, startup
├── database.py          # SQLAlchemy engine, SessionLocal, init_db()
├── models.py            # Khai báo ORM: MockJob, MockSession, SessionQuestion
├── ai_service.py        # Wrapper trung gian chuyển tiếp lệnh gọi vào thư mục ai/
├── seed_data.py         # Tự động tạo dữ liệu mẫu khi DB trống (7 jobs, 3 sessions)
├── requirements.txt     # Danh sách thư viện Python
├── test_main.py         # Bộ kiểm thử tích hợp (7 tests, sử dụng DB độc lập)
├── .env                 # Các biến môi trường
├── .env.example         # File mẫu cho .env
├── ai/                  # Gói dịch vụ AI dựa trên LangChain
│   ├── __init__.py      # Xuất các hàm (Exports): generate_questions, analyze_cv, ...
│   ├── config.py        # Dataclass AIConfig + hàm load_config() từ env
│   ├── schemas.py       # Pydantic models cho tool args + xác thực đầu ra
│   ├── prompts.py       # 6 bộ ChatPromptTemplate
│   ├── chains.py        # Hàm build_llm(), logic thử lại (retry), kiểm tra biến số
│   ├── validators.py    # Xác thực highlight (Verbatim chunk), trình tạo khối QA
│   ├── service.py       # Logic nghiệp vụ (Business logic): 8 hàm gọi AI
│   └── pinecone_service.py  # Pinecone VectorDB: index_document, get_retriever
├── routes/
│   ├── __init__.py      # Bộ định tuyến API
│   ├── jobs.py          # Router cho Jobs (GET /api/jobs, GET /api/jobs/:id)
│   ├── sessions.py      # CRUD sessions + Đánh giá AI + Upload CV + Custom Mock
│   └── voice.py         # Phỏng vấn giọng nói: TTS, STT, luồng SSE streaming
└── models/              # Các file mô hình Sherpa-ONNX STT
    └── sherpa-onnx-streaming-zipformer-multilingual/
        ├── tokens.txt
        ├── encoder-epoch-75-avg-11-chunk-16-left-128.int8.onnx
        ├── decoder-epoch-75-avg-11-chunk-16-left-128.onnx
        └── joiner-epoch-75-avg-11-chunk-16-left-128.int8.onnx
```

---

## 4. Luồng Khởi Động Ứng Dụng (Startup Flow)

```python
# main.py — Trình tự thực thi:
1. Thiết lập mã hóa UTF-8 (sys.stdout/stderr)
2. load_dotenv()                    # Tải các biến môi trường
3. Khởi tạo đối tượng ứng dụng FastAPI
4. Thêm middleware CORS
5. Đăng ký các router (jobs, sessions, voice)
6. Thêm middleware phản hồi UTF-8
7. @app.on_event("startup"):
   a. init_db()                     # Chạy CREATE TABLE IF NOT EXISTS
   b. seed_database(db)             # Thêm dữ liệu mẫu nếu DB trống
8. uvicorn.run("main:app", port=8000, reload=True)
```

---

## 5. Tầng Cơ Sở Dữ Liệu (Database Layer)

### 5.1. Cấu hình Engine (`database.py`)

```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mockitv.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30},
    echo=False,
)

# SQLite chế độ WAL (bật cho mọi kết nối)
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

### 5.2. Tiêm Sự Phụ Thuộc (Dependency Injection)

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## 6. Lược Đồ Cơ Sở Dữ Liệu (ORM Models)

### 6.1. MockJob (`mock_jobs`)

| Cột (Column) | Kiểu (Type) | Ràng buộc (Constraints) | Mô tả                                   |
| ---------- | ----------- | ---------------------- | --------------------------------------------- |
| id         | Integer     | Khóa chính, tự động tăng | ID                                            |
| title      | String(255) | KHÔNG RỖNG               | Tên vị trí                                    |
| company    | String(255) | KHÔNG RỖNG               | Tên công ty                                   |
| category   | String(50)  | KHÔNG RỖNG               | backend/frontend/devops/ai-ml/fullstack/custom |
| level      | String(50)  | KHÔNG RỖNG               | Intern/Fresher/Junior/Middle/Senior/Principal  |
| department | String(50)  | KHÔNG RỖNG               | Backend/Frontend/DevOps/AI-ML                 |
| tech_stack | Text        | KHÔNG RỖNG, mặc định="[]"| Chuỗi JSON mảng kỹ năng                       |
| rounds     | Integer     | mặc định=3              | Số vòng phỏng vấn (= số câu hỏi)              |
| logo_url   | String(500) | mặc định=""             | URL ảnh đại diện (avatar) công ty             |

**Mối quan hệ (Relationships):** `sessions` → 1:N → MockSession

**Các phương thức (Methods):**

- `tech_stack_list` (property) — Chuyển đổi JSON ↔ danh sách mảng (list[str])
- `to_dict()` — Đóng gói (Serialize) thành JSON response (khóa dạng camelCase)

### 6.2. MockSession (`mock_sessions`)

| Cột (Column)          | Kiểu (Type) | Ràng buộc (Constraints)| Mô tả                     |
| --------------------- | ---------- | --------------------- | ------------------------------- |
| id                    | Integer    | Khóa chính            | ID                              |
| job_id                | Integer    | Khóa ngoại → mock_jobs.id | Liên kết với công việc          |
| status                | String(20) | mặc định="in_progress"| Đang tiến hành / Đã hoàn thành  |
| overall_score         | Integer    | mặc định=0             | Điểm tổng quan (0-100)          |
| technical_score       | Integer    | mặc định=0             | Điểm kỹ thuật                   |
| communication_score   | Integer    | mặc định=0             | Điểm giao tiếp                  |
| problem_solving_score | Integer    | mặc định=0             | Điểm giải quyết vấn đề          |
| ai_overall_feedback   | Text       | mặc định=""            | Lời nhận xét tổng từ AI         |
| strengths             | Text       | mặc định="[]"          | Mảng JSON — điểm mạnh           |
| weaknesses            | Text       | mặc định="[]"          | Mảng JSON — điểm yếu            |
| topics_to_learn       | Text       | mặc định="[]"          | Mảng JSON — chủ đề cần học      |
| resources             | Text       | mặc định="[]"          | Mảng JSON — tài liệu tham khảo  |
| created_at            | DateTime   | Tự động lấy giờ UTC    | Thời gian khởi tạo              |

**Mối quan hệ:**

- `job` → N:1 → MockJob
- `questions` → 1:N → SessionQuestion (sắp xếp theo question_order)

### 6.3. SessionQuestion (`session_questions`)

| Cột (Column)    | Kiểu (Type) | Ràng buộc (Constraints) | Mô tả                          |
| --------------- | ---------- | --------------------- | ------------------------------------ |
| id              | Integer    | Khóa chính            | ID                                   |
| session_id      | Integer    | Khóa ngoại → mock_sessions.id | Liên kết với phiên phỏng vấn    |
| question_order  | Integer    | KHÔNG RỖNG              | Thứ tự câu hỏi (bắt đầu từ 1)        |
| tag             | String(50) | mặc định="technical"   | Thẻ: kỹ thuật/hành vi/giải quyết vấn đề |
| question_text   | Text       | KHÔNG RỖNG              | Nội dung câu hỏi                     |
| user_answer     | Text       | mặc định=""            | Câu trả lời của người dùng           |
| score           | Integer    | mặc định=0             | Điểm cho câu trả lời này (0-100)     |
| analysis_chunks | Text       | mặc định="[]"          | JSON — highlight phân tích từng từ   |
| feedback_chunks | Text       | mặc định="[]"          | JSON — lời khuyên chi tiết cho câu này |
| strengths       | Text       | mặc định="[]"          | Mảng JSON điểm mạnh                  |
| weaknesses      | Text       | mặc định="[]"          | Mảng JSON điểm yếu                   |
| recommendations | Text       | mặc định="[]"          | Mảng JSON khuyến nghị sửa đổi        |

---

## 7. Giao Tiếp API (API Endpoints)

### 7.1. Công Việc (`routes/__init__.py` / `routes/jobs.py`)

| Phương thức | Đường dẫn            | Mô tả    | Tham số (Query Params)                    |
| ------ | -------------------- | -------------- | ----------------------------------------- |
| GET    | `/api/jobs`          | Lấy danh sách công việc | `category` (tùy chọn), `level` (tùy chọn) |
| GET    | `/api/jobs/{job_id}` | Lấy chi tiết công việc  | —                                         |

### 7.2. Phiên Phỏng Vấn (`routes/sessions.py`)

| Phương thức | Đường dẫn                       | Mô tả                                 | Body (Dữ liệu gửi lên)                  |
| ------ | ----------------------------- | ------------------------------------------- | --------------------------------------- |
| GET    | `/api/sessions`               | Lấy lịch sử phỏng vấn                       | —                                       |
| GET    | `/api/sessions/{id}`          | Lấy chi tiết phiên + câu hỏi                | —                                       |
| POST   | `/api/sessions`               | Tạo phiên mới (AI sinh câu hỏi)             | `{job_id, questions_count?, cv_text?}`  |
| POST   | `/api/sessions/{id}/answer`   | Nộp câu trả lời cho một câu hỏi             | `{question_id, answer}`                 |
| POST   | `/api/sessions/{id}/evaluate` | Kích hoạt AI đánh giá toàn bộ (Batch)       | —                                       |
| POST   | `/api/sessions/parse-cv`      | Trích xuất văn bản từ tệp CV (PDF/DOCX)     | `multipart/form-data {file}`            |
| POST   | `/api/sessions/analyze-cv`    | AI phân tích CV so với vị trí công việc     | `{job_id, cv_text}`                     |
| POST   | `/api/sessions/custom-mock`   | Tải lên CV/JD → RAG → tạo phiên mock tùy chỉnh | `multipart/form-data {file, type, questions_count}` |

### 7.3. Phỏng Vấn Giọng Nói (`routes/voice.py`)

| Phương thức | Đường dẫn                                 | Mô tả                               | Body (Dữ liệu gửi lên)  |
| --------- | --------------------------------------- | ----------------------------------------- | --------------------- |
| POST      | `/api/voice/tts`                        | Chuyển văn bản thành giọng nói (audio/mpeg)| `{text}`              |
| POST      | `/api/voice/stt`                        | Dịch giọng nói thành văn bản (Batch STT)   | Dữ liệu nhị phân (PCM)|
| WebSocket | `/api/voice/ws-stt`                     | Nhận diện giọng nói luồng thời gian thực   | Các mảng nhị phân PCM |
| POST      | `/api/voice/sessions/{id}/message`      | Gửi tin nhắn user, nhận phản hồi AI        | `{message, history?}` |
| POST      | `/api/voice/sessions/{id}/message-stream` | Phản hồi luồng SSE AI (từng câu một)       | `{message, history?}` |

### 7.4. Hệ Thống (Health & Root)

| Phương thức | Đường dẫn       | Kết quả trả về (Response)                                 |
| ------ | ------------- | -------------------------------------------------------- |
| GET    | `/`           | `{"message": "MockITV API is running", "docs": "/docs"}` |
| GET    | `/api/health` | `{"status": "ok", "service": "MockITV Backend"}`         |

---

## 8. Các Mô Hình Dữ Liệu Đầu Vào/Đầu Ra (Request/Response Models)

### CreateSessionRequest

```python
class CreateSessionRequest(BaseModel):
    job_id: int
    questions_count: int = 7    # Mặc định 7 câu hỏi
    cv_text: Optional[str] = None  # Truyền thêm văn bản CV để AI cá nhân hóa
```

### Phiên Tùy Chỉnh - Custom Mock Session (multipart)

```
POST /api/sessions/custom-mock
Content-Type: multipart/form-data

file: <Tệp PDF hoặc DOCX>
type: "cv" | "jd"
questions_count: 7  (mặc định)
```

### AnalyzeCVRequest

```python
class AnalyzeCVRequest(BaseModel):
    job_id: int
    cv_text: str
```

### SubmitAnswerRequest

```python
class SubmitAnswerRequest(BaseModel):
    question_id: int
    answer: str
```

### TTSRequest (Giọng nói)

```python
class TTSRequest(BaseModel):
    text: str
```

### VoiceMessageRequest (Giọng nói)

```python
class VoiceMessageRequest(BaseModel):
    message: str
    history: list[dict] = []    # Lịch sử hội thoại [{role, content}]
```

---

## 9. Dịch vụ AI — Kiến Trúc LangChain (`ai/`)

> **Refactored:** Chuyển đổi từ file `ai_service.py` độc lập thành hệ thống gói `ai/` gồm 8 file làm việc chuyên biệt. File `ai_service.py` cũ giờ chỉ là điểm giao tiếp bọc ngoài (thin wrapper re-export).

### 9.1. Kiến Trúc AI

```
┌──────────────────────────────────────────────────────────┐
│                   ai/ Package                             │
│                                                          │
│  config.py ──→ Cấu hình AIConfig (model, api_key, retry) │
│                                                          │
│  prompts.py ──→ 6 mẫu kịch bản ChatPromptTemplate        │
│    • GENERATE_QUESTIONS_PROMPT                           │
│    • GENERATE_QUESTIONS_WITH_CV_PROMPT                   │
│    • GENERATE_CUSTOM_QUESTIONS_PROMPT                    │
│    • EVALUATE_SESSION_PROMPT                             │
│    • ANALYZE_CV_PROMPT                                   │
│    • VOICE_SYSTEM_PROMPT                                 │
│                                                          │
│  schemas.py ──→ Pydantic models (định dạng đầu ra JSON)  │
│    • QuestionItem, AnalysisChunk, FeedbackChunk          │
│    • PerQuestionEvaluation, OverallEvaluation            │
│    • AnalyzeCVArgs, NotableProject                       │
│    • CleanEvaluateSessionResult, CleanOverall            │
│                                                          │
│  chains.py ──→ Xây dựng LLM + Xử lý lỗi + Tool parser    │
│    • build_llm() → ChatOpenAI                            │
│    • ainvoke_with_retry_429()                            │
│    • parse_*_args() validators                           │
│                                                          │
│  service.py ──→ Nghiệp vụ kinh doanh (8 hàm AI chính)    │
│    • Sử dụng @tool decorators để bắt buộc định dạng      │
│    • generate_questions(cv_context=...)                   │
│    • generate_custom_questions(namespace, mock_type)      │
│    • analyze_cv()                                        │
│    • batch_evaluate_session()                            │
│    • voice_interview_respond()                           │
│    • voice_interview_respond_stream()                    │
│    • text_to_speech()                                    │
│                                                          │
│  pinecone_service.py ──→ Pinecone VectorDB               │
│    • get_vectorstore(namespace)                          │
│    • index_document(text, namespace)                     │
│    • get_retriever(namespace, k)                         │
│                                                          │
│  validators.py ──→ Rà soát Verbatim, trình xây dựng QA   │
└──────────────────────────────────────────────────────────┘
```

### 9.2. Cấu hình (`config.py`)

```python
@dataclass(frozen=True)
class AIConfig:
    api_key: str
    model: str
    base_url: str | None = None
    temperature: float = 1.0
    max_retries_429: int = 5
    retry_delay_sec: float = 3.0
    verbatim_fix_retries: int = 2

def load_config() -> AIConfig:
    # Đọc OPENAI_API_KEY, OPENAI_MODEL, OPENAI_ENDPOINT từ môi trường
```

### 9.3. Gán công cụ bắt buộc đầu ra (LangChain `@tool`)

```python
@tool
def generate_interview_questions(questions: list[QuestionItem]) -> str:
    """Công cụ tạo dữ liệu JSON cho câu hỏi phỏng vấn."""
    return "ok"

# Cách dùng:
llm = build_llm(cfg).bind_tools(
    [generate_interview_questions],
    tool_choice="generate_interview_questions",
)
msg = await llm.ainvoke(messages)
args = msg.tool_calls[0]["args"]  # Tự động chuyển JSON thành Dict
```

### 9.4. Dịch vụ RAG Pinecone (`pinecone_service.py`)

```python
# Tạo Embeddings
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-large",
    dimensions=1024,
)

# Đưa tài liệu vào chỉ mục Pinecone (Index)
def index_document(text: str, namespace: str):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=100,
        separators=["\n\n", "\n", " ", ""]
    )
    docs = text_splitter.create_documents([text])
    vectorstore = get_vectorstore(namespace)
    vectorstore.add_documents(docs)

# Trình truy xuất cho RAG (Retrieve)
def get_retriever(namespace: str, k: int = 4):
    vectorstore = get_vectorstore(namespace)
    return vectorstore.as_retriever(search_kwargs={"k": k})
```

### 9.5. 8 Hàm AI Phục Vụ Nghiệp Vụ

| # | Tên Hàm | Đầu vào | Có dùng Tool Không? |
|---|---|---|---|
| 1 | `generate_questions()` | `(position, level, tech_stack, count=7, cv_context=None)` | ✅ `generate_interview_questions` |
| 2 | `generate_custom_questions()` | `(namespace, mock_type, count=7)` | ✅ `generate_interview_questions` |
| 3 | `batch_evaluate_session()` | `(position, level, questions)` | ✅ `evaluate_mock_interview_session` |
| 4 | `analyze_cv()` | `(cv_text, position, tech_stack)` | ✅ `analyze_candidate_cv` |
| 5 | `voice_interview_respond()` | `(position, level, tech_stack, messages)` | ❌ Chữ thường (Free text) |
| 6 | `voice_interview_respond_stream()` | `(position, level, tech_stack, messages)` | ❌ Chữ thường (Trả về async generator) |
| 7 | `text_to_speech()` | `(text) → bytes` | — Gọi dịch vụ Edge-TTS |
| 8 | `index_document()` | `(text, namespace)` | — Gọi dịch vụ Pinecone |

### 9.6. Phương Án Dự Phòng (Fallback Strategy)

```python
# Nếu quá trình batch_evaluate_session() gặp lỗi sập mạng hoặc từ chối từ AI:
fallback = {
    "evaluations": [{"score": 50, "analysis_chunks": [...], ...} cho mỗi câu hỏi],
    "overall": {"overall_score": 50, ..., "feedback_text": "Lỗi hệ thống: {error}"}
}
```

---

## 10. Middleware & Configuration

### CORS

```python
allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"]
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

### Middleware Ép Kiểu UTF-8

```python
@app.middleware("http")
async def utf8_response_middleware(request, call_next):
    response = await call_next(request)
    if "application/json" in response.headers.get("content-type", ""):
        response.headers["content-type"] = "application/json; charset=utf-8"
    return response
```

---

## 11. Dữ Liệu Khởi Tạo Ban Đầu (`seed_data.py`)

Khi database trống (0 bản ghi MockJob), hệ thống tự động sinh dữ liệu:

### Danh Sách Công Việc (7 bản ghi)

| ID  | Tên Vị Trí                      | Công Ty           | Lĩnh Vực  | Cấp Độ    |
| --- | --------------------------- | ----------------- | --------- | --------- |
| 1   | Software Engineer Intern    | Tech Unicorn      | backend   | Intern    |
| 2   | Frontend Developer          | Fintech Startup   | frontend  | Fresher   |
| 3   | Senior Backend Engineer     | E-commerce Giant  | backend   | Senior    |
| 4   | AI / Machine Learning Engineer | AI Research Lab | ai-ml     | Middle    |
| 5   | DevOps Engineer             | Cloud Services VN | devops    | Junior    |
| 6   | Principal Software Architect | Global Tech Corp | fullstack | Principal |
| 999 | Tùy chỉnh (Custom Mock)    | User              | custom    | N/A       |

### Các Phiên (3 bản ghi) — Dữ liệu đã chấm sẵn điểm

- Session 1 (Job 1): Điểm 41 (thấp) — 7 câu hỏi kèm bài phân tích chi tiết cho Câu 1
- Session 2 (Job 2): Điểm 72 (trung bình)
- Session 3 (Job 3): Điểm 85 (cao)

---

## 12. Xử Lý Lỗi Hệ Thống

| Tầng / Khu Vực        | Chiến lược khắc phục                             |
| --------------------- | ------------------------------------------------ |
| AI generate_questions | Try/catch → Trả về các câu hỏi chung chung       |
| AI batch_evaluate     | Try/catch → Cho điểm mặc định 50 + Thông báo lỗi |
| AI analyze_cv         | Try/catch → Trả về kết quả phân tích trống       |
| Pinecone indexing     | Try/catch → Hoàn tác (rollback) DB + Lỗi 500     |
| Không tìm thấy Phiên  | Trả về lỗi HTTPException 404                     |
| Không tìm thấy Job    | Trả về lỗi HTTPException 404                     |
| Không tìm thấy Câu Hỏi| Trả về lỗi HTTPException 404                     |
| AI đánh giá thất bại  | Trả về lỗi HTTPException 500                     |
| Quá tải giới hạn API (429)| Tự động thử lại chậm dần (Exponential backoff, tối đa 5 lần) |
| Giọng nói TTS lỗi     | Thử lại 3 lần với khoảng cách 0.5s               |
| Sai lệch highlight    | Tự động nhắc nhở AI sửa lại (tối đa 2 lần sửa)   |
| Tệp tải lên quá nặng  | Lỗi HTTPException 413 (Tối đa chỉ 5MB)           |
| Sai định dạng tệp     | Lỗi HTTPException 400 (Chỉ chấp nhận PDF/DOCX)   |
| Tệp tải lên trống rỗng| Lỗi HTTPException 422                            |

---

## 13. Sơ Đồ Dữ Liệu: Phỏng Vấn Mock Tùy Chỉnh (RAG)

```
POST /api/sessions/custom-mock (Dạng multipart/form-data: file, type, questions_count)
    │
    ├─ Đọc file vừa upload (tối đa 5 MB)
    ├─ Trích xuất văn bản chữ (bằng pypdf / python-docx)
    │
    ├─ Khởi tạo MockSession(job_id=999, status="in_progress")
    ├─ db.flush() → để lấy session.id
    │
    ├─ Nhúng dữ liệu vào hệ thống Pinecone:
    │   ├─ Định danh namespace = f"session_{session.id}"
    │   ├─ Chạy RecursiveCharacterTextSplitter(chunk_size=1000, overlap=100)
    │   ├─ Chạy OpenAIEmbeddings(model="text-embedding-3-large", 1024 dims)
    │   └─ Ghi vào PineconeVectorStore.add_documents()
    │
    ├─ Sinh bộ câu hỏi phỏng vấn qua cơ chế RAG:
    │   ├─ Gọi trình truy xuất get_retriever(namespace, k=10)
    │   ├─ Truy vấn "skills, experience, and requirements"
    │   ├─ Gộp các mảng chữ trích được thành văn bản toàn vẹn
    │   ├─ Chạy prompt GENERATE_CUSTOM_QUESTIONS_PROMPT + đoạn văn bản trên
    │   ├─ Sử dụng công cụ giới hạn định dạng generate_interview_questions
    │   └─ Dùng thư viện Pydantic xác nhận mảng dữ liệu list[QuestionItem]
    │
    ├─ Chèn kết quả vào bảng SessionQuestion
    ├─ db.commit()
    └─ Trả kết quả JSON session.to_dict(include_questions=True)
```

---

## 14. Biến Môi Trường (Environment Variables)

| Biến (Variable)   | Yêu cầu Bắt Buộc | Mặc định               | Mô tả                        |
| ----------------- | -------- | ---------------------- | ---------------------------------- |
| DATABASE_URL      | Không       | sqlite:///./mockitv.db | Chuỗi kết nối Database             |
| OPENAI_ENDPOINT   | Có      | —                      | Đường dẫn gốc (Base URL) gọi API AI|
| OPENAI_API_KEY    | Có      | —                      | Khóa API Key của LLM               |
| OPENAI_MODEL      | Có      | —                      | Tên mô hình (vd: GPT-5.4)         |
| PINECONE_API_KEY  | Có*     | —                      | Khóa Pinecone API (Phục vụ RAG Custom Mock) |
| PINECONE_INDEX_NAME | Không     | mockitv                | Tên Index của Pinecone             |
| EMBEDDING_API_KEY | Có*     | —                      | Khóa API cho text-embedding-3-large|

*Chỉ bắt buộc có nếu bạn sử dụng tính năng phỏng vấn tùy chỉnh RAG (Custom Mock). Các tính năng gốc vẫn hoạt động bình thường mà không cần Pinecone.

---

## 15. Quá Trình Phát Triển & Khởi Chạy

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # Mở file .env và điền các khóa API vào
python main.py          # → Backend sẽ chạy ở http://localhost:8000
```

Hoặc gọi trực tiếp bằng `uvicorn`:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 16. Các Quyết Định Thiết Kế Chính (Key Design Patterns)

1. **Trừu tượng hóa (Abstraction) LangChain** — Quản lý đồng nhất giao diện LLM qua `ChatOpenAI`, `@tool`, `ChatPromptTemplate`.
2. **Kiểm tra lược đồ Pydantic (Schema Validation)** — Đảm bảo định dạng an toàn cho đầu ra AI thông qua `model_validate()`.
3. **Phân tách trách nhiệm (Separation of Concerns)** — Tách bộ điều khiển thành 8 file: config / schemas / prompts / chains / validators / service / pinecone.
4. **Tiêm sự phụ thuộc (Dependency Injection)** — Sử dụng `Depends(get_db)` của FastAPI để truyền phiên nối kết cơ sở dữ liệu.
5. **Gọi hàm chức năng (Function Calling)** — Dùng `bind_tools()` + `tool_choice` ép buộc AI chỉ trả kết quả ở một dạng cấu trúc cho trước.
6. **Chấm điểm theo lô (Batch Processing)** — Dùng chỉ 1 lần gọi API để đánh giá xong toàn bộ một phiên phỏng vấn.
7. **Bảo toàn chức năng lỗi mượt mà (Graceful Degradation)** — Có điểm neo dự phòng tại mọi chỗ có tương tác AI.
8. **Kiểm duyệt lỗi nguyên văn (Verbatim Retry)** — Tự động nhắc nhở lại mô hình nếu AI trả về dữ liệu analysis_chunks sai khác so với câu gốc ứng viên trả lời.
9. **Cá nhân hóa CV** — Cung cấp khả năng phân tích CV để thiết lập một cuộc phỏng vấn dựa đúng kinh nghiệm người dùng.
10. **Kiến trúc RAG (RAG Pipeline)** — Kết hợp Pinecone VectorDB + text-embedding-3-large cho tính năng Custom Mock.
11. **Dữ liệu phân mảnh luồng (SSE Streaming)** — Đổ kết quả câu trả lời của AI theo từng câu nói cho tính năng phỏng vấn giọng nói.
12. **Mẫu khởi tạo độc nhất (Singleton Pattern)** — Nạp các mô hình nhận diện giọng nói Sherpa-ONNX và AIConfig thông qua quá trình tải trễ (lazy-load) duy nhất 1 lần.
13. **Chế độ đa luồng WAL Mode** — Tối ưu hóa đọc dữ liệu đồng thời ở file SQLite.

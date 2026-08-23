# MockITV — Phân Tích Kinh Doanh & Tổng Quan Dự Án (Business Analysis & Project Overview)

## 1. Lý Do Chọn Đề Tài

Chuẩn bị phỏng vấn là một trong những thử thách khó khăn nhất đối với kỹ sư phần mềm và các chuyên gia công nghệ. Trong khi kiến thức lý thuyết có thể học từ sách vở, việc tổ chức các buổi phỏng vấn thử (mock interviews) sát thực tế lại vô cùng khó khăn, và các dịch vụ mentor chuyên nghiệp thì có chi phí cực kỳ đắt đỏ.

Chúng tôi chọn đề tài này vì:

- **Chi phí Mentor/Người phỏng vấn quá cao:** Việc đặt lịch với các chuyên gia phỏng vấn cho các buổi mock session có thể tốn hàng trăm đô la mỗi giờ, khiến sinh viên, thực tập sinh và kỹ sư junior khó tiếp cận.
- **Khó khăn trong việc sắp xếp lịch:** Việc điều phối lịch trình giữa các lập trình viên bận rộn (mentor) và ứng viên thường rất kém hiệu quả.
- **Sự thích ứng của AI:** Các mô hình ngôn ngữ lớn LLMs (thông qua API tương thích OpenAI kết hợp với Function Calling) đã phát triển tới mức độ có thể đóng vai trò như những người phỏng vấn thực thụ, cực kỳ sát thực tế về cả kỹ năng chuyên môn lẫn hành vi, và có thể tùy biến theo bất kỳ tech stack hay cấp độ kinh nghiệm nào.
- **Sự bùng nổ của công nghệ RAG:** Vector databases như Pinecone kết hợp với mô hình nhúng (embedding models như text-embedding-3-large) cho phép sinh câu hỏi nhận thức được ngữ cảnh tài liệu — ứng viên có thể tải lên CV hoặc Job Description để có một buổi phỏng vấn được cá nhân hóa hoàn toàn.
- **Tính ứng dụng thực tiễn:** Dự án này có tính ứng dụng cao đối với ngành phát triển phần mềm hiện đại, trực tiếp giải quyết bài toán phát triển sự nghiệp và tìm kiếm việc làm.

Dự án này cũng mang lại cơ hội tuyệt vời để kết hợp:

- **Phát triển Full-stack:** Xây dựng các dịch vụ hiệu năng cao với React 19/Next.js 16 (Frontend) và FastAPI/Python (Backend).
- **Kỹ thuật Prompt nâng cao:** Điều hướng AI đóng vai trò như một người phỏng vấn nghiêm khắc, thực tế và trả về dữ liệu có cấu trúc ổn định.
- **Thiết kế luồng RAG:** Triển khai chia nhỏ tài liệu (chunking), vector embedding, tìm kiếm tương đồng (similarity search), và sinh ngữ cảnh qua Pinecone VectorDB.
- **Kiến trúc AI Tối ưu chi phí:** Áp dụng chiến lược chấm điểm hàng loạt (batch-evaluation) giúp giảm hơn 80% chi phí API token.
- **Hệ thống Phản hồi Trực quan:** Làm nổi bật các câu trả lời của người dùng bằng các màu xanh/vàng/đỏ kết hợp với micro-animations tương tác.

---

## 2. Nỗi Đau Khách Hàng (Pain Points)

### Phản Hồi Chung Chung và Thiếu Hữu Ích

Khi ứng viên trượt các cuộc phỏng vấn thực tế, họ hiếm khi nhận được những phản hồi chi tiết, có tính hành động. Các công cụ mock trực tuyến truyền thống thường chỉ đưa ra các đánh giá AI chung chung, dạng văn bản dài dòng mà không chỉ ra chính xác ứng viên đã làm tốt hay gặp khó khăn ở điểm nào.

### Chi Phí Luyện Tập Cao

Các buổi mock interview chất lượng thường:

- Đắt đỏ (yêu cầu đăng ký gói tháng hoặc trả phí giờ cao cho mentor)
- Ít thường xuyên (bị giới hạn bởi thời gian rảnh của người phỏng vấn thực)
- Áp lực cao (ứng viên thường muốn có một không gian an toàn, riêng tư để luyện tập những câu trả lời đầu tiên trước)

Điều này làm chậm đáng kể quá trình chuyển đổi nghề nghiệp và hiệu quả chuẩn bị phỏng vấn.

### Thiếu Phân Tích Chi Tiết Tới Từng Câu Chữ

Ứng viên không chỉ đơn thuần là trượt hay đỗ một câu hỏi. Họ có thể hiểu đúng khái niệm cốt lõi nhưng lại bỏ sót các từ khóa kỹ thuật cụ thể hoặc chi tiết quan trọng.

- Các nền tảng hiện có thiếu khả năng phân tích trực tiếp từng từ trong câu trả lời thực tế của ứng viên.
- Ứng viên không thể dễ dàng biết được cụm từ nào được đánh giá là "xuất sắc" (xanh), "chưa đầy đủ" (vàng), hoặc "thiếu/sai" (đỏ).

### Câu Hỏi Dập Khuôn (One-Size-Fits-All)

- Hầu hết các nền tảng tạo ra các bộ câu hỏi chung chung bất kể nền tảng kinh nghiệm của ứng viên.
- Không có khả năng tùy chỉnh buổi phỏng vấn dựa trên CV thực tế hoặc Mô tả công việc (Job Description).
- Câu hỏi không xoáy sâu vào các dự án cụ thể hoặc các lỗ hổng kỹ năng của ứng viên.

---

## 3. Giải Pháp Đề Xuất & Tính Năng Đã Triển Khai

### 3.1. Nền Tảng Mock Interview Cốt Lõi

**MockITV** giải quyết tất cả những pain points này thông qua một nền tảng Mock Interview hoàn toàn tự động, vận hành bằng AI:

- **Sinh Phiên Phỏng Vấn Cá Nhân Hóa:** Tự động tạo ra các bộ câu hỏi kỹ thuật, hành vi và giải quyết vấn đề dựa trên Vị trí ứng tuyển, Cấp độ kinh nghiệm (Thực tập sinh → Trưởng nhóm), và Tech Stack.
- **Cơ Chế Token Batching Hiệu Quả:** Thu thập toàn bộ câu trả lời của người dùng và đánh giá chúng trong một request batch duy nhất sau khi phỏng vấn kết thúc. Điều này giảm thiểu đến ~80% chi phí LLM API token.
- **Highlight Từng Câu Chữ (Granular Verbatim Highlighting):** Phân tích từng từ trong câu trả lời của ứng viên và định dạng chúng theo các khối màu sắc động (success/warning/danger/normal). Mỗi khối văn bản đi kèm với tooltip tương tác chứa lời giải thích và lời khuyên cải thiện từ AI.
- **Chấm Điểm Đa Chiều:** 4 thang điểm độc lập (Tổng quan, Kỹ thuật, Giao tiếp, Giải quyết vấn đề) kèm theo đánh giá điểm mạnh, điểm yếu, khuyến nghị, các chủ đề cần học thêm và tài nguyên học tập.

### 3.2. Chế Độ Phỏng Vấn Bằng Giọng Nói (Voice Interview Mode)

Trải nghiệm phỏng vấn thoại theo thời gian thực được hỗ trợ bởi:
- **Sherpa-ONNX:** Nhận diện giọng nói (STT) streaming qua WebSocket — hoạt động offline, đa ngôn ngữ, trả kết quả real-time.
- **Edge-TTS:** Giọng đọc AI tiếng Việt (vi-VN-NamMinhNeural) — tự nhiên, tốc độ cao, miễn phí.
- **Conversational AI:** Tích hợp LangChain chat với bộ nhớ lịch sử tin nhắn — AI phản hồi, đưa ra nhận xét và đặt câu hỏi tiếp nối.
- **SSE Streaming:** AI stream câu trả lời theo từng câu (sentence-by-sentence) giúp giảm thiểu độ trễ khi phát audio.

### 3.3. Phân Tích CV & Cá Nhân Hóa

Tải lên CV (PDF/DOCX) → AI phân tích:
- **Cấp độ ứng viên:** Tự động nhận diện (Intern → Senior)
- **Kỹ năng đã xác thực:** Các kỹ năng được tìm thấy trong CV
- **Kỹ năng còn thiếu (Skill Gaps):** Các kỹ năng còn thiếu so với vị trí ứng tuyển
- **Dự án nổi bật:** Các dự án cần đào sâu trong buổi phỏng vấn
- **Khu vực trọng tâm:** Các chủ đề cần nhấn mạnh

Kết quả: AI sinh ra các câu hỏi cá nhân hóa liên hệ trực tiếp tới các dự án cụ thể và kỹ năng còn thiếu của ứng viên.

### 3.4. Custom Mock qua RAG (Pinecone VectorDB)

Tính năng cao cấp nhất — luồng RAG toàn diện:

1. **Upload:** Người dùng tải lên CV hoặc Job Description (PDF/DOCX)
2. **Parse:** Bóc tách text qua `pypdf` / `python-docx`
3. **Chunk:** Cắt văn bản (RecursiveCharacterTextSplitter: 1000 chars, 100 overlap)
4. **Embed:** Chuyển đổi vector qua text-embedding-3-large (1024 dimensions)
5. **Index:** Lưu trữ vào Pinecone VectorDB (namespace tách biệt cho từng session)
6. **Retrieve:** Tìm kiếm tương đồng (top-k = 10)
7. **Generate:** LLM kết hợp với context đã truy xuất → Function Calling → sinh câu hỏi có cấu trúc.

Điều này mang lại:
- Câu hỏi xoáy sâu vào các kỹ năng/dự án thực tế trong CV
- Câu hỏi bám sát yêu cầu công việc thực tế từ JD
- Mỗi lần tải lên đều tạo ra một bộ câu hỏi hoàn toàn độc nhất và chính xác với ngữ cảnh.

### 3.5. Lịch Sử & Theo Dõi Tiến Độ (History & Progress Tracking)

- Xem toàn bộ các buổi phỏng vấn trong quá khứ sắp xếp theo ngày tháng
- Xem lại chi tiết kết quả: 4 biểu đồ SVG RadialProgress, phân tích highlight cho từng câu hỏi
- Theo dõi điểm mạnh/điểm yếu qua các session khác nhau
- Nhận đề xuất các chủ đề và tài liệu cần học

---

## 4. Các Vấn Đề Gặp Phải Trong Quá Trình Triển Khai (Issues)

### Vấn đề 1: Lỗi Format JSON từ LLM không ổn định

Đôi khi AI trả về định dạng markdown hoặc câu chữ giao tiếp thông thường thay vì tool calls đúng chuẩn.

- **Cách giải quyết:** Áp dụng decorator `@tool` của LangChain + `bind_tools()` + `tool_choice` để ép buộc sử dụng Function Calling — đảm bảo 100% output là JSON có cấu trúc. Thêm `Pydantic model_validate()` để validate schema.

### Vấn đề 2: Sai lệch Verbatim trong các khối phân tích (Analysis Chunks)

Nhiều lúc AI tạo ra các `analysis_chunks` nhưng lại không khớp chính xác 100% với nguyên văn câu trả lời của ứng viên (thêm/bớt chữ).

- **Cách giải quyết:** Implement hàm `validate_verbatim_chunks()` để đối chiếu nội dung ghép lại của các chunk với câu trả lời gốc. Nếu sai lệch, hệ thống tự động retry với prompt điều chỉnh (tối đa 2 lần). Nếu vẫn fail, fallback về việc hiển thị câu trả lời nguyên khối (single-chunk).

### Vấn đề 3: Lỗi hiển thị Typography (Layout Clipping)

Cấu trúc glyph khá cao của font chữ Lexend kết hợp với aspect-ratio cứng của các Job Card khiến tiêu đề bị cắt lẹm.

- **Cách giải quyết:** Thay thế `aspect-[5/3]` cứng nhắc bằng `min-h-[240px]` linh hoạt, và áp dụng `leading-normal py-1` để chữ hiển thị trơn tru, không bị cắt.

### Vấn đề 4: Độ trễ khi load model Voice STT

Sherpa-ONNX model cần hơn 2 giây để load trong lần đầu sử dụng.

- **Cách giải quyết:** Sử dụng design pattern Singleton lazy-load — model chỉ load duy nhất 1 lần ở lần gọi WebSocket đầu tiên, các kết nối sau sẽ tái sử dụng instance đó.

### Vấn đề 5: Mất kết nối Edge-TTS

WebSocket của Edge-TTS thi thoảng bị ngắt giữa chừng khi stream.

- **Cách giải quyết:** Implement logic retry 3 lần với delay 0.5s trong hàm `text_to_speech()`. Lọc bỏ các markdown/bracket dư thừa trước khi gửi text qua TTS để tránh lỗi.

### Vấn đề 6: Rate Limit (Lỗi 429) từ LLM API

Sử dụng liên tục gây ra lỗi quá tải Rate Limit từ API.

- **Cách giải quyết:** Sử dụng thuật toán Exponential backoff retry trong `ainvoke_with_retry_429()` — bắt đầu delay 3s, nhân đôi thời gian sau mỗi lần retry, tối đa 5 lần.

---

## 5. Quyết Định Công Nghệ (Technology Decisions)

| Quyết định | Công nghệ lựa chọn | Lý do |
|---|---|---|
| Giao tiếp LLM | LangChain + Function Calling | Đảm bảo output có cấu trúc, validate được schema |
| Chiến lược đánh giá | Batching (1 call cho tất cả) | Tiết kiệm 80% token, nhận xét tổng quan logic hơn |
| Vector Database | Pinecone (cloud) | Managed, dễ scale, lưu trữ bền vững, native với LangChain |
| Engine STT | Sherpa-ONNX | Streaming, offline, siêu nhẹ (~200MB), đa ngôn ngữ |
| Engine TTS | Edge-TTS | Miễn phí, giọng đọc AI tiếng Việt chất lượng rất cao |
| Database | SQLite + WAL | Zero-config, tự động seed data, phù hợp cho bài thi workshop |
| Frontend | Next.js 16 + React 19 | Bản cập nhật App Router mới nhất, TypeScript, SSR |
| Styling | Tailwind CSS v4 | Utility-first, có dark mode, không cần config rườm rà |
| Animation | Framer Motion | Dễ dùng (Declarative), các hiệu ứng micro-interactions mượt mà |

---

## 6. Sức Ảnh Hưởng & Giá Trị Kinh Doanh (Impact & Business Value)

| Tiêu chí | Trước khi có MockITV | Dùng MockITV |
|---|---|---|
| Chi phí cho 1 lần Mock | $100-500 (thuê Mentor) | $0 (AI hỗ trợ hoàn toàn) |
| Khó khăn về lịch trình | Cao (phải khớp lịch với mentor) | Không (sẵn sàng 24/7) |
| Độ chi tiết phản hồi | Feedback bằng text chung chung | Highlight sửa lỗi từng từ + popup |
| Mức độ cá nhân hóa câu hỏi| Dập khuôn | Hiểu JD/CV nhờ RAG VectorDB |
| Tần suất luyện tập | Bị giới hạn bởi tiền/mentor | Không giới hạn |
| Phỏng vấn qua giọng nói | Cần coaching đắt tiền | Hoàn toàn miễn phí (STT + TTS) |

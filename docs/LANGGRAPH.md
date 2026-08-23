# Nâng Cấp Hệ Thống Đa Đặc Vụ (Multi-Agent System) Bằng LangGraph

Tài liệu này trình bày lý do, kiến trúc và phương pháp triển khai **LangGraph** vào nền tảng MockITV, biến hệ thống từ một ứng dụng gọi API AI tĩnh trở thành một hệ thống Đa Đặc Vụ (Multi-Agent) thông minh, có khả năng tự sửa lỗi và điều hướng theo ngữ cảnh.

---

## 1. Vấn Đề Gặp Phải (The Problem)

Trong giai đoạn đầu (MVP), kiến trúc AI của MockITV hoạt động dựa trên mô hình DAG (Directed Acyclic Graph) tuyến tính hoặc còn gọi là **One-shot generation**. 

Phương pháp này lộ rõ nhiều nhược điểm nghiêm trọng khi nền tảng phải xử lý các nghiệp vụ phức tạp:

1. **Quá tải nhận thức (Cognitive Overload) cho LLM:** Trong luồng chấm điểm (Evaluation), chúng ta yêu cầu LLM phải làm quá nhiều việc cùng lúc: chấm điểm chuyên môn, chấm điểm giao tiếp, viết lời khuyên, và đặc biệt là bóc tách nguyên văn câu trả lời (Verbatim extraction). Việc gánh quá nhiều tác vụ khiến LLM bị phân tâm, giảm độ sâu trong nhận xét chuyên môn.
2. **Lỗi "Ảo giác" nguyên văn (Verbatim Hallucination):** Việc trích xuất nguyên văn bằng `analysis_chunks` rất dễ sai sót. AI thường vô tình tự động sửa lỗi ngữ pháp của ứng viên hoặc dịch nó sang tiếng Anh, khiến dữ liệu trả về không khớp (mismatched) với giao diện người dùng, dẫn đến các lỗi vỡ UI (UI clipping).
3. **Trải nghiệm Voice thụ động (Stateless Voice):** Phỏng vấn bằng giọng nói chỉ hoạt động như một con Chatbot trả lời qua lại. Hệ thống không có khái niệm về "Giai đoạn phỏng vấn" (stages) nên không biết khi nào cần xoáy sâu (follow-up), không biết khi nào nên dừng lại, dẫn đến buổi phỏng vấn kéo dài lan man.
4. **Ngữ cảnh RAG bị rác (Noisy RAG Context):** Khi Custom Mock, hệ thống lấy dữ liệu trực tiếp từ Pinecone. Nếu dữ liệu lấy về chứa các thông tin rác (như sở thích cá nhân thay vì kỹ năng), AI sẽ sinh ra các câu hỏi vô nghĩa.

---

## 2. Giải Pháp: Tại Sao Lại Là LangGraph?

**LangGraph** (được phát triển bởi LangChain) là framework lý tưởng nhất hiện nay để xây dựng các ứng dụng LLM phức tạp thông qua khái niệm Đồ thị Trạng thái (Stateful Graph).

LangGraph giải quyết hoàn hảo bài toán của chúng ta nhờ:
- **Xây dựng Vòng lặp (Cycles):** Cho phép AI tự kiểm tra lại kết quả của chính nó, nếu phát hiện sai sót (đặc biệt là lỗi Verbatim), nó sẽ tự động chạy vòng lặp lại để tự sửa (Self-correction) thay vì phá vỡ luồng người dùng.
- **Tính Phân tán (Multi-Agent):** Cho phép chia nhỏ một Prompt khổng lồ thành nhiều tác vụ nhỏ gọn, chuyển giao cho các Agent chuyên biệt (ví dụ: Agent Kỹ thuật, Agent Hành vi). Mỗi Agent dùng một Prompt cực mỏng, tập trung, dẫn đến độ chính xác cao.
- **Duy trì Trạng thái (Stateful):** Dễ dàng thiết kế các Máy Trạng thái (State Machine) quản lý luồng Voice Interview, giúp hệ thống biết chính xác mình đang ở bước nào trong quy trình.

---

## 3. Kiến Trúc Triển Khai Trong MockITV

Chúng tôi đã thiết kế lại hoàn toàn 3 quy trình lõi (Usecases) bằng LangGraph:

### Usecase 1: Hệ Thống Đánh Giá Phân Tán (Map-Reduce Evaluation)
*Chuyển đổi từ chấm điểm vòng lặp chậm chạp sang xử lý song song (Concurrency).*

Thay vì một lần gọi LLM khổng lồ hoặc lặp qua từng câu hỏi làm nghẽn cổ chai, hệ thống Evaluation giờ ứng dụng cơ chế **Map-Reduce** của LangGraph (thông qua API `Send`):
- **Analyze Answer Node (Map):** Hệ thống chẻ nhỏ từng câu hỏi/trả lời và tạo ra nhiều Node chạy song song (Concurrent Execution). Mỗi Node độc lập phân tích chuyên môn, kỹ năng giao tiếp và bóc tách nguyên văn (Verbatim) cho một câu trả lời duy nhất. 
- **Synthesizer Node (Reduce):** Sau khi tất cả các Node phân tích chạy xong, Node này sẽ gom toàn bộ kết quả lại để dùng LLM viết ra đoạn nhận xét tổng quan sâu sắc nhất.
- **Grader Node:** Cuối cùng, tổng hợp điểm số kỹ năng và giao tiếp thành điểm cuối cùng.

✅ **Kết quả:** Hiệu suất tăng vọt nhờ xử lý song song, tiết kiệm 80% token dư thừa và triệt tiêu lỗi vỡ giao diện do Verbatim sai nhờ bóc tách độc lập trên từng câu.

### Usecase 2: Quản Lý Phỏng Vấn Giọng Nói (Stateful Voice Interviewer)
*Từ Chatbot thụ động thành Giám đốc Kỹ thuật (CTO) thông minh.*

- **State:** Lưu trữ số lượng câu hỏi đã hỏi (`questions_asked_so_far`), và hành động tiếp theo.
- **Analyzer Node:** Hoạt động như "não bộ", phân tích câu trả lời gần nhất của người dùng. Nó quyết định: 
  - *Ứng viên trả lời nông?* -> Chuyển trạng thái sang `follow_up` (Hỏi xoáy sâu).
  - *Ứng viên đã trả lời tốt?* -> Chuyển trạng thái sang `ask_new` (Chuyển chủ đề).
  - *Đã đủ 5 câu?* -> Chuyển sang `conclude` (Chủ động kết thúc cuộc gọi).
- **Interviewer Node:** Sinh ra câu nói dựa vào trạng thái định hướng từ Analyzer.

✅ **Kết quả:** Trải nghiệm phỏng vấn thoại giống 99% thực tế, chủ động dồn ép ứng viên hoặc chuyển hướng khéo léo.

### Usecase 3: Tự Sửa Lỗi RAG (Corrective RAG - CRAG)
*Từ RAG bị động sang RAG phản biện.*

- Lấy ý tưởng từ bài báo nghiên cứu **Corrective RAG (CRAG)**.
- **Retrieve Node:** Kéo dữ liệu từ Pinecone.
- **Grade Node:** Agent đánh giá xem các dữ liệu lấy về có thực sự chứa nội dung chuyên môn hay không.
- **Rewrite Node:** Nếu dữ liệu bị "rác", Agent sẽ viết lại truy vấn tìm kiếm MỚI (Query Rewriting) để kéo dữ liệu lại từ Pinecone.

✅ **Kết quả:** Các câu hỏi phỏng vấn Custom Mock dựa trên CV luôn "đâm trúng huyệt" vào dự án lớn nhất, bỏ qua các thông tin gây nhiễu.

---

## 4. Ánh Xạ Source Code (Mapping Source Code)

Để dễ dàng theo dõi và đối chiếu lý thuyết với thực tế, toàn bộ kiến trúc LangGraph của dự án được đóng gói trọn vẹn trong thư mục `backend/ai/`. 

Dưới đây là sơ đồ chức năng của các file lõi:

- 📄 **`backend/ai/graphs/evaluation_graph.py` (Cỗ máy Map-Reduce):** 
  - Nơi chứa logic băm nhỏ mảng câu hỏi/câu trả lời, đưa qua API `Send` để các Node chạy song song (Concurrent Processing). 
  - Đóng vai trò tổng hợp và viết lời khuyên cho người dùng sau khi phỏng vấn kết thúc.
- 📄 **`backend/ai/graphs/crag_graph.py` (Cỗ máy Tự Sửa Lỗi - Corrective RAG):** 
  - Nơi xây dựng hệ thống rẽ nhánh có điều kiện (Conditional Routing).
  - Phụ trách luồng đọc CV/JD, kiểm duyệt chất lượng dữ liệu lấy từ Pinecone, tự động viết lại truy vấn (Rewrite) nếu dữ liệu kém, và cuối cùng sinh ra câu hỏi Custom Mock sắc bén.
- 📄 **`backend/ai/service.py` (Người điều phối - The Orchestrator):** 
  - Đóng vai trò là cầu nối giữa giao diện API (`routes`) và hệ thống Đồ thị LangGraph. 
  - File này **không chứa logic AI**, mà làm nhiệm vụ khởi tạo biến trạng thái (State) và gọi lệnh `graph.invoke()` để kích hoạt các cỗ máy LangGraph ở trên hoạt động.

---

## 5. Tổng Kết Giá Trị Kỹ Thuật (Engineering Value)

Việc chuyển dịch sang LangGraph đã đưa MockITV vượt ra khỏi khuôn khổ của một dự án ứng dụng LLM API thông thường. 
Chúng tôi đã xây dựng thành công một **hệ sinh thái Agentic linh hoạt**, có khả năng tư duy phân nhánh, tự kiểm điểm (self-reflection), tự sửa lỗi (self-correction) và hiểu biết sâu sắc về vòng đời của một cuộc hội thoại. 

Đây chính là tiêu chuẩn thiết kế (design pattern) của các ứng dụng AI thế hệ mới (Agentic AI) trong doanh nghiệp.

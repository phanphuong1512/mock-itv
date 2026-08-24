from langchain_core.prompts import ChatPromptTemplate

GENERATE_QUESTIONS_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "You are a senior IT interviewer."),
    ("human", """Bạn là một chuyên gia phỏng vấn IT senior.

Hãy tạo {count} câu hỏi phỏng vấn cho:

- Position: {position}
- Level: {level}
- Tech stack: {tech_stack}

Yêu cầu:
- Tiếng Việt
- Sát thực tế
- Có technical
- Có behavioral
- Có problem-solving

BẮT BUỘC phải gọi function submit_interview_questions.
""")
])

EVALUATE_SESSION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "You are a senior IT interviewer."),
    ("human", """Bạn là một senior IT interviewer.

VỊ TRÍ: {position}
CẤP BẬC: {level}

DANH SÁCH CÂU HỎI VÀ CÂU TRẢ LỜI:

{qa_block}

YÊU CẦU:
1. Đánh giá toàn bộ session.
2. Phải evaluate đầy đủ tất cả câu hỏi.
3. Tất cả feedback bằng tiếng Việt.
4. BẮT BUỘC gọi function evaluate_mock_interview_session.

QUY TẮC VỀ analysis_chunks (RẤT QUAN TRỌNG):
- analysis_chunks phải TÁCH câu trả lời gốc thành các cụm từ (chunks).
- Khi ghép tất cả chunk.text lại PHẢI BẰNG ĐÚNG câu trả lời gốc (verbatim 100%), KHÔNG được thêm/bớt/sửa chữ nào.
- Mỗi chunk PHẢI có type: "success" | "warning" | "danger" | "normal".
- Nếu câu trả lời ngắn hoặc không liên quan (ví dụ: "em chịu", "không biết"), tạo 1 chunk duy nhất với type="danger".
- Mỗi chunk PHẢI có popupTitle, popupDesc, statusText.

QUY TẮC VỀ feedback_chunks:
- feedback_chunks chứa nhận xét chi tiết từ chuyên gia.
- Mỗi chunk PHẢI có type: "success" | "warning" | "danger" | "normal".
- Mỗi chunk PHẢI có popupTitle, popupDesc, statusText.
""")
])

VOICE_SYSTEM_PROMPT = """Bạn là một senior IT interviewer đang phỏng vấn ứng viên qua voice call.

VỊ TRÍ: {position}
CẤP BẬC: {level}
TECH STACK: {tech_stack}

QUY TẮC:
- Trả lời bằng tiếng Việt, ngắn gọn, tự nhiên như đang nói chuyện.
- Bạn là người phỏng vấn, KHÔNG phải ứng viên.
- Hãy phản hồi ngắn gọn câu trả lời của ứng viên (1-2 câu nhận xét), sau đó đặt câu hỏi tiếp theo.
- Câu hỏi phải sát thực tế, mix giữa technical, behavioral, và problem-solving.
- Nếu ứng viên trả lời mơ hồ, hãy hỏi thêm chi tiết (follow-up).
- Giọng điệu chuyên nghiệp nhưng thân thiện.
- KHÔNG dùng markdown, bullet points, hay formatting - chỉ text thuần vì sẽ được đọc thành giọng nói.
- Mỗi response không quá 3-4 câu."""


# ── CV Analysis ──────────────────────────────────────────────

ANALYZE_CV_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "You are a senior technical recruiter specializing in Software Engineering."),
    ("human", """Bạn là chuyên gia HR và technical recruiter senior trong ngành Công nghệ Thông tin.

Phân tích CV/resume sau đây cho vị trí tuyển dụng: {position}
Tech stack yêu cầu: {tech_stack}

=== CV ỨNG VIÊN ===
{cv_text}
=== HẾT CV ===

QUY TẮC PHÂN TÍCH:
1. CHỈ trích xuất và phân tích các kỹ năng chuyên môn kỹ thuật phần mềm, lập trình, công nghệ, dự án IT thực tế liên quan đến vị trí {position} và tech stack {tech_stack}.
2. TUYỆT ĐỐI BỎ QUA các môn học đại cương ngoài ngành (như Triết học, Lịch sử Đảng, Tư tưởng Hồ Chí Minh, Thể dục, Quân sự... nếu có trong bảng điểm đại học).
3. Đánh giá khách quan trình độ thực tế (Intern / Fresher / Junior / Middle / Senior), các dự án nổi bật và lỗ hổng kiến thức kỹ thuật cần đào sâu.

BẮT BUỘC gọi function analyze_candidate_cv.
""")
])


GENERATE_QUESTIONS_WITH_CV_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "You are a senior IT interviewer."),
    ("human", """Bạn là một chuyên gia phỏng vấn IT senior.

Hãy tạo {count} câu hỏi phỏng vấn kỹ thuật và kỹ năng cho:

- Vị trí: {position}
- Cấp bậc: {level}
- Tech stack: {tech_stack}

THÔNG TIN TỪ CV ỨNG VIÊN:
- Trình độ thực tế: {cv_level}
- Kỹ năng xác nhận: {cv_confirmed_skills}
- Điểm thiếu/yếu: {cv_skill_gaps}
- Chủ đề cần tập trung: {cv_focus_areas}
{cv_projects_section}

YÊU CẦU CÁ NHÂN HÓA:
1. 100% CÂU HỎI PHẢI LIÊN QUAN ĐẾN KỸ THUẬT LẬP TRÌNH, PHẦN MỀM VÀ CÔNG VIỆC {position}.
2. TUYỆT ĐỐI KHÔNG HỎI VỀ CÁC MÔN HỌC ĐẠI CƯƠNG NGOÀI NGÀNH (như Lịch sử Đảng, Triết học, v.v.).
3. Ít nhất 2 câu hỏi tham chiếu trực tiếp đến dự án/công nghệ/kinh nghiệm cụ thể trong CV của ứng viên.
4. Điều chỉnh độ khó phù hợp trình độ thực tế của ứng viên.

Yêu cầu chung:
- Tiếng Việt chuẩn mực, chuyên nghiệp.
- Mix giữa Technical (chuyên môn), Problem-Solving (giải quyết vấn đề), và Behavioral (kỹ năng làm việc).

BẮT BUỘC phải gọi function submit_interview_questions.
""")
])

GENERATE_CUSTOM_QUESTIONS_PROMPT = ChatPromptTemplate.from_messages([
    ("system", "You are a senior IT interviewer."),
    ("human", """Bạn là một chuyên gia phỏng vấn IT senior.

Hãy tạo {count} câu hỏi phỏng vấn chuyên môn dựa trên {mock_type} sau đây.

NGỮ CẢNH TRÍCH XUẤT TỪ {mock_type} (qua hệ thống RAG Pinecone VectorDB):
{context}

YÊU CẦU:
- 100% câu hỏi phải tập trung vào chuyên môn kỹ thuật phần mềm, giải pháp công nghệ, tư duy hệ thống và kỹ năng liên quan đến công việc.
- Nếu là CV: Khai thác sâu vào kiến trúc dự án, thư viện/framework đã dùng, các thách thức kỹ thuật ứng viên đã giải quyết.
- Nếu là JD: Đặt các bài toán kỹ thuật kiểm tra năng lực đáp ứng yêu cầu tuyển dụng trong JD.
- Tiếng Việt chuẩn mực.
- BẮT BUỘC phải gọi function submit_interview_questions.
""")
])
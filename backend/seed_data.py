# -*- coding: utf-8 -*-
"""Seed data for MockITV database — auto-populates on first run."""

import json
from datetime import datetime, timedelta, timezone

from models import MockJob, MockSession, SessionQuestion
from sqlalchemy.orm import Session


def seed_database(db: Session):
    """Populate database with initial mock data if empty."""
    if db.query(MockJob).count() > 0:
        return  # Already seeded

    # ========== MOCK JOBS ==========
    jobs = [
        MockJob(
            id=1,
            title="Software Engineer Intern",
            company="Tech Unicorn",
            category="backend",
            level="Intern",
            department="Backend",
            tech_stack=json.dumps(["Java", "Spring Boot", "MySQL"], ensure_ascii=False),
            rounds=3,
            logo_url="https://api.dicebear.com/7.x/shapes/svg?seed=TechUnicorn&backgroundColor=0B1120",
        ),
        MockJob(
            id=2,
            title="Frontend Developer",
            company="Fintech Startup",
            category="frontend",
            level="Fresher",
            department="Frontend",
            tech_stack=json.dumps(
                ["React", "Next.js", "TailwindCSS"], ensure_ascii=False
            ),
            rounds=4,
            logo_url="https://api.dicebear.com/7.x/shapes/svg?seed=Fintech&backgroundColor=0B1120",
        ),
        MockJob(
            id=3,
            title="Senior Backend Engineer",
            company="E-commerce Giant",
            category="backend",
            level="Senior",
            department="Backend",
            tech_stack=json.dumps(["Golang", "Kubernetes", "gRPC"], ensure_ascii=False),
            rounds=5,
            logo_url="https://api.dicebear.com/7.x/shapes/svg?seed=Ecommerce&backgroundColor=0B1120",
        ),
        MockJob(
            id=4,
            title="AI Engineer",
            company="AI Research Lab",
            category="ai-ml",
            level="Middle",
            department="AI / ML",
            tech_stack=json.dumps(
                ["Python", "PyTorch", "RAG", "LangChain", "LLMs"], ensure_ascii=False
            ),
            rounds=5,
            logo_url="https://api.dicebear.com/7.x/shapes/svg?seed=AIEngineer&backgroundColor=0B1120",
        ),

        MockJob(
            id=5,
            title="DevOps Engineer",
            company="Cloud Services VN",
            category="devops",
            level="Junior",
            department="DevOps",
            tech_stack=json.dumps(["AWS", "Docker", "Terraform"], ensure_ascii=False),
            rounds=3,
            logo_url="https://api.dicebear.com/7.x/shapes/svg?seed=Cloud&backgroundColor=0B1120",
        ),
        MockJob(
            id=6,
            title="Principal Software Architect",
            company="Global Tech Corp",
            category="fullstack",
            level="Principal",
            department="Fullstack",
            tech_stack=json.dumps(
                ["System Design", "Node.js", "AWS"], ensure_ascii=False
            ),
            rounds=6,
            logo_url="https://api.dicebear.com/7.x/shapes/svg?seed=Global&backgroundColor=0B1120",
        ),
        # Custom Mock Job for user to create custom interviews
        MockJob(
            id=999,
            title="Tùy chỉnh (Custom Mock)",
            company="User",
            category="custom",
            level="N/A",
            department="N/A",
            tech_stack=json.dumps([], ensure_ascii=False),
            rounds=1,
            logo_url="https://api.dicebear.com/7.x/shapes/svg?seed=Custom&backgroundColor=0B1120",
        ),
    ]
    db.add_all(jobs)
    db.flush()

    # ========== MOCK SESSIONS ==========
    now = datetime.now(timezone.utc)
    sessions = [
        MockSession(
            id=1,
            job_id=1,
            status="completed",
            overall_score=41,
            technical_score=36,
            communication_score=50,
            problem_solving_score=40,
            ai_overall_feedback=(
                "Ứng viên đã thể hiện kiến thức cơ bản về một số chủ đề backend như HTTP, SQL/NoSQL và ORM, "
                "nhưng nhìn chung còn thiếu chiều sâu và độ chính xác cần thiết cho vị trí Junior Backend Developer. "
                "Các câu trả lời thường chỉ dừng lại ở mức khái niệm chung, chưa đi vào chi tiết kỹ thuật cụ thể "
                "như nguyên tắc REST, cơ chế hoạt động của index, hay cách triển khai xử lý lỗi. "
                "Điểm yếu rõ rệt nhất là sự nhầm lẫn giữa authentication và authorization, "
                "cùng với việc bỏ qua một câu hỏi hoàn toàn, cho thấy sự chuẩn bị chưa kỹ lưỡng."
            ),
            strengths=json.dumps(
                [
                    "Có kiến thức cơ bản về HTTP methods và cách hoạt động của web",
                    "Hiểu được sự khác biệt giữa SQL và NoSQL ở mức độ khái niệm",
                    "Biết về ORM và lợi ích cơ bản của nó trong lập trình backend",
                ],
                ensure_ascii=False,
            ),
            weaknesses=json.dumps(
                [
                    "Cần nắm vững và phân biệt rõ ràng authentication và authorization, bao gồm JWT, session, OAuth",
                    "Bổ sung kiến thức chi tiết về REST API: nguyên tắc stateless, resource-based...",
                    "Học sâu hơn về indexing trong database: cấu trúc B-tree, cách đánh index hiệu quả",
                ],
                ensure_ascii=False,
            ),
            topics_to_learn=json.dumps(
                [
                    "Thiết kế RESTful API chuẩn production & stateless",
                    "Cơ chế xác thực chuyên sâu: Phân biệt JWT, Session & OAuth2",
                    "Tối ưu hóa Database: Indexing B-Tree & Quản lý Transaction",
                ],
                ensure_ascii=False,
            ),
            resources=json.dumps(
                [
                    "MDN Web Docs - HTTP Methods & Status Codes",
                    "Designing Data-Intensive Applications (Free Chapter)",
                    "Architecting Web APIs with REST - O'Reilly Ebook",
                ],
                ensure_ascii=False,
            ),
            created_at=now,
        ),
        MockSession(
            id=2,
            job_id=2,
            status="completed",
            overall_score=72,
            technical_score=70,
            communication_score=80,
            problem_solving_score=65,
            ai_overall_feedback=(
                "Ứng viên thể hiện tốt kiến thức về React, component lifecycle và state management. "
                "Câu trả lời về CSS layout và responsive design khá chi tiết. "
                "Cần cải thiện thêm về performance optimization và testing."
            ),
            strengths=json.dumps(
                [
                    "Nắm vững React hooks và component patterns",
                    "Hiểu rõ CSS Flexbox và Grid layout",
                ],
                ensure_ascii=False,
            ),
            weaknesses=json.dumps(
                [
                    "Chưa rõ về React Server Components và Next.js App Router",
                    "Thiếu kiến thức về testing (Jest, React Testing Library)",
                ],
                ensure_ascii=False,
            ),
            topics_to_learn=json.dumps(
                [
                    "Next.js App Router & Server Components",
                    "Frontend Testing Best Practices",
                ],
                ensure_ascii=False,
            ),
            resources=json.dumps(
                [
                    "Next.js Official Documentation",
                    "Testing Library Docs",
                ],
                ensure_ascii=False,
            ),
            created_at=now - timedelta(days=2),
        ),
        MockSession(
            id=3,
            job_id=3,
            status="completed",
            overall_score=85,
            technical_score=88,
            communication_score=82,
            problem_solving_score=84,
            ai_overall_feedback=(
                "Ứng viên thể hiện kiến thức chuyên sâu về system design, microservices và distributed systems. "
                "Câu trả lời rõ ràng, có cấu trúc và thể hiện kinh nghiệm thực tế."
            ),
            strengths=json.dumps(
                [
                    "Kiến thức vững chắc về microservices architecture",
                    "Hiểu rõ về Kubernetes orchestration và container networking",
                    "Có kinh nghiệm thực tế với gRPC và protocol buffers",
                ],
                ensure_ascii=False,
            ),
            weaknesses=json.dumps(
                [
                    "Có thể cải thiện thêm về observability (tracing, metrics)",
                ],
                ensure_ascii=False,
            ),
            topics_to_learn=json.dumps(
                [
                    "Distributed Tracing với OpenTelemetry",
                    "Advanced Kubernetes Networking (Service Mesh)",
                ],
                ensure_ascii=False,
            ),
            resources=json.dumps(
                [
                    "Kubernetes in Action - Manning Publications",
                    "gRPC Up and Running - O'Reilly",
                ],
                ensure_ascii=False,
            ),
            created_at=now - timedelta(days=7),
        ),
        MockSession(
            id=4,
            job_id=4,
            status="completed",
            overall_score=89,
            technical_score=91,
            communication_score=85,
            problem_solving_score=90,
            ai_overall_feedback=(
                "Ứng viên thể hiện kiến thức chuyên sâu và cập nhật về AI Engineering hiện đại: "
                "Nắm rất vững kiến trúc RAG, cơ chế Multi-Head Self-Attention của Transformer, "
                "phương pháp LoRA/QLoRA cho Fine-Tuning và luồng Multi-Agent với LangGraph. "
                "Câu trả lời có tính thực tế cao, nêu rõ các trade-off và giải pháp production."
            ),
            strengths=json.dumps(
                [
                    "Kiến thức sâu sắc về tối ưu hóa RAG (Hybrid Search, Semantic Chunking, Reranker)",
                    "Hiểu cặn kẽ bản chất toán học của Transformer Attention và tối ưu KV Cache/FlashAttention",
                    "Nắm vững kỹ thuật PEFT/LoRA và kinh nghiệm xây dựng Agentic AI workflows",
                ],
                ensure_ascii=False,
            ),
            weaknesses=json.dumps(
                [
                    "Cần bổ sung thêm kinh nghiệm triển khai LLM evaluation metrics (RAG Triad, LLM-as-a-judge)",
                ],
                ensure_ascii=False,
            ),
            topics_to_learn=json.dumps(
                [
                    "Hệ thống Đánh giá LLM Production (Ragas, DeepEval)",
                    "Bảo mật và Phòng chống Prompt Injection / Jailbreaking",
                ],
                ensure_ascii=False,
            ),
            resources=json.dumps(
                [
                    "Building Systems with the ChatGPT API - DeepLearning.AI",
                    "LangGraph & Multi-Agent Architectures Documentation",
                    "RAG Triad for LLM Evaluation - TruEra / Arize",
                ],
                ensure_ascii=False,
            ),
            created_at=now - timedelta(days=1),
        ),
    ]

    db.add_all(sessions)
    db.flush()

    # ========== SESSION 1 QUESTIONS (detailed with chunks) ==========
    q1_analysis = json.dumps(
        [
            {
                "id": "a1",
                "text": "Http là một protocol trong computer networking để các máy tính có thể giao tiếp với nhau",
                "type": "success",
                "popupTitle": "Đúng hoàn toàn",
                "popupDesc": "Định nghĩa chính xác về giao thức HTTP.",
                "statusText": "Đây là điểm mạnh xuất sắc trong câu trả lời của bạn!",
            },
            {
                "id": "a2",
                "text": " và trong đó Http có định nghĩa các method như GET POST PUT DELETE và một ",
                "type": "normal",
            },
            {
                "id": "a3",
                "text": "Rest API là một API tuân theo các method đó",
                "type": "warning",
                "popupTitle": "Đúng một phần",
                "popupDesc": "REST API quả thực sử dụng các method này, nhưng định nghĩa này quá đơn giản và thiếu tính chính xác về mặt kiến trúc.",
                "statusText": "Cần làm rõ: REST không chỉ là tuân theo các methods HTTP mà còn là một phong cách kiến trúc gồm nhiều ràng buộc.",
            },
        ],
        ensure_ascii=False,
    )

    q1_feedback = json.dumps(
        [
            {
                "id": "f0",
                "text": "Câu trả lời của bạn chỉ đề cập đến khái niệm HTTP cơ bản và các method, nhưng ",
                "type": "normal",
            },
            {
                "id": "f1",
                "text": "chưa giải thích rõ REST API là gì",
                "type": "warning",
                "popupTitle": "Đúng một phần",
                "popupDesc": "Bạn chỉ định nghĩa REST API dựa trên các method của HTTP, thiếu đi các yếu tố cốt lõi như tính chất kiến trúc REST, stateless, client-server.",
                "statusText": "Điểm này đúng một phần nhưng có thể cải thiện thêm.",
            },
            {"id": "f2", "text": ", các nguyên tắc như ", "type": "normal"},
            {
                "id": "f3",
                "text": "stateless, resource-based",
                "type": "danger",
                "popupTitle": "Chưa đúng / Thiếu sót",
                "popupDesc": "REST API hoạt động không trạng thái (stateless) và dựa trên tài nguyên (resource-based). Bạn chưa định nghĩa hoặc nhắc tới các khái niệm này.",
                "statusText": "Bổ sung ngay: Cần giải thích khái niệm stateless (mỗi request độc lập) và tài nguyên (URI đại diện cho resource).",
            },
            {
                "id": "f4",
                "text": ", và cách sử dụng từng method một cách cụ thể. Bạn cần bổ sung chi tiết hơn về mục đích của từng method (GET để đọc, POST để tạo, PUT/PATCH để cập nhật, DELETE để xóa) và đặc tính stateless của REST.",
                "type": "normal",
            },
        ],
        ensure_ascii=False,
    )

    questions = [
        SessionQuestion(
            session_id=1,
            question_order=1,
            tag="technical",
            question_text="REST API là gì? Giải thích các HTTP methods chính và khi nào nên dùng từng method.",
            user_answer="Http là một protocol trong computer networking để các máy tính có thể giao tiếp với nhau và trong đó Http có định nghĩa các method như GET POST PUT DELETE và một Rest API là một API tuân theo các method đó",
            score=35,
            analysis_chunks=q1_analysis,
            feedback_chunks=q1_feedback,
            strengths=json.dumps(
                [
                    "Bạn đã nhận biết được HTTP là giao thức mạng và các method cơ bản như GET, POST, PUT, DELETE.",
                    "Bạn có hiểu biết cơ bản về mối liên hệ giữa REST API và HTTP methods.",
                ],
                ensure_ascii=False,
            ),
            weaknesses=json.dumps(
                [
                    "Không giải thích REST API là kiến trúc dựa trên tài nguyên (resource-based) và stateless.",
                    "Không mô tả cụ thể khi nào nên dùng từng HTTP method (ví dụ: GET để đọc, POST để tạo, v.v.).",
                    "Thiếu ví dụ thực tế hoặc ngữ cảnh sử dụng để minh họa.",
                ],
                ensure_ascii=False,
            ),
            recommendations=json.dumps(
                [
                    "Hãy giải thích rõ REST API là gì (REpresentational State Transfer - một phong cách kiến trúc phần mềm) trước khi đi sâu vào HTTP methods.",
                    "💡 Nên phân biệt rõ ràng: GET (đọc), POST (tạo mới), PUT (thay thế toàn bộ), PATCH (cập nhật một phần), DELETE (xóa).",
                    "💡 Thực hành giải thích chi tiết cơ chế stateless: server không lưu trữ session của client, mỗi request phải chứa đầy đủ thông tin cần thiết.",
                ],
                ensure_ascii=False,
            ),
        ),
        SessionQuestion(
            session_id=1,
            question_order=2,
            tag="technical",
            question_text="Giải thích sự khác biệt giữa SQL và NoSQL database. Khi nào nên dùng loại nào?",
            user_answer="SQL dùng bảng có cấu trúc, NoSQL thì không cần schema cố định",
            score=55,
            analysis_chunks="[]",
            feedback_chunks="[]",
            strengths="[]",
            weaknesses="[]",
            recommendations="[]",
        ),
        SessionQuestion(
            session_id=1,
            question_order=3,
            tag="technical",
            question_text="ORM là gì? Nêu ưu và nhược điểm của việc sử dụng ORM.",
            user_answer="ORM là Object Relational Mapping, giúp map database thành object trong code",
            score=55,
            analysis_chunks="[]",
            feedback_chunks="[]",
            strengths="[]",
            weaknesses="[]",
            recommendations="[]",
        ),
        SessionQuestion(
            session_id=1,
            question_order=4,
            tag="technical",
            question_text="Phân biệt Authentication và Authorization. Cho ví dụ cụ thể.",
            user_answer="Authentication và Authorization đều là xác thực người dùng",
            score=35,
            analysis_chunks="[]",
            feedback_chunks="[]",
            strengths="[]",
            weaknesses="[]",
            recommendations="[]",
        ),
        SessionQuestion(
            session_id=1,
            question_order=5,
            tag="technical",
            question_text="Database indexing hoạt động như thế nào? Khi nào nên và không nên đánh index?",
            user_answer="Index giúp query nhanh hơn bằng cách tạo một bảng phụ",
            score=30,
            analysis_chunks="[]",
            feedback_chunks="[]",
            strengths="[]",
            weaknesses="[]",
            recommendations="[]",
        ),
        SessionQuestion(
            session_id=1,
            question_order=6,
            tag="technical",
            question_text="Giải thích cách xử lý lỗi (error handling) trong một REST API. Bạn sẽ thiết kế response lỗi như thế nào?",
            user_answer="Trả về mã lỗi HTTP phù hợp như 400, 404, 500",
            score=45,
            analysis_chunks="[]",
            feedback_chunks="[]",
            strengths="[]",
            weaknesses="[]",
            recommendations="[]",
        ),
        SessionQuestion(
            session_id=1,
            question_order=7,
            tag="technical",
            question_text="Giải thích khái niệm middleware trong web framework. Cho ví dụ use case thực tế.",
            user_answer="",
            score=0,
            analysis_chunks="[]",
            feedback_chunks="[]",
            strengths="[]",
            weaknesses="[]",
            recommendations="[]",
        ),
        # ========== SESSION 4 QUESTIONS (AI Engineer - 5 questions) ==========
        SessionQuestion(
            session_id=4,
            question_order=1,
            tag="technical",
            question_text="Bạn hãy giải thích kiến trúc của một hệ thống RAG (Retrieval-Augmented Generation) hoàn chỉnh trong Production. Làm thế nào để tối ưu hóa giai đoạn Chunking và Vector Retrieval để giảm thiểu hiện tượng Lost in the Middle và Hallucination?",
            user_answer="Kiến trúc RAG gồm Ingestion, Retrieval, và Generation. Ở bước Indexing, dữ liệu được chia chunk (semantic chunking hoặc recursive chunking với overlap 15%). Các chunk được embed bằng mô hình embedding chất lượng cao và lưu vào Vector DB như Pinecone. Khi query, ta dùng Hybrid Search kết hợp Dense Vector và Sparse BM25 kèm Reranker để lấy Top-K chính xác nhất, sau đó đưa vào Context của LLM với system prompt chặt chẽ để triệt tiêu Hallucination.",
            score=92,
            analysis_chunks=json.dumps([
                {"id": "ai1", "text": "Kiến trúc RAG gồm Ingestion, Retrieval, và Generation.", "type": "success", "popupTitle": "Rất chính xác", "popupDesc": "Nêu đúng 3 trụ cột của hệ thống RAG.", "statusText": "Nền tảng kiến thức vững chắc."},
                {"id": "ai2", "text": " ta dùng Hybrid Search kết hợp Dense Vector và Sparse BM25 kèm Reranker", "type": "success", "popupTitle": "Xuất sắc", "popupDesc": "Sử dụng Hybrid Search và Cross-encoder Reranker là best-practice hàng đầu trong production.", "statusText": "Điểm cộng chuyên môn cao!"}
            ], ensure_ascii=False),
            feedback_chunks=json.dumps([
                {"id": "af1", "text": "Câu trả lời rất đầy đủ và thực tế, bao quát từ chiến lược chunking, embedding, vector database cho đến Hybrid Search và Reranker.", "type": "normal"}
            ], ensure_ascii=False),
            strengths=json.dumps([
                "Hiểu rõ toàn bộ pipeline RAG từ Ingestion đến Generation",
                "Nắm vững kỹ thuật nâng cao: Semantic Chunking, Hybrid Search (Dense + Sparse), Cross-Encoder Reranking",
            ], ensure_ascii=False),
            weaknesses=json.dumps([
                "Có thể bổ sung thêm giải pháp Context Compression hoặc Parent-Document Retriever để tối ưu hơn nữa.",
            ], ensure_ascii=False),
            recommendations=json.dumps([
                "💡 Tìm hiểu thêm về Self-RAG và Corrective RAG (CRAG) để tự động kiểm tra tính liên quan của chunk trước khi generate.",
            ], ensure_ascii=False),
        ),
        SessionQuestion(
            session_id=4,
            question_order=2,
            tag="technical",
            question_text="Cơ chế Multi-Head Self-Attention trong kiến trúc Transformer hoạt động như thế nào? Vì sao độ phức tạp tính toán của nó là O(N^2) và các kỹ thuật như FlashAttention hay KV Cache giúp tối ưu inference ra sao?",
            user_answer="Self-Attention tính tương quan giữa các token thông qua ma trận Q, K, V theo công thức Softmax(Q*K^T / sqrt(d_k)) * V. Do nhân Q và K (kích thước N x d_k) tạo ra ma trận attention N x N nên độ phức tạp thời gian và bộ nhớ là O(N^2). KV Cache lưu lại K và V của các token trước đó trong giai đoạn autoregressive decoding để không phải tính lại. FlashAttention tối ưu I/O SRAM của GPU bằng tiling để không materialize ma trận N x N ra HBM.",
            score=90,
            analysis_chunks="[]",
            feedback_chunks="[]",
            strengths=json.dumps([
                "Giải thích chính xác công thức toán học Q, K, V và bản chất O(N^2)",
                "Nắm rõ cơ chế hoạt động của KV Cache và kỹ thuật FlashAttention ở mức độ phần cứng GPU",
            ], ensure_ascii=False),
            weaknesses=json.dumps([
                "Có thể nhắc thêm về Multi-Query Attention (MQA) và Grouped-Query Attention (GQA) dùng trong Llama 3 / Mistral.",
            ], ensure_ascii=False),
            recommendations=json.dumps([
                "💡 Khảo sát thêm cơ chế Sliding Window Attention và PagedAttention (vLLM).",
            ], ensure_ascii=False),
        ),
        SessionQuestion(
            session_id=4,
            question_order=3,
            tag="technical",
            question_text="Phân biệt Full Fine-Tuning và PEFT (LoRA, QLoRA). Cơ chế toán học của LoRA là gì và khi nào bạn quyết định Fine-Tune mô hình thay vì dùng RAG kết hợp Prompt Engineering?",
            user_answer="Full Fine-Tuning cập nhật toàn bộ tham số, tốn rất nhiều VRAM. LoRA cố định trọng số gốc W0 và biểu diễn lượng cập nhật delta W = B * A với rank r rất nhỏ (r << d), giảm hơn 90% tham số train. QLoRA lượng tử hóa W0 về 4-bit NF4 kèm Paged Optimizers. Sử dụng RAG khi cần cập nhật kiến thức liên tục từ tài liệu; sử dụng Fine-Tuning khi muốn mô hình học phong cách diễn đạt đặc thù, format JSON cố định hoặc domain ngữ pháp chuyên sâu.",
            score=88,
            analysis_chunks="[]",
            feedback_chunks="[]",
            strengths=json.dumps([
                "Phân biệt rạch ròi giữa LoRA và QLoRA",
                "Hiểu đúng trade-off giữa RAG (kiến thức động) và Fine-Tuning (phong cách / cú pháp)",
            ], ensure_ascii=False),
            weaknesses=json.dumps([
                "Nên lưu ý nguy cơ catastrophic forgetting khi fine-tune.",
            ], ensure_ascii=False),
            recommendations=json.dumps([
                "💡 Tìm hiểu thêm về DPO (Direct Preference Optimization) và RLHF sau bước SFT.",
            ], ensure_ascii=False),
        ),
        SessionQuestion(
            session_id=4,
            question_order=4,
            tag="technical",
            question_text="Giải thích cách xây dựng một hệ thống Multi-Agent tự hành (Agentic AI) sử dụng LangGraph hoặc Function Calling. Làm thế nào để quản lý State, xử lý ReAct loop và tránh rơi vào infinite loop khi gọi Tools?",
            user_answer="Hệ thống Multi-Agent trong LangGraph được xây dựng dưới dạng StateGraph. Mỗi Agent là một Node, các quyết định rẽ nhánh là Conditional Edges. State được quản lý tập trung và cập nhật qua reducer. Để kiểm soát vòng lặp ReAct, ta cấu hình max_iterations hoặc recursion_limit, xây dựng fallback node khi tool lỗi, và sử dụng Human-in-the-loop để duyệt các action quan trọng.",
            score=95,
            analysis_chunks="[]",
            feedback_chunks="[]",
            strengths=json.dumps([
                "Nắm vững kiến trúc StateGraph của LangGraph",
                "Đưa ra các giải pháp thực tế để chống infinite loop và cơ chế Human-in-the-loop",
            ], ensure_ascii=False),
            weaknesses=json.dumps([], ensure_ascii=False),
            recommendations=json.dumps([
                "💡 Thực hành thêm các mẫu kiến trúc Supervisor Agent và Hierarchical Multi-Agent Teams.",
            ], ensure_ascii=False),
        ),
        SessionQuestion(
            session_id=4,
            question_order=5,
            tag="technical",
            question_text="Làm thế nào để đánh giá (Evaluation) chất lượng của một hệ thống LLM/RAG trong môi trường Production? Bạn sử dụng các metrics nào (như RAG Triad: Faithfulness, Answer Relevance, Context Precision) và làm sao để phòng chống Prompt Injection?",
            user_answer="Đánh giá RAG sử dụng RAG Triad: Context Relevance (đo độ liên quan của chunk retrieved), Faithfulness (đo câu trả lời có bám sát context không để chống hallucination), và Answer Relevance. Sử dụng framework như Ragas hoặc DeepEval kết hợp LLM-as-a-Judge. Về bảo mật, dùng NeMo Guardrails, phân tách rõ delimiter, và kiểm duyệt input/output bằng classifier nhỏ để chống Prompt Injection.",
            score=87,
            analysis_chunks="[]",
            feedback_chunks="[]",
            strengths=json.dumps([
                "Hiểu rõ bộ 3 tiêu chí RAG Triad và các công cụ evaluation hiện đại",
                "Có nhận thức tốt về bảo mật AI và Guardrails",
            ], ensure_ascii=False),
            weaknesses=json.dumps([
                "Có thể chia sẻ thêm về chi phí và latency khi chạy LLM-as-a-judge trong CI/CD pipeline.",
            ], ensure_ascii=False),
            recommendations=json.dumps([
                "💡 Khảo sát thêm G-Eval và TruLens để tự động hóa benchmarking.",
            ], ensure_ascii=False),
        ),
    ]
    db.add_all(questions)
    db.commit()
    print(
        "[MockITV] ✅ Database seeded successfully with 6 jobs, 4 sessions, 12 questions."
    )


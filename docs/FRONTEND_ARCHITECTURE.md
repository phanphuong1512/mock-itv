# FRONTEND_ARCHITECTURE.md — MockITV Frontend

## 1. Tổng quan

Frontend MockITV là ứng dụng **Next.js 16** (App Router) kết hợp **React 19**, sử dụng **Tailwind CSS v4** cho styling, **Framer Motion** cho animations, và **TypeScript** cho type safety.

**Stack:**

| Công nghệ     | Phiên bản  | Mục đích                          |
| -------------- | -------- | -------------------------------- |
| Next.js        | 16.2.6   | App Router, Server-Side Rendering, API proxy       |
| React          | 19.2.4   | Thư viện giao diện, mô hình component      |
| TypeScript     | ^5       | Đảm bảo an toàn kiểu dữ liệu (Type safety)                     |
| Tailwind CSS   | ^4       | Framework CSS tiện ích (Utility-first)      |
| Framer Motion  | ^12.38.0 | Tạo hoạt ảnh (animations), chuyển trang (page transitions)     |
| next-themes    | ^0.4.6   | Chuyển đổi giao diện Tối/Sáng (Dark/Light mode)                  |
| lucide-react   | ^1.17.0  | Thư viện icon                  |

**Port:** 3000 (dev server)  
**Ngôn ngữ:** TypeScript (chế độ strict mode)

---

## 2. Cấu Trúc Tệp (File Structure)

```
frontend/
├── app/                           # App Router pages
│   ├── layout.tsx                 # Root layout (Font Lexend, ThemeProvider, LanguageProvider)
│   ├── globals.css                # Các biến CSS + Tailwind
│   ├── page.tsx                   # / — Landing page (phần giới thiệu, tính năng, CTA)
│   ├── favicon.ico
│   ├── mocks/
│   │   ├── page.tsx               # /mocks — Lưới danh sách thẻ công việc + bộ lọc
│   │   └── [id]/                  # /mocks/[id] — Chi tiết công việc + nút bắt đầu phỏng vấn
│   │       └── page.tsx
│   ├── interview/
│   │   └── [id]/                  # /interview/[id] — Phỏng vấn trực tiếp (văn bản/giọng nói)
│   │       └── page.tsx
│   ├── custom-mock/
│   │   └── page.tsx               # /custom-mock — Tải lên CV/JD → Phỏng vấn mock qua RAG
│   ├── history/
│   │   └── page.tsx               # /history — Xem kết quả, điểm số, highlight từng từ
│   ├── login/
│   │   └── page.tsx               # /login — Giao diện đăng nhập (chỉ có thiết kế UI, chưa có Auth)
│   └── pricing/
│       └── page.tsx               # /pricing — So sánh các gói (chỉ có thiết kế UI)
├── components/
│   ├── Navbar.tsx                 # Thanh điều hướng phía trên (cố định, responsive, hỗ trợ dark-mode)
│   ├── Footer.tsx                 # Chân trang với các liên kết và mạng xã hội
│   ├── ThemeProvider.tsx          # Wrapper cho next-themes (dựa trên class, mặc định tối)
│   └── LanguageProvider.tsx       # Cung cấp i18n theo Context (chuyển đổi VI/EN)
├── types/
│   └── api.ts                     # Các giao diện (interfaces) TypeScript cho API
├── package.json
├── next.config.ts                 # Cấu hình rewrite API proxy → localhost:8000
├── tsconfig.json
└── postcss.config.mjs             # PostCSS đi kèm @tailwindcss/postcss
```

---

## 3. Bố Cục Gốc (`app/layout.tsx`)

```typescript
import { Lexend } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "MockITV - Nền tảng mock phỏng vấn với AI",
  description: "Mock phỏng vấn với AI - luyện đều từng vòng để nâng kỹ năng phỏng vấn mỗi tuần.",
};

// Cấu trúc: html[lang="vi"] → body → ThemeProvider → LanguageProvider → {children}
// Giao diện mặc định: dark
// Font chữ: Lexend (Google Fonts, hỗ trợ Latin + Tiếng Việt)
// Cấu trúc Body: min-h-full, flex column, antialiased
```

---

## 4. Định Tuyến Trang (Page Routing)

| Đường dẫn              | Tệp                          | Mô tả                              |
| ------------------ | ----------------------------- | ---------------------------------------- |
| `/`                | `app/page.tsx`                | Landing page — Khu vực hero, danh sách tính năng, các nút gọi hành động (CTA) |
| `/mocks`           | `app/mocks/page.tsx`          | Danh sách công việc — lọc theo 14 chuyên mục + 9 cấp độ, dạng lưới thẻ |
| `/mocks/[id]`      | `app/mocks/[id]/page.tsx`     | Chi tiết công việc — tech stack, số vòng phỏng vấn, nút bắt đầu phỏng vấn |
| `/interview/[id]`  | `app/interview/[id]/page.tsx` | Phỏng vấn trực tiếp — trả lời văn bản + giọng nói (STT/TTS) |
| `/custom-mock`     | `app/custom-mock/page.tsx`    | Tùy chỉnh (Custom mock) — tải lên CV/JD → Pinecone RAG → Phỏng vấn |
| `/history`         | `app/history/page.tsx`        | Lịch sử các phiên — điểm số, highlight từng câu chữ, nhận xét phản hồi |
| `/login`           | `app/login/page.tsx`          | Trang đăng nhập — Chỉ là giao diện (chưa có xác thực) |
| `/pricing`         | `app/pricing/page.tsx`        | Các gói giá cả — Giao diện so sánh gói (không có thanh toán thực) |

---

## 5. Giao Tiếp API

### 5.1. Cấu hình Proxy

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
    ];
  },
};
```

Tất cả các API calls từ Frontend đều dùng đường dẫn tương đối (`/api/...`), Next.js sẽ tự động rewrite chúng về Backend FastAPI đang chạy ở port 8000.

### 5.2. Mẫu Gọi API (API Call Pattern)

```typescript
// Ví dụ: Lấy danh sách công việc
const res = await fetch("/api/jobs");
const jobs: JobResponse[] = await res.json();

// Ví dụ: Tạo phiên phỏng vấn
const res = await fetch("/api/sessions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ job_id: jobId, questions_count: 7 }),
});
const session: MockSessionResponse = await res.json();

// Ví dụ: Tạo phiên tùy chỉnh (Custom Mock, sử dụng multipart)
const formData = new FormData();
formData.append("file", selectedFile);
formData.append("type", "cv");
formData.append("questions_count", "7");
const res = await fetch("/api/sessions/custom-mock", {
  method: "POST",
  body: formData,
});
```

---

## 6. Các Giao Diện TypeScript (`types/api.ts`)

```typescript
export interface HighlightChunk {
  id?: string;
  text: string;
  type: 'normal' | 'success' | 'warning' | 'danger';
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
  techStack: string[];
  rounds: number;
  logo: string;
}
```

---

## 7. Hệ Thống Giao Diện Tối/Sáng (Theme System)

### Thiết lập Provider

```typescript
// components/ThemeProvider.tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// Cách sử dụng tại layout.tsx:
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
  {children}
</ThemeProvider>
```

### Cách hoạt động

- `attribute="class"` → Sẽ thêm class `dark` hoặc `light` vào thẻ `<html>`
- `defaultTheme="dark"` → Mặc định giao diện sẽ là màu tối (dark mode)
- `enableSystem={false}` → KHÔNG phụ thuộc vào cài đặt màu của hệ điều hành
- Các class của Tailwind CSS (như `dark:`) sẽ tự động có tác dụng khi bật chế độ này

---

## 8. Hệ Thống Ngôn Ngữ (i18n)

### Kiến trúc Provider

```typescript
// components/LanguageProvider.tsx
"use client";
const LanguageContext = createContext<{
  lang: "vi" | "en";
  t: (vi: string, en: string) => string;
  setLang: (lang: "vi" | "en") => void;
}>();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState<"vi" | "en">("vi");
  const t = (vi: string, en: string) => lang === "vi" ? vi : en;
  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Cách gọi ở trong các components:
const { t } = useLanguage();
<h1>{t("Trang chủ", "Home")}</h1>
```

---

## 9. Các Thành Phần Dùng Chung (Shared Components)

### 9.1. Navbar (`components/Navbar.tsx`)

- Luôn cố định (fixed) ở trên cùng, có hiệu ứng kính mờ (glassmorphism)
- Chứa logo + các đường dẫn điều hướng
- Nút bật tắt chế độ Tối/Sáng (Dark/Light mode)
- Nút thay đổi ngôn ngữ (VI/EN)
- Menu hamburger tương thích cho thiết bị di động (Responsive)

### 9.2. Footer (`components/Footer.tsx`)

- Các liên kết chân trang được chia theo cột gọn gàng
- Các icon mạng xã hội
- Dòng chữ ghi nhận bản quyền (Copyright)

---

## 10. Các Trang Chính

### 10.1. Landing Page (`/`)

- **Khu vực Hero:** Nền gradient có hoạt ảnh động, nút kêu gọi hành động (CTA)
- **Lưới Tính Năng:** 6 ô hiển thị tính năng kèm icon
- **Cách Hoạt Động:** 3 bước hướng dẫn trực quan hóa quy trình
- **Khu vực CTA:** Nút để bắt đầu phỏng vấn ngay lập tức
- **Hoạt Ảnh:** Sử dụng các hiệu ứng hiện dần (staggered reveals) và parallax từ Framer Motion

### 10.2. Trang Mocks (`/mocks`)

- **Thanh Bộ Lọc:** Gồm các nút danh mục (14 lựa chọn), Menu dạng thả thả cho cấp độ (9 lựa chọn)
- **Lưới Job Cards:** Hiển thị tự co giãn (1/2/3 cột), có hiệu ứng phóng to nhẹ khi di chuột (hover)
- **Nội Dung Thẻ:** Avatar công ty, tiêu đề, cấp độ, danh sách thẻ tech stack, tổng số vòng phỏng vấn
- **API:** `GET /api/jobs?category=&level=`

### 10.3. Trang Phỏng Vấn (`/interview/[id]`)

- **Hiển Thị Câu Hỏi:** Hiển thị mỗi lần 1 câu, thanh tiến trình cho biết đang ở câu mấy
- **Khung Trả Lời:** Vùng nhập văn bản (textarea) có đếm số ký tự
- **Đồng Hồ:** Tính thời gian (đếm xuôi/đếm ngược)
- **Chế Độ Giọng Nói:** Nút Micro, nhận diện văn bản (transcript) thời gian thực, có tự động phát lại âm thanh AI
- **Điều Hướng:** Nút Tiếp tục/Trở lại, nút Nộp bài cuối cùng
- **API:** `POST /api/sessions`, `POST /api/sessions/:id/answer`, `POST /api/sessions/:id/evaluate`

### 10.4. Trang Tùy Chỉnh (`/custom-mock`)

- **Vùng Tải Lên:** Kéo thả hoặc chọn tệp (hỗ trợ PDF/DOCX, dung lượng tối đa 5MB)
- **Chọn Loại:** Tùy chọn nút radio giữa CV hoặc Mô tả công việc (Job Description)
- **Số Câu Hỏi:** Có thể điều chỉnh (mặc định là 7 câu)
- **Tiến Trình:** Upload → Trích xuất → Lập chỉ mục (Index) → Sinh câu hỏi → Bắt đầu Phỏng vấn
- **API:** `POST /api/sessions/custom-mock` (sử dụng multipart/form-data)

### 10.5. Trang Lịch Sử (`/history`)

- **Danh Sách Phiên:** Các thẻ phiên được sắp xếp theo thời gian (mới nhất ở trên)
- **Chi Tiết Phiên (Khi Mở Rộng):**
  - 4 biểu đồ hình tròn SVG RadialProgress (Tổng quan, Kỹ thuật, Giao tiếp, Giải quyết vấn đề)
  - Chế độ xem từng câu hỏi cùng tab chuyển đổi
  - Kết xuất hiệu ứng highlight từng cụm từ (dựa trên mảng `analysis_chunks`)
  - Tooltips bật ra khi click vào một khối highlight (hiển thị `popupTitle`, `popupDesc`, `statusText`)
  - Chỗ hiển thị nhận xét `feedback chunks`
  - Danh sách Điểm Mạnh/Điểm Yếu/Khuyến Nghị
  - Danh sách Các chủ đề cần học + Tài nguyên (Links)
- **API:** `GET /api/sessions`, `GET /api/sessions/:id`

---

## 11. Hệ Thống Hiệu Ứng (Animation System)

### Pattern: Container Trang Có Hiệu Ứng

```typescript
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {/* Page content */}
</motion.div>
```

### Pattern: Danh Sách Bậc Thang

```typescript
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.div variants={container} initial="hidden" animate="show">
  {jobs.map(job => (
    <motion.div key={job.id} variants={item}>
      <JobCard job={job} />
    </motion.div>
  ))}
</motion.div>
```

### Pattern: Thẻ Card Khi Di Chuột

```typescript
<motion.div
  whileHover={{ scale: 1.02, y: -4 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
>
  <Card />
</motion.div>
```

---

## 12. Kiến Trúc Styling

### 12.1. Tailwind CSS v4

- PostCSS plugin: `@tailwindcss/postcss`
- Không cần tệp `tailwind.config.ts` nữa (Tailwind v4 đã dùng các biến cấu hình CSS nguyên bản)
- Chế độ tối: dùng chiến lược `class` (được điều khiển bằng thư viện next-themes)

### 12.2. CSS Custom Properties (`globals.css`)

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... more custom properties */
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

### 12.3. Font System

- **Font chính:** Lexend (Lấy từ Google Fonts)
- **Tập con (Subsets):** Latin + Vietnamese
- **Biến CSS:** `--font-lexend`
- **Cách nhúng:** Áp dụng `className={lexend.variable}` vào thẻ gốc `<html>`

---

## 13. Phỏng Vấn Qua Giọng Nói (Frontend)

### WebSocket STT Flow

```typescript
// 1. Mở cổng kết nối WebSocket
const ws = new WebSocket("ws://localhost:8000/api/voice/ws-stt");

// 2. Khởi tạo AudioContext + ScriptProcessor
const audioContext = new AudioContext({ sampleRate: 48000 });
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const source = audioContext.createMediaStreamSource(stream);
const processor = audioContext.createScriptProcessor(4096, 1, 1);

// 3. Gửi đi các phân đoạn luồng (PCM chunks)
processor.onaudioprocess = (e) => {
  const pcm = e.inputBuffer.getChannelData(0);
  const header = new Uint32Array([audioContext.sampleRate]);
  const data = new Uint8Array(header.buffer.byteLength + pcm.buffer.byteLength);
  data.set(new Uint8Array(header.buffer), 0);
  data.set(new Uint8Array(pcm.buffer), 4);
  ws.send(data.buffer);
};

// 4. Nhận kết quả partial theo thời gian thực
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.partial) setTranscript(msg.partial);    // Cập nhật lên UI theo thời gian thực
  if (msg.final) setFinalText(msg.final);         // Khi user đã dừng nói
};

// 5. Báo hiệu ngắt luồng
ws.send("END");
```

### SSE Streaming AI Response

```typescript
// Dùng phương thức POST với kiến trúc EventSource
const res = await fetch(`/api/voice/sessions/${id}/message-stream`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: text, history }),
});

const reader = res.body.getReader();
// Đọc luồng SSE events: {type: "sentence", text: "..."} hoặc {type: "done", full_text: "..."}
```

### Chạy Âm Thanh TTS (TTS Audio Playback)

```typescript
const res = await fetch("/api/voice/tts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: aiResponse }),
});
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const audio = new Audio(url);
audio.play();
```

---

## 14. Quản Lý Trạng Thái (State Management)

- **Không sử dụng thư viện quản lý State bên ngoài** (không có Redux, không có Zustand)
- Dùng `React.useState()` cho các State tại biến phạm vi nội bộ Component
- Dùng `React.useContext()` cho cài đặt theme và ngôn ngữ (biến cấp toàn cục)
- Dùng hàm `fetch()` + `useEffect()` để lấy dữ liệu từ các hàm API
- Tất cả các trạng thái đều được xử lý và bọc kĩ bên trong các thành phần React độc lập

---

## 15. Quá Trình Phát Triển

```bash
cd frontend
npm install
npm run dev          # → Sẽ chạy Frontend lên cổng http://localhost:3000
```

**Yêu cầu hệ thống:**

- Node.js bản 18+
- Backend bắt buộc phải đang được bật (localhost:8000) để cơ chế API proxy có thể định tuyến.

---

## 16. Các Quyết Định Thiết Kế

1. **Phông chữ Lexend** — Thiết kế tối giản, dễ đọc, phù hợp tiếng Việt.
2. **Mặc định là Dark mode** — Mang lại phong cách hiện đại và làm dịu mắt các lập trình viên.
3. **Không cần Xác thực đăng nhập (No auth)** — Phù hợp với khuôn khổ workshop, đơn giản hóa luồng người dùng để ai cũng có thể test nhanh.
4. **Không cần thư viện quản lý trạng thái ngoài** — useState + useContext là đã hoàn toàn đáp ứng được quy mô dự án này.
5. **Cấu trúc Rewrite bằng Proxy** — Giúp tránh gặp phải lỗi bảo mật CORS rắc rối, làm sạch code API phía frontend.
6. **Thư viện Framer Motion** — Tạo hiệu ứng mềm mại, khai báo dễ hiểu (declarative) mà không cần code CSS phức tạp.
7. **lucide-react** — Hệ thống icon tinh gọn, hỗ trợ tree-shakeable giảm dung lượng build.
8. **Tailwind v4** — Bản nâng cấp mới nhất, thiết lập cấu hình nguyên bản qua CSS, không cần sinh ra file tailwind.config làm chật thư mục.
9. **Client components** — Phần lớn các trang yêu cầu `"use client"` để xử lý các tính năng tương tác với trạng thái.
10. **Tập trung tính năng theo 1 Tệp duy nhất** — Code bao trọn logic vào thẳng trong Page giúp quản lý dễ hơn là cắt nhỏ vô tội vạ.

# English Learning System (ELS)

> Personalized English Learning Platform — Learn by Topic, Follow Your Path, Improve Every Day

Hệ thống học tiếng Anh trực tuyến, xây dựng theo mô hình **lộ trình học cá nhân hóa dựa trên chủ đề (Topic-based Learning Path)** kết hợp **kiểm tra đầu vào (Placement Test)** và **phân loại trình độ (Skill Tier)**. Lấy cảm hứng từ các nền tảng học ngôn ngữ phổ biến nhưng được tùy chỉnh và tối ưu hóa quy mô phù hợp với đồ án.

---

## 1. Trạng thái triển khai (Implementation Status)

| Module | Trạng thái | Ghi chú |
|---|---|---|
| Authentication & RBAC | ✅ Hoàn thành | JWT + cookie httpOnly, session lưu Redis (hỗ trợ multi-device), phân quyền Role-based (RBAC). |
| Onboarding & Placement Test | ✅ Hoàn thành | Thu thập mục tiêu học tập (learning purpose), thi đầu vào phân loại trình độ (BEGINNER, INTERMEDIATE, ADVANCED). |
| Tra cứu từ điển (Dictionary) | ✅ Hoàn thành | Exact match nội bộ + Dịch tự động bằng thư viện `google-translate-api-x` làm fallback. |
| Flashcard | ✅ Hoàn thành | Trạng thái NEW/LEARNING/MASTERED, thuật toán ôn tập ngẫu nhiên. |
| Topic Lesson (Bài luyện tập) | ✅ Hoàn thành | Kết hợp Quiz (trắc nghiệm) và Pronunciation (Web Speech API) trực tiếp trong bài học. |
| Luyện đề trắc nghiệm (Exam) | ✅ Hoàn thành | Sinh câu hỏi qua LLM (Groq/xAI), chống gian lận bằng server timestamp, phân trang. |
| **Learning Path (Lộ trình)** | ✅ Hoàn thành | Lộ trình động sinh ra dựa trên trình độ đầu vào (`tier`), mục tiêu (`learning_purpose`) và được khóa/mở khóa theo tỷ lệ hoàn thành (Mastery). |
| Streak | ✅ Hoàn thành | Tính theo timezone client, hiển thị lịch 7 ngày liên tục. |
| Grammar / Listening / Reading | ⏸️ Hoãn lại | Chưa có thiết kế schema riêng, nằm ngoài phạm vi cốt lõi hiện tại. |
| Admin Dashboard / CMS | ⏸️ Hoãn lại | Quản trị nội dung hiện làm qua các script AI tự động (`gen_exam.js`, vv). |

---

## 2. Learning Path — Lộ trình học cá nhân hóa

### 2.1. Cấu trúc Lộ trình (Dynamic Learning Path)

Thay vì một lộ trình cứng ngắc và giống hệt nhau cho mọi user, hệ thống tự động sinh lộ trình (Learning Path) cho từng cá nhân dựa vào:
- **Kết quả Placement Test (Tier):** Người dùng có trình độ cao (VD: `ADVANCED`) sẽ không phải học lại các Topic cơ bản. Hệ thống tự động lọc bỏ các Topic thấp hơn trình độ hiện tại.
- **Mục tiêu học tập (Learning Purpose):** Các Topic phù hợp với mục tiêu (ví dụ: giao tiếp, du lịch, công việc) sẽ được ưu tiên đưa lên trước.
- **Thứ tự mặc định (Order Index):** Các Topic còn lại được sắp xếp theo độ khó và thứ tự chuẩn.

### 2.2. Công thức Mastery — Đánh giá năng lực toàn diện

Mỗi Topic (Unit) có **mastery riêng biệt, độc lập**. Điểm Mastery (tối đa 100%) được tính như sau:

```text
vocabPercent = (số flashcard MASTERED / tổng số từ trong topic) × 100
examPercent = (điểm thi cao nhất user từng đạt trong topic / 10) × 100 
lessonPercent = điểm bài học topic cao nhất (quy mô 0-100)

masteryPercent = round(vocabPercent × 0.5 + examPercent × 0.25 + lessonPercent × 0.25)
```

| Thành phần | Trọng số | Lý do |
|---|---|---|
| Từ vựng (Flashcard) | 50% | Hoạt động cốt lõi, yêu cầu ôn luyện thường xuyên. |
| Luyện đề (Exam) | 25% | Đánh giá khả năng tổng hợp và vận dụng kiến thức (ngữ pháp, đọc hiểu). |
| Bài luyện tập (Lesson) | 25% | Kết hợp luyện phát âm (Pronunciation) và ôn tập nhanh (Quiz). |

### 2.3. Logic Mở khóa (Unlock Logic)

- Người dùng luôn được phép học Topic đầu tiên trong lộ trình (hoặc các Topic đã học).
- Để mở khóa Topic tiếp theo `[i]`, người dùng phải đạt `masteryPercent >= 60%` ở Topic trước đó `[i-1]`.
- Trạng thái mở khóa được tính toán động hoàn toàn ở tầng service (`learning-path.service.js`), không lưu cứng trong database để tránh sai lệch dữ liệu (stale data).

---

## 3. Kiến trúc & Công nghệ

| Layer | Công nghệ |
|---|---|
| Web (Frontend) | React 19 + Vite + Tailwind CSS v4 + Redux Toolkit |
| Backend | Node.js + Express 5 |
| Database | PostgreSQL |
| Cache | Redis (Session & Data Caching) |
| Authentication | JWT (multi-session qua `session:{userId}:{sessionId}`) + Cookie httpOnly |
| Sinh câu hỏi AI | Groq API / xAI (`grok-4-fast`, `openai/gpt-oss-120b`, etc.) |
| Dịch thuật (Dictionary) | `google-translate-api-x` |
| Phát âm (Pronunciation) | Web Speech API (`SpeechRecognition` + `SpeechSynthesisUtterance`, client-side) |
| Web HTTP Client | Axios |
| Android (Phase 2) | Java + Retrofit 2 + Room |

**Nguyên tắc thiết kế:** Backend đóng vai trò là API RESTful phục vụ chung cho cả Web (hiện tại) và Android (tương lai), tập trung hoàn toàn Business Logic. Frontend thuần túy xử lý hiển thị và tương tác người dùng.

---

## 4. Cơ sở dữ liệu (Database Schema)

Cấu trúc các bảng cốt lõi (Core Tables):
```text
roles, permissions, role_permissions      ← Quản lý phân quyền (RBAC)
users (tier, learning_purpose, etc.)      ← Thông tin người dùng
words, idioms                             ← Kho từ vựng
topics                                    ← Đóng vai trò "Unit" (Chủ đề học)
topic_progress                            ← Tiến độ học chủ đề của user
flashcards                                ← Tiến độ học từ vựng chi tiết
streak_logs                               ← Theo dõi chuỗi ngày học liên tục
exams, questions, exam_sessions           ← Đề thi và phiên thi
exam_answers, exam_results                ← Kết quả thi chi tiết
lesson_results                            ← Kết quả bài học (Lesson + Pronunciation)
```

---

## 5. API Endpoints Chính

```http
# Authentication & Onboarding
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/onboarding/complete         # Cập nhật mục tiêu học tập
GET  /api/v1/roles                       # Lấy danh sách Roles (Admin)

# Dictionary & Words
GET  /api/v1/words/search?q=...

# Learning Path & Topics
GET  /api/v1/learning-path               # Lấy lộ trình cá nhân hóa (đã filter + sort)
GET  /api/v1/topics

# Flashcards
GET  /api/v1/flashcards
GET  /api/v1/flashcards/daily
PUT  /api/v1/flashcards/:id

# Topic Lessons (Quiz + Pronunciation)
GET  /api/v1/lessons/:topicId
POST /api/v1/lessons/:topicId/complete

# Exams (Placement & Topic Exams)
GET  /api/v1/exams/placement-exam        # Lấy đề test đầu vào
GET  /api/v1/exams?topic_id=&page=
GET  /api/v1/exams/:id
POST /api/v1/exams/:id/start
GET  /api/v1/exams/:id/questions
POST /api/v1/exams/:id/submit

# Streak
GET  /api/v1/streaks/status
GET  /api/v1/streaks/week
POST /api/v1/streaks/record
```

---

## 6. Tính năng Nổi bật

### 6.1. Placement Test bằng AI
- Hệ thống hỗ trợ script sinh đề Placement Test tự động thông qua AI (Groq/xAI).
- Đề thi bao phủ dải độ khó từ sơ cấp đến cao cấp. Kết quả bài test tự động phân loại User vào các mức `BEGINNER`, `INTERMEDIATE`, `ADVANCED` nhằm lọc bỏ và tối ưu hóa số lượng bài học dư thừa.

### 6.2. Phát âm (Pronunciation) Miễn phí
- Tận dụng sức mạnh **Web Speech API** của trình duyệt Chrome/Edge:
  - `SpeechSynthesisUtterance`: Đọc từ vựng làm mẫu.
  - `webkitSpeechRecognition`: Ghi âm giọng nói người dùng và chuyển thành văn bản để đối chiếu.
- Ưu điểm: Hoàn toàn miễn phí, chạy phía Client, không độ trễ, không tốn API call. Yêu cầu HTTPS/localhost.

---

## 7. Cấu trúc Thư mục Dự án

```text
english-learning-system/
├── backend/                  # RESTful API (Node.js/Express)
│   ├── src/
│   │   ├── controllers/      # Logic điều hướng HTTP requests
│   │   ├── services/         # Business logic cốt lõi
│   │   ├── repositories/     # Tương tác Database
│   │   ├── routes/           # Định nghĩa Endpoints
│   │   ├── middlewares/      # Verify JWT, Authorization, Error Handling
│   │   └── scripts/          # Script AI tự động (gen_exam.js, vv)
│   └── package.json
│
├── frontend-web/             # Giao diện người dùng (React/Vite)
│   ├── src/
│   │   ├── pages/            # Các trang chính (LearningPathPage, PlacementTestPage...)
│   │   ├── components/       # Các UI Component dùng chung
│   │   ├── layouts/          # Layout bọc ngoài (Sidebar, Header)
│   │   ├── store/            # Redux store
│   │   └── utils/            # Helper functions
│   └── package.json
│
└── mobile-android/           # (Phase 2) Ứng dụng di động
```

---

## 8. Tóm tắt Định hướng

Dự án hiện tại đã **hoàn thiện các tính năng cốt lõi** cho một ứng dụng học tập cá nhân hóa. Bằng việc kết hợp **Thi đầu vào (Placement)**, **Thu thập mục tiêu (Onboarding)** và **Đánh giá năng lực tổng hợp (Mastery = Vocab + Exam + Lesson)**, hệ thống cung cấp một trải nghiệm học tập động và sát với thực tế của từng cá nhân. Các tính năng đòi hỏi chi phí vận hành cao hoặc quy mô lớn được tối ưu hóa để phù hợp với giới hạn của một dự án sinh viên.

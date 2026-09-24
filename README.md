# English Learning System

> Personalized English Learning Platform — Learn by Topic, Follow Your Path, Improve Every Day

Hệ thống học tiếng Anh trực tuyến, xây dựng theo mô hình **lộ trình học cá nhân hóa dựa trên chủ đề (Topic-based Learning Path)**, lấy cảm hứng từ Duolingo nhưng được **thu gọn quy mô phù hợp với đồ án sinh viên**.

**Tiến độ hiện tại: Sprint 3** — đang tái cấu trúc core để hình thành Learning Path, thay vì các chức năng rời rạc.

---

## 1. Trạng thái triển khai (Implementation Status)

| Module | Trạng thái | Ghi chú |
|---|---|---|
| Authentication (đăng ký/đăng nhập/logout) | ✅ Hoàn thành | JWT + cookie httpOnly, session lưu Redis theo `userId:sessionId` (hỗ trợ multi-device) |
| Tra cứu từ điển (Dictionary) | ✅ Hoàn thành | Exact match nội bộ + fallback Merriam-Webster API, cache Redis |
| Flashcard | ✅ Hoàn thành | Trạng thái NEW/LEARNING/MASTERED, bộ ôn tập ngẫu nhiên theo topic |
| Streak | ✅ Hoàn thành | Tính theo timezone client, hiển thị lịch 7 ngày |
| Luyện đề trắc nghiệm (Exam) | ✅ Hoàn thành | Sinh câu hỏi qua Groq AI dựa trên từ vựng thật trong DB, chống gian lận bằng server timestamp, phân trang câu hỏi |
| **Learning Path (rút gọn)** | 🔄 Đang làm (Sprint 3) | Dùng lại `topics` làm đơn vị "Unit", không có bảng riêng `learning_paths/units/lessons` |
| Phát âm (Pronunciation) | 📋 Kế hoạch | Dùng Web Speech API có sẵn trình duyệt (miễn phí), chưa triển khai |
| Placement Test / Skill Profile | ⏸️ Hoãn lại | Ngoài phạm vi quy mô hiện tại, cân nhắc ở phase sau nếu còn thời gian |
| Grammar / Listening / Reading module riêng | ⏸️ Hoãn lại | Chưa có schema/thiết kế, để "Later" |
| Admin Dashboard / CMS | ⏸️ Hoãn lại | Quản trị nội dung hiện làm qua script (`generate-exam-questions.js`, `classify_topics.py`) |

---

## 2. Learning Path — thiết kế đã cắt giảm

### 2.1. Không dùng cấu trúc Path → Unit → Lesson → Exercise

Thay vào đó, tận dụng bảng `topics` có sẵn làm đơn vị "Unit" duy nhất:

```
Learning Path (khái niệm hiển thị, không có bảng riêng)
  └── Topic  (đóng vai trò "Unit")
        ├── words        (từ vựng thuộc chủ đề)
        ├── flashcards   (tiến độ học từ của từng user)
        └── exams        (đề kiểm tra thuộc chủ đề)
```

Mỗi user chỉ có đúng **1 lộ trình duy nhất** (không có nhiều path song song) → không cần bảng lưu "path instance", chỉ cần sắp thứ tự các `topics` theo `order_index`.

### 2.2. Migration

```sql
ALTER TABLE topics ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics (order_index);
```

### 2.3. Công thức Mastery — kết hợp Flashcard + Luyện đề

Mỗi Topic (Unit) có **mastery riêng biệt, độc lập với các Topic khác**:

```
vocabPercent = (số flashcard MASTERED / tổng số từ trong topic) × 100
examPercent  = (điểm thi cao nhất user từng đạt trong topic / 10) × 100   [0% nếu chưa từng thi]

masteryPercent = round(vocabPercent × 0.7 + examPercent × 0.3)
```

| Thành phần | Trọng số | Lý do |
|---|---|---|
| Từ vựng (flashcard) | 70% | Hoạt động chính, tần suất học hằng ngày |
| Luyện đề (exam) | 30% | Kiểm tra định kỳ, tần suất thấp hơn nhưng phản ánh khả năng vận dụng |

### 2.4. Mở khóa Topic tiếp theo

```
Topic[0] luôn mở khóa.
Topic[i] mở khóa khi Topic[i-1].masteryPercent >= 60%.
```

Tính hoàn toàn ở tầng service (`learning-path.service.js`), không lưu trạng thái "unlocked" vào DB — luôn tính động từ dữ liệu thật, tránh lệch pha (stale data).

---

## 3. Kiến trúc & Công nghệ

| Layer | Công nghệ |
|---|---|
| Web | React + Tailwind CSS + Redux Toolkit |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Cache | Redis |
| Authentication | JWT (multi-session qua `session:{userId}:{sessionId}`) |
| Sinh câu hỏi luyện đề | Groq AI (free tier, model `openai/gpt-oss-120b`) |
| Từ điển ngoài | Merriam-Webster API (Collegiate + Learner's Dictionary) |
| Phát âm | Web Speech API (`SpeechRecognition` + `SpeechSynthesisUtterance`, miễn phí, client-side) |
| Web HTTP Client | Axios |
| Android (Phase 2) | Java + Retrofit 2 + Room |

**Nguyên tắc:** Backend là trung tâm xử lý business logic; Web (và Android ở Phase 2) chỉ gọi chung 1 REST API.

---

## 4. Database — Schema thật đang dùng

```
roles, permissions, role_permissions
users
words, dictionary_vi (*), idioms
topics                    ← đóng vai trò "Unit" trong Learning Path
flashcards
streak_logs
exams, questions, exam_sessions, exam_answers, exam_results
```

> (*) `dictionary_vi`: bảng import 386K từ StarDict, hiện **chưa được dùng** bởi tính năng tra từ (đang dùng bảng `words`). Cần quyết định giữ lại dùng sau hay gộp/loại bỏ.

---

## 5. API đã triển khai

```http
# Authentication
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me

# Dictionary
GET  /api/v1/words/search?q=...

# Topics / Learning Path
GET  /api/v1/topics
GET  /api/v1/topics/progress        (kế hoạch Sprint 3)

# Flashcards
GET  /api/v1/flashcards
GET  /api/v1/flashcards/daily
PUT  /api/v1/flashcards/:id
DELETE /api/v1/flashcards/:id

# Streak
GET  /api/v1/streaks/status
GET  /api/v1/streaks/week
POST /api/v1/streaks/record

# Exams
GET  /api/v1/exams?topic_id=&page=&pageSize=
GET  /api/v1/exams/:id
GET  /api/v1/exams/history
POST /api/v1/exams/:id/start
GET  /api/v1/exams/:id/questions?session_id=&page=
POST /api/v1/exams/:id/submit
POST /api/v1/exams/:id/cancel
```

> Không có `/auth/refresh` — access token hết hạn theo TTL cố định (`JWT_ACCESS_EXPIRES_IN`), yêu cầu đăng nhập lại. Cân nhắc bổ sung refresh token flow ở phase sau nếu cần trải nghiệm mượt hơn.

---

## 6. Phát âm — Web Speech API (miễn phí)

Không dùng dịch vụ trả phí (Azure Speech...) ở giai đoạn này. Thay vào đó:

- **`SpeechSynthesisUtterance`** — đọc mẫu từ vựng bằng giọng máy có sẵn trình duyệt.
- **`SpeechRecognition` (`webkitSpeechRecognition`)** — ghi âm người dùng, chuyển thành text, so khớp với từ mẫu.

**Giới hạn đã biết:**
- Chỉ hoạt động ổn định trên Chrome/Edge.
- Chỉ so khớp văn bản (đúng/sai toàn từ), không chấm điểm theo từng âm vị (phoneme) như Azure.
- Yêu cầu HTTPS hoặc `localhost` để trình duyệt cấp quyền micro.

Nếu cần chấm điểm chi tiết hơn ở phase sau, có thể nâng cấp lên **Azure AI Speech (gói Free F0 — 5 giờ audio/tháng)**, đã hỗ trợ sẵn Pronunciation Assessment cơ bản (Accuracy/Fluency/Completeness).

---

## 7. Roadmap đã cắt giảm

### Đang làm (Sprint 3)
```
Learning Path rút gọn (topics làm Unit)
Mastery kết hợp (flashcard + exam)
Unlock logic theo threshold
```

### Kế tiếp
```
UI hiển thị đường dẫn học (dạng chuỗi Unit nối tiếp)
Pronunciation Practice (Web Speech API)
```

### Hoãn lại (ngoài phạm vi hiện tại)
```
Placement Test
Skill Profile đa chiều (5 kỹ năng riêng biệt)
Learning Path Generator tự động theo mục tiêu
Adaptive Learning Engine
Grammar / Listening / Reading module riêng
Admin Dashboard / CMS
Android App (Phase 2)
```

---

## 8. Cấu trúc Project

```
english-learning-system/
├── backend/
│   └── src/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── models/
│       ├── routes/
│       ├── middlewares/
│       ├── scripts/          # import-dictionary.js, classify_topics.py, generate-exam-questions.js
│       └── config/
│
├── frontend-web/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── store/
│       └── utils/
│
└── README.md
```

---

## 9. Tóm tắt

Trọng tâm hiện tại: **Topic-based Learning Path**, kết hợp dữ liệu Flashcard + Exam đã có sẵn để tính mastery và điều hướng lộ trình học, thay vì xây dựng lại toàn bộ hệ thống Skill/Placement/Adaptive phức tạp. Các phần nâng cao được lùi lại phase sau, phù hợp với timeline và quy mô một đồ án sinh viên.

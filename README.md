# 🦉 anhlingo — Hệ Thống Học Tiếng Anh Đa Nền Tảng Cá Nhân Hóa
*(English Learning System — ELS)*

> **Learn by Topic, Follow Your Path, Improve Every Day.**  
> Nền tảng học tiếng Anh trực tuyến xây dựng theo mô hình **Lộ trình cá nhân hóa (Topic-based Learning Path)** kết hợp **Kiểm tra đầu vào (Placement Test)**, **Phân loại trình độ (Skill Tier)** và cơ chế **Gamification chuẩn Duolingo**.

---

## 📸 Điểm Nổi Bật Về Giao Diện & Trải Nghiệm (Aesthetics & UX)

- **Thương hiệu `anhlingo`:** Phong cách thiết kế lấy cảm hứng từ Duolingo, kết hợp bảng màu kem ấm (`#ede8dc`) và giao diện tối hiện đại (`#16171d`), hỗ trợ **Light/Dark Mode mượt mà**.
- **100% Local Static SVG Assets:** Toàn bộ biểu tượng không phụ thuộc emoji hệ thống hay CDN bên ngoài:
  - 🎨 **Bộ 36 Topic Icons độc bản** (`public/assets/topics/*.svg`) đại diện cho 36 chủ đề từ vựng.
  - 💎 **Gamification Icons 3D:** Lửa streak (`streak-fire.svg`), kim cương (`gem.svg`), tim sinh mệnh (`heart.svg`), cúp vàng (`trophy.svg`), linh vật cú xanh (`mascot.svg`), huy hiệu hoàn thành (`check.svg`), ổ khóa (`lock.svg`).
  - 🌐 **National Flags:** Cờ Việt Nam (`vn.svg`), cờ Anh (`uk.svg`), cờ Mỹ (`us.svg`).
- **Lộ trình Snake Zigzag 3 Node/Tầng (Winding Board Pathway):**
  - Mỗi tầng hiển thị **3 bài học**, rút ngắn chiều dài trang từ 36 hàng xuống chỉ còn **12 hàng**.
  - Luồng học uốn lượn liên tục: Hàng chẵn đi từ **Trái ➔ Phải**, hàng lẻ đi từ **Phải ➔ Trái**, kết nối bằng các **SVG Bézier Turn Connectors** mềm mại kèm mũi tên chỉ hướng.
  - Khi bấm vào bài học: Bật **Modal Popup chi tiết** hiển thị tiến độ từ vựng, điểm thi, điểm bài học mà không làm biến dạng lưới bản đồ.

---

## 1. Trạng Thái Triển Khai Tính Năng (Implementation Status)

| Phân hệ / Module | Trạng thái | Chi tiết triển khai |
|---|:---:|---|
| **Authentication & RBAC** | ✅ Hoàn thành | JWT lưu trữ qua cookie `httpOnly`, quản lý đa phiên trên Redis (`session:{userId}:{sessionId}`), phân quyền Role-based (RBAC). |
| **Onboarding & Khảo sát** | ✅ Hoàn thành | Quy trình 2 bước đăng ký: Khảo sát mục tiêu học tập (Giao tiếp, Du lịch, Công việc, Thi cử...) + Cam kết thời lượng mỗi ngày. |
| **Placement Test (Đầu vào)** | ✅ Hoàn thành | Đề thi phân loại tự động sinh bằng AI, đánh giá và xếp vào 3 cấp độ: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`. |
| **Learning Path (Bản đồ)** | ✅ Hoàn thành | Sinh lộ trình động dựa trên Tier & Mục tiêu; mở khóa bài học theo chỉ số **Mastery (≥ 60%)**; thiết kế Snake Zigzag 3 node/tầng. |
| **Flashcard & Ôn tập Spaced** | ✅ Hoàn thành | Bộ thẻ lật 3D (Front/Back) với 3 trạng thái `NEW` ➔ `LEARNING` ➔ `MASTERED`. Tích hợp Web Speech API phát âm bản ngữ. |
| **Topic Lessons (Bài học)** | ✅ Hoàn thành | Kết hợp Quiz trắc nghiệm ngữ cảnh và Pronunciation (ghi âm nhận diện giọng nói đối chiếu ngữ âm). |
| **Exam & Luyện đề AI** | ✅ Hoàn thành | Ngân hàng đề thi theo từng chủ đề sinh bởi LLM (Groq / xAI); chống gian lận bằng server timestamp verification. |
| **Tra cứu từ điển (Dictionary)** | ✅ Hoàn thành | Tìm kiếm exact-match kho từ vựng nội bộ kết hợp auto-translate Google Translate API fallback. |
| **Chuỗi ngày học (Streak)** | ✅ Hoàn thành | Tính toán theo Timezone phía Client; theo dõi lịch sử 7 ngày gần nhất; cảnh báo đóng băng / duy trì chuỗi lửa. |

---

## 2. Cơ Chế Lộ Trình Học Cá Nhân Hóa (Learning Path Engine)

### 2.1. Phân loại trình độ (Tier-based Filtering)
Hệ thống không bắt buộc người dùng học lại những kiến thức đã thành thạo:
- Người học đạt `INTERMEDIATE` hoặc `ADVANCED` qua bài Placement Test sẽ được tự động mở khóa hoặc rút gọn các bài học sơ cấp.
- Thứ tự các Topic trong cùng một Tier được tự động ưu tiên theo mục tiêu học tập (`learning_purpose`) mà người dùng đã chọn khi Onboarding.

### 2.2. Công thức tính Độ Thành Thạo (Topic Mastery)
Mỗi chủ đề (Unit) sở hữu một chỉ số **Mastery độc lập (0 - 100%)**, đánh giá toàn diện cả 3 kỹ năng:

$$\text{VocabPercent} = \frac{\text{Số từ MASTERED}}{\text{Tổng số từ trong Topic}} \times 100$$

$$\text{ExamPercent} = \frac{\text{Điểm thi cao nhất}}{10} \times 100$$

$$\text{LessonPercent} = \text{Điểm bài luyện tập cao nhất (0 - 100)}$$

$$\mathbf{MasteryPercent} = \text{round}\Big(\text{VocabPercent} \times 50\% + \text{ExamPercent} \times 25\% + \text{LessonPercent} \times 25\%\Big)$$

- **Điều kiện mở khóa Topic kế tiếp:** Đạt tối thiểu **$60\%$ Mastery** ở Topic liền trước.
- **Tính toán động:** Trạng thái Unlock được tính toán real-time ở tầng Service (`learning-path.service.js`), đảm bảo tính nhất quán và chống stale data.

---

## 3. Kiến Trúc & Công Nghệ (Tech Stack)

```
┌────────────────────────────────────────────────────────┐
│                   FRONTEND - WEB                       │
│  React 19 • Vite • TailwindCSS v4 • Redux Toolkit      │
│  Dual Theme (Light/Dark) • Local SVG Asset System      │
└───────────────────────────┬────────────────────────────┘
                            │ RESTful APIs (Axios)
┌───────────────────────────▼────────────────────────────┐
│                   BACKEND - API                        │
│  Node.js • Express 5 • JWT HttpOnly • RBAC Middleware   │
│  Service-Repository Pattern • Anti-cheat Verification   │
└──────────────┬────────────────────────────┬────────────┘
               │ PostgreSQL                 │ Redis Cache
┌──────────────▼─────────────┐ ┌────────────▼────────────┐
│      DATABASE LAYER        │ │       CACHE LAYER       │
│  PostgreSQL (Relational)   │ │  Redis (Multi-session,  │
│  36 Topics • Flashcards    │ │  Rate-limit & Cache)    │
│  Exams & Results Schema    │ └─────────────────────────┘
└────────────────────────────┘
```

| Tầng (Layer) | Công nghệ sử dụng | Vai trò & Đặc điểm |
|---|---|---|
| **Frontend Web** | React 19, Vite, Tailwind CSS v4, Lucide React, Redux Toolkit | Single Page Application (SPA), render giao diện uốn lượn, tối ưu tải trang dưới 1s. |
| **Backend API** | Node.js (v20+), Express 5 | Cung cấp RESTful API bảo mật cao, tách lớp Controller - Service - Repository. |
| **Cơ sở dữ liệu** | PostgreSQL | Lưu trữ dữ liệu quan hệ: người dùng, kho từ vựng, chủ đề, tiến độ, kết quả thi. |
| **Caching & Session** | Redis | Lưu trữ Session token cho phép đăng nhập đa thiết bị và thu hồi tức thì khi Logout. |
| **Trí tuệ nhân tạo (AI)** | Groq API / xAI (`grok-4-fast`, `gpt-oss-120b`) | Tạo câu hỏi trắc nghiệm, tạo đề thi đầu vào và bài kiểm tra theo ngữ cảnh. |
| **Nhận diện giọng nói** | Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) | Chạy client-side hoàn toàn miễn phí, 0 latency, hỗ trợ luyện nói và phát âm chuẩn. |

---

## 4. Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
Multi-platform-English-learning-system/
├── backend/
│   ├── src/
│   │   ├── config/            # Cấu hình Database, Redis, JWT
│   │   ├── controllers/       # Điều hướng và parse HTTP Request
│   │   ├── middlewares/       # Xác thực JWT, Authorization, Error Handling
│   │   ├── repositories/      # Thao tác truy vấn Database PostgreSQL
│   │   ├── routes/            # Khai báo các API routes
│   │   ├── scripts/           # Script sinh đề AI, script tạo SVG icon
│   │   ├── services/          # Business Logic (Mastery, Exam, Streak, Path)
│   │   └── utils/             # Helper xử lý timezone, token, hash
│   ├── .env.example
│   └── package.json
│
├── frontend-web/
│   ├── public/
│   │   └── assets/            # 100% Asset tĩnh cục bộ (Offline-ready)
│   │       ├── flags/         # Cờ các quốc gia (vn.svg, uk.svg, us.svg)
│   │       ├── icons/         # Core gamification icons (streak, gem, mascot...)
│   │       └── topics/        # 36 SVG icons chủ đề học tập
│   ├── src/
│   │   ├── api/               # Cấu hình Axios instance & interceptors
│   │   ├── components/        # UI components (TopicSelector, RightSidebar...)
│   │   ├── context/           # ThemeContext (Dark / Light Mode)
│   │   ├── layouts/           # MainLayout kèm Navigation Sidebar
│   │   ├── pages/             # HomePage, LearningPathPage, ExamPages...
│   │   ├── store/             # Redux Slices (auth, streak, ui)
│   │   └── utils/             # topicIcons map, navigation returnTo helpers
│   └── package.json
│
├── mobile-android/            # Ứng dụng di động (Kế hoạch mở rộng Phase 2)
├── docker-compose.yml         # File khởi chạy nhanh PostgreSQL & Redis
└── README.md
```

---

## 5. Hướng Dẫn Cài Đặt & Chạy Thử (Getting Started)

### 5.1. Yêu cầu môi trường
- **Node.js**: v18.x hoặc v20.x trở lên
- **PostgreSQL**: v14 trở lên
- **Redis**: v6 trở lên (hoặc chạy qua Docker)

### 5.2. Khởi động Database & Redis qua Docker
```bash
# Tại thư mục gốc dự án:
docker-compose up -d
```

### 5.3. Khởi chạy Backend
```bash
cd backend

# 1. Cài đặt dependencies
npm install

# 2. Thiết lập biến môi trường
cp .env.example .env
# (Chỉnh sửa thông tin kết nối DB_HOST, DB_USER, DB_PASS, REDIS_URL, JWT_SECRET trong .env)

# 3. Chạy migration / seed dữ liệu (nếu cần)
npm run migrate

# 4. Chạy server ở chế độ dev
npm run dev
# Server sẽ lắng nghe tại: http://localhost:5000
```

### 5.4. Khởi chạy Frontend Web
```bash
cd ../frontend-web

# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy Vite dev server
npm run dev
# Ứng dụng mở tại: http://localhost:5173
```

---

## 6. Danh Mục API Endpoints Chính

| Phương thức | Đường dẫn API | Mô tả nghiệp vụ |
|:---:|---|---|
| `POST` | `/api/v1/auth/register` | Đăng ký tài khoản mới kèm thông tin khảo sát |
| `POST` | `/api/v1/auth/login` | Đăng nhập hệ thống, sinh JWT cookie `httpOnly` |
| `POST` | `/api/v1/auth/logout` | Đăng xuất, hủy bỏ phiên làm việc trên Redis |
| `GET` | `/api/v1/auth/me` | Lấy thông tin user hiện tại và role permissions |
| `GET` | `/api/v1/learning-path` | Lấy danh sách lộ trình cá nhân hóa (đã lọc và sắp xếp) |
| `GET` | `/api/v1/topics` | Lấy toàn bộ danh mục 36 chủ đề học |
| `GET` | `/api/v1/lessons/:topicId` | Lấy bài luyện tập của chủ đề (Quiz + Pronunciation) |
| `POST` | `/api/v1/lessons/:topicId/complete`| Nộp kết quả bài luyện tập và cập nhật Mastery |
| `GET` | `/api/v1/flashcards/daily` | Lấy bộ thẻ từ vựng cần ôn tập hôm nay |
| `PUT` | `/api/v1/flashcards/:id` | Cập nhật trạng thái thẻ (`NEW` / `LEARNING` / `MASTERED`) |
| `GET` | `/api/v1/exams/placement-exam` | Lấy đề thi kiểm tra đầu vào (Placement Test) |
| `GET` | `/api/v1/exams/topics/:topicId` | Lấy danh sách đề thi theo chủ đề |
| `POST` | `/api/v1/exams/:id/start` | Bắt đầu phiên làm bài thi (lưu timestamp server) |
| `POST` | `/api/v1/exams/:id/submit` | Nộp bài thi, đối chiếu thời gian và chấm điểm |
| `GET` | `/api/v1/streaks/status` | Kiểm tra chuỗi streak hiện tại của người dùng |
| `POST` | `/api/v1/streaks/record` | Ghi nhận hoạt động học tập để tăng chuỗi streak |

---

## 7. Định Hướng Phát Triển (Roadmap)
- [x] Tối ưu hóa UI/UX: Bản đồ Snake Zigzag 3 bài/tầng.
- [x] Chuyển đổi 100% asset sang SVG tĩnh cục bộ, đảm bảo chạy offline mượt mà.
- [x] Tích hợp Dual Theme (Sáng/Tối) toàn diện.
- [ ] Mở rộng ứng dụng Android Native (`mobile-android`) kết nối chung hệ thống backend RESTful.
- [ ] Bổ sung các bài học chuyên sâu về Ngữ pháp (Grammar Units) và Luyện nghe qua audio đoạn văn.

---
*Dự án được xây dựng và duy trì bởi nhóm phát triển `anhlingo`.*

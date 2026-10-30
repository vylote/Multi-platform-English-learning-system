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

## 5. Hướng Dẫn Cài Đặt & Khởi Chạy Dự Án (Getting Started)

Dành cho thành viên mới hoặc người vừa clone/pull dự án về máy. Hãy thực hiện tuần tự theo các bước chuẩn dưới đây để khởi tạo cơ sở dữ liệu, nạp dữ liệu mẫu và chạy toàn bộ hệ thống.

---

### 5.1. Yêu cầu môi trường (Prerequisites)
- **Node.js**: Phiên bản `v18.x` hoặc `v20.x` trở lên (khuyến nghị Node v20 LTS).
- **Docker & Docker Compose**: Đã cài đặt và đang chạy dịch vụ Docker daemon.
- **Git**: Dùng để quản lý mã nguồn.
- *(Tùy chọn)* Python 3.9+ nếu muốn chạy script phân loại từ vựng nâng cao `classify_topics.py`.

---

### 5.2. Khởi động Cơ sở dữ liệu & Caching bằng Docker

Dự án đã định cấu hình sẵn file [`docker-compose.yml`](file:///home/vylote/Projects/Multi-platform-English-learning-system/docker-compose.yml) chứa 2 service:
- **`my_postgres`**: PostgreSQL 15 (Port `5432`, User `postgres`, Password `3821`, Database `els_db`).
- **`my_redis`**: Redis Alpine (Port `6379`, quản lý phiên đăng nhập và cache).

Chạy lệnh sau tại **thư mục gốc dự án**:
```bash
# Khởi chạy ngầm PostgreSQL và Redis
docker compose up -d
```

> **Kiểm tra trạng thái:** Chạy `docker ps`, đảm bảo cả hai container `my_postgres` và `my_redis` đều ở trạng thái `Up` (hoặc `healthy`).

---

### 5.3. Khởi tạo Cơ sở dữ liệu qua các File SQL (Schema & RBAC)

Hệ thống cung cấp sẵn các tệp SQL cốt lõi nằm trong thư mục [`backend/src/docs/`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/docs/):
1. [`schema.sql`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/docs/schema.sql): Khởi tạo toàn bộ cấu trúc bảng (15 bảng: `roles`, `permissions`, `role_permissions`, `users`, `words`, `idioms`, `topics`, `flashcards`, `streak_logs`, `exams`, `questions`, `exam_results`, `exam_sessions`, `exam_answers`, `lesson_attempts`, `topic_goal_priority`, `system_settings`), ràng buộc khóa ngoại, triggers và các composite indexes tối ưu truy vấn.
2. [`seed_permissions.sql`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/docs/seed_permissions.sql): Khởi tạo 2 vai trò mặc định (`ADMIN`, `STUDENT`), danh mục quyền hạn chi tiết và tự động gán quyền truy cập cho từng vai trò trong bảng `role_permissions`.

#### Cách 1: Chạy trực tiếp qua Docker CLI (Khuyên Dùng — Không Cần Cài psql)
Từ **thư mục gốc của dự án**, chạy 2 lệnh sau:

```bash
# 1. Khởi tạo cấu trúc các bảng CSDL
docker exec -i my_postgres psql -U postgres -d els_db < backend/src/docs/schema.sql

# 2. Nạp danh mục vai trò và phân quyền (RBAC)
docker exec -i my_postgres psql -U postgres -d els_db < backend/src/docs/seed_permissions.sql
```

#### Cách 2: Chạy qua công cụ quản trị CSDL trực quan (DBeaver, DataGrip, pgAdmin)
- Kết nối tới PostgreSQL:
  - **Host:** `localhost`
  - **Port:** `5432`
  - **Database:** `els_db`
  - **Username:** `postgres`
  - **Password:** `3821`
- Mở và thực thi lần lượt file [`backend/src/docs/schema.sql`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/docs/schema.sql) rồi đến [`backend/src/docs/seed_permissions.sql`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/docs/seed_permissions.sql).

---

### 5.4. Thiết lập Biến Môi Trường (Environment Variables)

#### 1. Cấu hình Backend:
```bash
cd backend
cp .env.example .env
```
Nội dung file `backend/.env` mặc định tương thích hoàn toàn với cấu hình Docker:
```env
PORT=5000
FRONTEND_URL=http://localhost:5173

# Kết nối CSDL & Redis (Docker local)
DATABASE_URL=postgresql://postgres:3821@localhost:5432/els_db
REDIS_URL=redis://localhost:6379

# Xác thực người dùng
JWT_SECRET=super_secret_jwt_key_els_2026
JWT_ACCESS_EXPIRES_IN=1d
COOKIE_NAME=access_token
SESSION_KEY_PREFIX=session:

# Tùy chọn: API Key sinh câu hỏi thông minh bằng AI (Groq / xAI)
# Nếu để trống, script sinh đề thi sẽ tự động dùng chế độ Offline Fallback từ CSDL
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b
```

#### 2. Cấu hình Frontend Web:
```bash
cd ../frontend-web
cp .env.example .env
```
Nội dung file `frontend-web/.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

### 5.5. Cài đặt Dependencies & Kiểm tra Kết nối

1. **Cài đặt thư viện Backend:**
   ```bash
   cd backend
   npm install
   ```

2. **Kiểm tra kết nối tới PostgreSQL & Redis:**
   ```bash
   npm run test:conn
   ```
   *Khi thành công, màn hình sẽ thông báo xác nhận kết nối tới cả PostgreSQL và Redis đều OK.*

3. **Cài đặt thư viện Frontend:**
   ```bash
   cd ../frontend-web
   npm install
   ```

---

### 5.6. Chạy các Script Nạp Dữ Liệu (Data Seeding)

> [!IMPORTANT]
> **Thứ tự thực thi cực kỳ quan trọng!** Các script cần chạy tuần tự từ thư mục `backend/` theo đúng các bước sau để đảm bảo tính toàn vẹn quan hệ dữ liệu:

```bash
cd backend
```

#### 🔹 Bước 1: Khởi tạo thông số cấu hình hệ thống
```bash
npm run init:settings
```
- **Tệp thực thi:** [`src/scripts/init-settings.js`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/scripts/init-settings.js)
- **Mục đích:** Nạp hơn 14 tham số nghiệp vụ vào bảng `system_settings` (ngưỡng phân loại Tier `BEGINNER`/`INTERMEDIATE`/`ADVANCED`, trọng số tính Mastery, ngưỡng mở khóa bài học `60%`, thời gian gia hạn submit thi...). **Đây là bước bắt buộc vì Backend sẽ đọc các tham số này lúc khởi động.**

#### 🔹 Bước 2: Nạp danh mục 36 Chủ đề & Lộ trình học tập
```bash
npm run seed:topics
```
- **Tệp thực thi:** [`src/scripts/seed-topics.js`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/scripts/seed-topics.js)
- **Mục đích:** Đọc cấu hình chuẩn từ `topic_config.json`, tự động nạp 36 Topics vào bảng `topics`, phân bổ độ khó theo cấp độ (12 chủ đề Beginner, 12 chủ đề Intermediate, 12 chủ đề Advanced), gán thứ tự lộ trình `order_index` và lập bảng ánh xạ ưu tiên theo mục tiêu học viên (`topic_goal_priority`).

#### 🔹 Bước 3: Nạp kho Từ điển Anh - Việt (8,400+ từ)
```bash
npm run import:dict
```
- **Tệp thực thi:** [`src/scripts/import-dictionary.js`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/scripts/import-dictionary.js)
- **Mục đích:** Đọc kho từ điển StarDict chuẩn từ `src/data/stardict_en_vi.txt` và nạp hơn 8,400 từ vựng đầy đủ phiên âm, từ loại và ngữ nghĩa vào bảng `words`. Đây là nguồn dữ liệu nền cho tính năng tra từ điển, học từ vựng và sinh câu hỏi thi.

#### 🔹 Bước 4: Tạo đề thi đánh giá năng lực đầu vào (Placement Test)
```bash
npm run seed:placement
```
- **Tệp thực thi:** [`src/scripts/seed-placement-exam.js`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/scripts/seed-placement-exam.js)
- **Mục đích:** Nạp bộ đề thi phân loại chuẩn quốc tế gồm 30 câu hỏi trắc nghiệm chia đều theo 3 cấp độ (A1-A2, B1-B2, C1-C2) có sẵn đáp án chi tiết và giải thích ngữ pháp.

#### 🔹 Bước 5: Sinh ngân hàng đề thi theo từng chủ đề
```bash
npm run gen:exams
```
- **Tệp thực thi:** [`src/scripts/gen_exam.js`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/scripts/gen_exam.js) với tham số `--topics=1-36 --count=10 --duration=15`
- **Mục đích:** Tự động tạo mỗi chủ đề 1 bộ đề thi trắc nghiệm (10 câu hỏi, thời gian 15 phút).
- **Cơ chế linh hoạt:**
  - Nếu có cấu hình `GROQ_API_KEY`: Tự động gọi LLM AI để tạo câu hỏi bám sát ngữ cảnh giao tiếp thực tế.
  - Nếu không có API Key: Tự động chuyển sang chế độ **Offline Database Fallback**, lấy ngẫu nhiên từ vựng trong CSDL để tạo câu hỏi trắc nghiệm hợp lệ 100%, không bị phụ thuộc vào Internet hay quota AI.

---

### 5.7. Khởi Chạy Ứng Dụng (Run Dev Server)

Mở 2 cửa sổ terminal riêng biệt:

#### Terminal 1: Chạy Backend Server
```bash
cd backend
npm run dev
```
👉 Server Backend sẽ khởi động tại: **`http://localhost:5000`**

#### Terminal 2: Chạy Frontend Web
```bash
cd frontend-web
npm run dev
```
👉 Mở trình duyệt truy cập: **`http://localhost:5173`**

---

### 5.8. Trải Nghiệm & Kiểm Thử Tính Năng
1. Truy cập `http://localhost:5173/register` để đăng ký tài khoản học viên mới.
2. Hoàn thành quy trình 2 bước:
   - **Khảo sát mục tiêu:** Chọn mục tiêu học (Giao tiếp / Du lịch / Công việc / Thi cử) và thời lượng cam kết hàng ngày.
   - **Làm bài Placement Test:** Trả lời 30 câu hỏi để hệ thống phân loại vào Tier tương ứng (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`).
3. Khám phá bản đồ học tập uốn lượn **Snake Zigzag 3 node/tầng**, học từ vựng qua Flashcard 3D, làm bài luyện tập âm vị và thi trắc nghiệm chủ đề!

---

### 5.9. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

| Hiện tượng | Nguyên nhân | Cách khắc phục |
|---|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | Container PostgreSQL chưa chạy | Chạy `docker ps` kiểm tra. Nếu chưa có, chạy `docker compose up -d`. |
| `password authentication failed for user "postgres"` | Sai thông tin mật khẩu kết nối CSDL | Kiểm tra biến `DATABASE_URL` trong file `.env` phải khớp với password trong `docker-compose.yml` (`3821`). |
| `ECONNREFUSED 127.0.0.1:6379` | Container Redis chưa chạy | Chạy `docker compose restart my_redis` và thử lại với `npm run test:conn`. |
| `relation "system_settings" does not exist` | Chưa nạp file cấu trúc SQL | Chạy lệnh `docker exec -i my_postgres psql -U postgres -d els_db < backend/src/docs/schema.sql`. |
| Server crash khi khởi động báo thiếu setting | Chưa chạy script nạp cài đặt hệ thống | Đứng tại thư mục `backend/` và chạy `npm run init:settings`. |
| Lỗi import từ điển bị gián đoạn | File dữ liệu từ điển chưa đúng đường dẫn | Kiểm tra tệp `backend/src/data/stardict_en_vi.txt` tồn tại và chạy lại `npm run import:dict`. |

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

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

Tại **thư mục gốc dự án**, chạy lệnh:

#### 🐧 Trên Linux / macOS:
```bash
docker compose up -d
```

#### 🪟 Trên Windows (PowerShell hoặc CMD):
```powershell
docker compose up -d
```

> **Kiểm tra trạng thái:** Chạy `docker ps`, đảm bảo cả hai container `my_postgres` và `my_redis` đều ở trạng thái `Up` (hoặc `healthy`).

---

### 5.3. Khởi tạo CSDL qua các File SQL (Schema & Roles)

Thư mục [`backend/src/docs/`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/docs/) cung cấp các tệp SQL cốt lõi:
1. [`schema.sql`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/docs/schema.sql): Khởi tạo toàn bộ cấu trúc 15 bảng (`roles`, `permissions`, `role_permissions`, `users`, `words`, `idioms`, `topics`, `flashcards`, `streak_logs`, `exams`, `questions`, `exam_results`, `exam_sessions`, `exam_answers`, `lesson_attempts`, `topic_goal_priority`, `system_settings`), khóa ngoại, triggers và index tối ưu truy vấn.
2. [`seed_permissions.sql`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/docs/seed_permissions.sql): Khởi tạo 2 vai trò (`ADMIN`, `STUDENT`), danh mục quyền chi tiết và tự động map quyền vào `role_permissions`.
3. [`seed_topics.sql`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/docs/seed_topics.sql): Khởi tạo 36 chủ đề học tập chuẩn, gán độ khó (Beginner, Intermediate, Advanced), thứ tự uốn lượn và liên kết mục tiêu học tập.
4. [`seed_admin.sql`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/docs/seed_admin.sql): Khởi tạo tài khoản Quản trị viên mặc định (`admin` / `admin123`).

Từ **thư mục gốc dự án**, thực thi các file SQL vào Docker container `my_postgres`:

#### 🐧 Lệnh cho Linux / macOS (Bash):
```bash
# 1. Tạo bảng cơ sở dữ liệu
docker exec -i my_postgres psql -U postgres -d els_db < backend/src/docs/schema.sql

# 2. Nạp vai trò & phân quyền
docker exec -i my_postgres psql -U postgres -d els_db < backend/src/docs/seed_permissions.sql

# 3. Nạp 36 chủ đề học tập
docker exec -i my_postgres psql -U postgres -d els_db < backend/src/docs/seed_topics.sql

# 4. Nạp tài khoản Admin mặc định
docker exec -i my_postgres psql -U postgres -d els_db < backend/src/docs/seed_admin.sql
```

#### 🪟 Lệnh cho Windows PowerShell:
```powershell
# 1. Tạo bảng cơ sở dữ liệu
Get-Content backend\src\docs\schema.sql | docker exec -i my_postgres psql -U postgres -d els_db

# 2. Nạp vai trò & phân quyền
Get-Content backend\src\docs\seed_permissions.sql | docker exec -i my_postgres psql -U postgres -d els_db

# 3. Nạp 36 chủ đề học tập
Get-Content backend\src\docs\seed_topics.sql | docker exec -i my_postgres psql -U postgres -d els_db

# 4. Nạp tài khoản Admin mặc định
Get-Content backend\src\docs\seed_admin.sql | docker exec -i my_postgres psql -U postgres -d els_db
```

#### 🪟 Lệnh cho Windows CMD (Command Prompt):
```cmd
docker exec -i my_postgres psql -U postgres -d els_db < backend\src\docs\schema.sql
docker exec -i my_postgres psql -U postgres -d els_db < backend\src\docs\seed_permissions.sql
docker exec -i my_postgres psql -U postgres -d els_db < backend\src\docs\seed_topics.sql
docker exec -i my_postgres psql -U postgres -d els_db < backend\src\docs\seed_admin.sql
```

*(Hoặc dùng công cụ trực quan **DBeaver / DataGrip / pgAdmin**: Kết nối tới `localhost:5432`, user: `postgres`, password: `3821`, database: `els_db` rồi mở và execute 4 file SQL trên theo thứ tự).*

---

### 5.4. Thiết lập Biến Môi Trường (`.env`)

#### 1. Tạo file `.env` cho Backend:

* **Trên Linux / macOS:**
  ```bash
  cd backend && cp .env.example .env
  ```
* **Trên Windows PowerShell:**
  ```powershell
  cd backend; Copy-Item .env.example .env
  ```
* **Trên Windows CMD:**
  ```cmd
  cd backend && copy .env.example .env
  ```

Nội dung chi tiết trong `backend/.env`:
| Biến môi trường | Giá trị mặc định | Giải thích ý nghĩa |
|---|---|---|
| `PORT` | `5000` | Cổng HTTP Server của Backend API. |
| `FRONTEND_URL` | `http://localhost:5173` | URL Frontend để cấu hình CORS và cookie `httpOnly`. |
| `DATABASE_URL` | `postgresql://postgres:3821@localhost:5432/els_db` | Chuỗi kết nối PostgreSQL (khớp thông số Docker). |
| `REDIS_URL` | `redis://localhost:6379` | Chuỗi kết nối Redis cache & quản lý phiên đăng nhập. |
| `JWT_SECRET` | `super_secret_jwt_key_els_2026` | Khóa bí mật ký JWT Token (**bắt buộc phải có**). |
| `JWT_ACCESS_EXPIRES_IN` | `1d` | Thời hạn sống của Access Token (1 ngày). |
| `COOKIE_NAME` | `access_token` | Tên cookie lưu JWT bảo mật. |
| `SESSION_KEY_PREFIX` | `session:` | Tiền tố session key lưu trên Redis. |
| `GROQ_API_KEY` | *(Để trống nếu chạy Offline)* | Khóa API Groq Cloud sinh đề thi thông minh bằng AI. Lấy key miễn phí tại: [console.groq.com/keys](https://console.groq.com/keys). **Nếu để trống, hệ thống tự động sinh đề thi Offline từ CSDL từ điển.** |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Model LLM sử dụng (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`). |

#### 2. Tạo file `.env` cho Frontend Web:

* **Trên Linux / macOS:**
  ```bash
  cd ../frontend-web && cp .env.example .env
  ```
* **Trên Windows PowerShell:**
  ```powershell
  cd ..\frontend-web; Copy-Item .env.example .env
  ```
* **Trên Windows CMD:**
  ```cmd
  cd ..\frontend-web && copy .env.example .env
  ```

Nội dung file `frontend-web/.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

### 5.5. Cài đặt Thư viện & Kiểm tra Kết nối

1. **Cài đặt thư viện Backend & Kiểm tra kết nối:**
   ```bash
   cd backend
   npm install
   npm run test:conn
   ```
   *Màn hình hiển thị `[PostgreSQL] Kết nối THÀNH CÔNG!` và `[Redis] Kết nối THÀNH CÔNG!` nghĩa là hệ sinh thái Docker đã sẵn sàng.*

2. **Cài đặt thư viện Frontend:**
   ```bash
   cd ../frontend-web
   npm install
   ```

---

### 5.6. Quy trình Nạp Dữ Liệu (Data Seeding)

> [!TIP]
> **Cách 1: Nạp Nhanh Toàn Bộ (Khuyên dùng)**  
> Đứng tại thư mục `backend/` và chạy đúng 1 lệnh duy nhất:
> ```bash
> npm run seed:all
> ```
> Lệnh này sẽ tự động chạy tuần tự: Cấu hình hệ thống ➔ 36 Chủ đề ➔ Đề thi Placement Test ➔ Tài khoản Admin ➔ Ngân hàng đề thi 36 chủ đề!

---

#### Cách 2: Chạy Từng Script Độc Lập Theo Thứ Tự

Nếu muốn chủ động kiểm soát từng bước, hãy chạy lần lượt các script sau tại thư mục `backend/`:

```bash
cd backend
```

#### 🔹 Bước 1: Khởi tạo thông số cấu hình hệ thống
```bash
npm run init:settings
```
- **Tệp:** [`src/scripts/init-settings.js`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/scripts/init-settings.js)
- **Mục đích:** Nạp hơn 14 tham số nghiệp vụ vào bảng `system_settings` (ngưỡng phân loại Tier `BEGINNER`/`INTERMEDIATE`/`ADVANCED`, trọng số tính Mastery, ngưỡng mở khóa bài học `60%`, thời gian gia hạn thi...). **Bắt buộc chạy trước khi khởi động server vì server đọc bảng này lúc khởi chạy.**

#### 🔹 Bước 2: Nạp 36 Chủ đề & Lộ trình học tập Snake Zigzag
```bash
npm run seed:topics
```
- **Tệp:** [`src/scripts/seed-topics.js`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/scripts/seed-topics.js)
- **Mục đích:** Đọc `topic_config.json`, tự động nạp 36 Topics vào bảng `topics`, phân bổ độ khó (12 Beginner, 12 Intermediate, 12 Advanced), gán thứ tự lộ trình `order_index` 1..36 và lập bảng ánh xạ ưu tiên theo mục tiêu học viên (`topic_goal_priority`).

#### 🔹 Bước 3: Tạo đề thi đánh giá năng lực đầu vào (Placement Test)
```bash
npm run seed:placement
```
- **Tệp:** [`src/scripts/seed-placement-exam.js`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/scripts/seed-placement-exam.js)
- **Mục đích:** Nạp bộ đề thi phân loại chuẩn gồm 30 câu hỏi trắc nghiệm chia đều theo 3 cấp độ (A1-A2, B1-B2, C1-C2) có sẵn đáp án chi tiết và giải thích ngữ pháp.

#### 🔹 Bước 4: Tạo tài khoản Quản trị viên (ADMIN) mặc định
```bash
npm run seed:admin
```
- **Tệp:** [`src/scripts/seed-admin.js`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/scripts/seed-admin.js)
- **Mục đích:** Tạo sẵn tài khoản Quản trị viên để đăng nhập vào Admin Portal:
  - **Tên đăng nhập:** `admin`
  - **Mật khẩu:** `admin123`
  - **Email:** `admin@anhlingo.com`

#### 🔹 Bước 5: Sinh ngân hàng đề thi cho toàn bộ 36 chủ đề
```bash
npm run gen:exams
```
- **Tệp:** [`src/scripts/gen_exam.js`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/scripts/gen_exam.js)
- **Mục đích:** Tự động tạo cho mỗi chủ đề 1 bộ đề thi trắc nghiệm (10 câu hỏi, thời lượng 15 phút).
- **Cơ chế linh hoạt:**
  - Nếu có cấu hình `GROQ_API_KEY`: Tự động gọi LLM AI để tạo câu hỏi bám sát ngữ cảnh giao tiếp thực tế.
  - Nếu không có API Key: Tự động chuyển sang chế độ **Offline Database Fallback**, lấy ngẫu nhiên từ vựng trong CSDL để tạo câu hỏi trắc nghiệm hợp lệ 100%, không bị phụ thuộc vào Internet hay quota AI.

#### 🔹 Bước 6: Nạp kho Từ điển Anh - Việt (StarDict 53 MB)
```bash
npm run import:dict
```
- **Tệp:** [`src/scripts/import-dictionary.js`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/scripts/import-dictionary.js)
- **Nguồn dữ liệu:** [`src/data/stardict_en_vi.txt`](file:///home/vylote/Projects/Multi-platform-English-learning-system/backend/src/data/stardict_en_vi.txt) (53 MB)
- **Mục đích:** Đọc tệp từ điển StarDict và nạp từ vựng đầy đủ phiên âm, từ loại và ngữ nghĩa vào bảng `words`. Đây là nguồn dữ liệu nền cho tính năng tra từ điển, học từ vựng và sinh câu hỏi thi.
- **Tiến trình:** Script nạp theo từng batch 500 từ và hiển thị log real-time trên màn hình (`Đã import: 500 từ...`, `Đã import: 1000 từ...`).

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

### 5.8. Kiểm Thử Hệ Thống (Admin & Học Viên)

#### 🛡️ Dành cho Quản trị viên (Admin Portal):
1. Truy cập: [`http://localhost:5173/admin/login`](http://localhost:5173/admin/login)
2. Đăng nhập bằng tài khoản mặc định:
   - **Tài khoản:** `admin`
   - **Mật khẩu:** `admin123`
3. Trải nghiệm các phân hệ quản trị:
   - **Quản lý người dùng:** [`http://localhost:5173/admin/users`](http://localhost:5173/admin/users)
   - **Phân quyền RBAC:** [`http://localhost:5173/admin/permissions`](http://localhost:5173/admin/permissions)
   - **Ngân hàng đề thi:** [`http://localhost:5173/admin/exams`](http://localhost:5173/admin/exams)
   - **Sinh đề thi AI:** [`http://localhost:5173/admin/exams/generate`](http://localhost:5173/admin/exams/generate)
   - **Cấu hình hệ thống:** [`http://localhost:5173/admin/settings`](http://localhost:5173/admin/settings)

#### 🎓 Dành cho Học viên (Student Experience):
1. Truy cập: [`http://localhost:5173/register`](http://localhost:5173/register) để tạo tài khoản mới.
2. Hoàn thành quy trình 2 bước Onboarding:
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
| `relation "words" does not exist` | Chưa nạp file cấu trúc SQL trước khi import | Chạy file `backend/src/docs/schema.sql` vào database trước. |
| `relation "system_settings" does not exist` | Chưa nạp file cấu trúc SQL | Chạy file `backend/src/docs/schema.sql` vào database trước. |
| Server crash khi khởi động báo thiếu setting | Chưa chạy script nạp cài đặt hệ thống | Đứng tại thư mục `backend/` và chạy `npm run init:settings`. |
| Không đăng nhập được vào Admin | Chưa tạo tài khoản admin | Đứng tại thư mục `backend/` và chạy `npm run seed:admin`. |

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

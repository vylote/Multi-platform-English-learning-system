# anhlingo — Hệ thống học tiếng Anh đa nền tảng cá nhân hóa

Nền tảng học tiếng Anh trực tuyến đa nền tảng (Web và Android) xây dựng theo mô hình lộ trình cá nhân hóa kết hợp kiểm tra đầu vào, phân loại trình độ, cơ chế tính điểm thi đua và xử lý sự kiện ngầm qua Apache Kafka.

---

## 1. Các tính năng chính

- Xác thực người dùng và phân quyền quản trị
- Khảo sát mục tiêu học tập ban đầu
- Bài thi kiểm tra đầu vào và phân loại trình độ
- Lộ trình học tập cá nhân hóa theo chủ đề
- Bài học kết hợp trắc nghiệm ngữ cảnh và luyện phát âm giọng nói
- Học từ vựng qua thẻ ghi nhớ và ôn tập lặp lại ngắt quãng
- Ngân hàng đề thi và kiểm tra trực tuyến có chống gian lận
- Tra cứu từ điển Anh - Việt
- Theo dõi chuỗi ngày học liên tục
- Điểm kinh nghiệm, cấp độ và bảng xếp hạng tuần
- Phân tích lỗi sai và gợi ý lộ trình ôn tập bằng trí tuệ nhân tạo
- Ứng dụng di động Android kết nối đồng bộ dữ liệu

---

## 2. Cơ chế lộ trình học cá nhân hóa

### 2.1. Phân loại trình độ
Hệ thống không bắt buộc người dùng học lại những kiến thức đã thành thạo:
- Người học đạt mức trung cấp hoặc nâng cao qua bài kiểm tra đầu vào sẽ được tự động mở khóa hoặc rút gọn các bài học sơ cấp.
- Thứ tự các chủ đề trong cùng một cấp độ được tự động ưu tiên theo mục tiêu học tập mà người dùng đã chọn khi đăng ký.

### 2.2. Công thức tính độ thành thạo chủ đề
Mỗi chủ đề sở hữu một chỉ số thành thạo độc lập từ 0 đến 100%, đánh giá toàn diện cả 3 kỹ năng:

$$\text{VocabPercent} = \frac{\text{Số từ đã thuộc}}{\text{Tổng số từ trong chủ đề}} \times 100$$

$$\text{ExamPercent} = \frac{\text{Điểm thi cao nhất}}{10} \times 100$$

$$\text{LessonPercent} = \text{Điểm bài luyện tập cao nhất (0 - 100)}$$

$$\mathbf{MasteryPercent} = \text{round}\Big(\text{VocabPercent} \times 50\% + \text{ExamPercent} \times 25\% + \text{LessonPercent} \times 25\%\Big)$$

- Điều kiện mở khóa chủ đề kế tiếp: Đạt tối thiểu 60% độ thành thạo ở chủ đề liền trước.
- Trạng thái mở khóa được tính toán trực tiếp tại thời điểm gọi dịch vụ, đảm bảo tính nhất quán và không bị lệch dữ liệu.

---

## 3. Kiến trúc và công nghệ

```text
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│          GIAO DIỆN WEB          │   │       ỨNG DỤNG DI ĐỘNG          │
│  React 19 • Vite • Tailwind v4  │   │  Android Native (Java 17)       │
│  Redux Toolkit • Lucide Icons   │   │  Room SQLite • Retrofit 2       │
└────────────────┬────────────────┘   └────────────────┬────────────────┘
                 │ RESTful APIs (Axios)                │ RESTful APIs (Retrofit)
┌────────────────▼─────────────────────────────────────▼────────────────┐
│                           MÁY CHỦ BACKEND                             │
│       Node.js • Express 5 • JWT HttpOnly Cookie • Phân quyền RBAC     │
│       Mô hình Service - Repository • Phát sự kiện Kafka ngầm          │
└──────────────┬────────────────────────────┬───────────────────────────┘
               │ PostgreSQL                 │ Redis Cache
┌──────────────▼─────────────┐ ┌────────────▼────────────┐
│         CƠ SỞ DỮ LIỆU      │ │       BỘ NHỚ ĐỆM        │
│  PostgreSQL 15             │ │  Redis (Quản lý phiên,  │
│  Dữ liệu quan hệ & bảng    │ │  Bảng xếp hạng tuần)    │
└────────────────────────────┘ └────────────▲────────────┘
                                            │
┌───────────────────────────────────────────┴───────────────────────────┐
│                   HỆ THỐNG STREAM SỰ KIỆN KAFKA                       │
│  Cụm Apache Kafka (Chế độ KRaft • 3 Brokers • Sao lưu 3 bản)          │
│  Danh sách kênh: exam.submissions, learning.activity.completed,       │
│                  vocab.learning.events                                │
│  Giao diện quản trị Kafka UI tại cổng 8085                            │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │ Luồng tiêu thụ sự kiện
┌───────────────────────────────────▼───────────────────────────────────┐
│                   TIẾN TRÌNH XỬ LÝ NGẦM KAFKA                         │
│  5 nhóm tiêu thụ chạy độc lập song song:                              │
│  - exam-ai-evaluation-group    (Chấm điểm & phân tích AI ngầm)        │
│  - streak-tracker-group        (Ghi nhận chuỗi ngày học)              │
│  - gamification-exp-group      (Cộng điểm kinh nghiệm & xếp hạng)     │
│  - smart-flashcard-group       (Tự động đưa từ vào ôn tập ngắt quãng) │
│  - vocab-analytics-group       (Thống kê từ vựng yếu toàn hệ thống)   │
└───────────────────────────────────────────────────────────────────────┘
```

| Tầng hệ thống | Công nghệ sử dụng | Vai trò |
|---|---|---|
| Giao diện Web | React 19, Vite, Tailwind CSS v4, Redux Toolkit, Lucide | Ứng dụng đơn trang, giao diện hiện đại, tối ưu tốc độ tải trang dưới 1 giây, hiển thị nhận xét trí tuệ nhân tạo thời gian thực. |
| Ứng dụng di động | Android Native, Java 17, Room Database, Retrofit 2, OkHttp 3 | Chạy trên Android 8.0 trở lên, hỗ trợ lưu trữ cục bộ SQLite, đồng bộ dữ liệu với máy chủ qua giao diện lập trình ứng dụng. |
| Máy chủ ứng dụng | Node.js (phiên bản 20 trở lên), Express 5 | Cung cấp giao diện lập trình ứng dụng chuẩn RESTful, mô hình phân lớp rõ ràng, tích hợp cơ chế phát sự kiện Kafka không gây nghẽn. |
| Cơ sở dữ liệu | PostgreSQL 15 | Lưu trữ dữ liệu quan hệ gồm người dùng, kho từ vựng, chủ đề, tiến độ học, kết quả thi và thẻ từ vựng. |
| Bộ nhớ đệm | Redis Alpine | Quản lý phiên đăng nhập, lưu tạm phản hồi nhận xét và duy trì bảng xếp hạng tuần theo thời gian thực. |
| Phân phối sự kiện | Apache Kafka (Chế độ KRaft, 3 Brokers) | Cụm máy chủ điều phối tin nhắn phân tán, phân vùng dữ liệu và đảm bảo khả năng chịu lỗi cao. |
| Quản trị sự kiện | Provectus Labs Kafka-UI | Bảng điều khiển trực quan giúp theo dõi các kênh tin nhắn, phân vùng và nhóm tiêu thụ tại cổng 8085. |
| Tiến trình xử lý ngầm | Node.js Worker | Chạy ngầm 5 nhóm tiêu thụ xử lý song song các tác vụ nặng về tính toán điểm, chuỗi ngày học và gọi trí tuệ nhân tạo. |
| Trí tuệ nhân tạo | Groq Cloud API hoặc mô hình nội bộ | Tạo đề thi tự động, giải thích lỗi sai ngữ pháp và đưa ra lời khuyên cá nhân hóa cho học viên. |
| Nhận diện giọng nói | Web Speech API | Chạy trực tiếp trên trình duyệt, không mất chi phí, độ trễ tức thì, hỗ trợ luyện phát âm. |

---

## 4. Kiến trúc hướng sự kiện và các luồng nghiệp vụ Kafka

Hệ thống áp dụng kiến trúc hướng sự kiện với cụm 3 máy chủ Kafka chạy chế độ KRaft phân tán. Các tác vụ xử lý tốn thời gian được chuyển thành sự kiện bất đồng bộ, giúp máy chủ phản hồi ngay lập tức cho học viên trong thời gian dưới 10 mili-giây qua 3 luồng nghiệp vụ chính:

### Luồng 1: Chấm điểm bài thi và phân tích lỗi sai ngầm bằng trí tuệ nhân tạo
- Khi học viên nộp bài thi, máy chủ tính điểm thô và trả về kết quả ngay lập tức cho giao diện người dùng.
- Máy chủ phát một sự kiện vào kênh `exam.submissions`. Nhóm tiêu thụ `exam-ai-evaluation-group` lấy bài thi ra, trích xuất danh sách câu sai, gọi mô hình trí tuệ nhân tạo phân tích lỗi và lưu nhận xét vào bộ nhớ đệm Redis.
- Giao diện người dùng tự động thăm dò định kỳ mỗi 2 giây để hiển thị bảng đánh giá và lộ trình ôn tập cho học viên khi đã hoàn thành.

### Luồng 2: Đường ống tích lũy điểm kinh nghiệm và chuỗi ngày học
- Khi học viên hoàn thành một bài học chủ đề hoặc bài kiểm tra, máy chủ phát duy nhất một sự kiện vào kênh `learning.activity.completed`.
- Hai nhóm tiêu thụ độc lập cùng nhận sự kiện và xử lý song song:
  - Nhóm ghi nhận chuỗi ngày học: Lưu lịch sử học vào cơ sở dữ liệu và cập nhật số ngày học liên tục.
  - Nhóm tích lũy điểm: Tính điểm kinh nghiệm thưởng theo kết quả làm bài, cập nhật cấp độ và ghi nhận trực tiếp vào bảng xếp hạng tuần.

### Luồng 3: Tự động gom từ vựng yếu vào thẻ ôn tập và thống kê
- Khi học viên phát âm sai hoặc chọn nhầm đáp án của một từ vựng trong bài học, máy chủ phát sự kiện vào kênh `vocab.learning.events`.
- Hai nhóm tiêu thụ xử lý song song:
  - Nhóm thẻ ghi nhớ thông minh: Tự động đưa từ đó vào danh sách thẻ ôn tập ở trạng thái đang học, áp dụng phương pháp lặp lại ngắt quãng để nhắc học viên ôn tập vào ngày hôm sau.
  - Nhóm thống kê: Tổng hợp tần suất từ vựng bị làm sai của từng cá nhân và trên toàn hệ thống để phát hiện các bẫy từ vựng phổ biến.

---

## 5. Cấu trúc thư mục

```text
Multi-platform-English-learning-system/
├── backend/                        # Máy chủ backend và tiến trình xử lý ngầm Kafka
│   ├── src/
│   │   ├── config/                 # Cấu hình cơ sở dữ liệu, bộ nhớ đệm và Kafka
│   │   ├── controllers/            # Xử lý yêu cầu HTTP và điều hướng
│   │   ├── docs/                   # Cấu trúc bảng SQL và dữ liệu khởi tạo
│   │   ├── kafka/                  # Mã nguồn Kafka: kết nối, kênh, phát và nhận tin
│   │   │   ├── consumers/          # 5 nhóm xử lý sự kiện ngầm
│   │   │   ├── producers/          # Các hàm phát sự kiện bài thi, bài học, từ vựng
│   │   │   └── worker.js           # Tiến trình thực thi toàn bộ nhóm tiêu thụ
│   │   ├── middlewares/            # Xác thực người dùng, phân quyền và bắt lỗi
│   │   ├── repositories/           # Thao tác truy vấn cơ sở dữ liệu PostgreSQL
│   │   ├── routes/                 # Định tuyến đường dẫn API
│   │   ├── scripts/                # Kịch bản nạp dữ liệu và sinh đề tự động
│   │   └── services/               # Xử lý logic nghiệp vụ
│   ├── .env.example
│   └── package.json
│
├── frontend-web/                   # Ứng dụng giao diện web
│   ├── public/
│   │   └── assets/                 # Tệp ảnh SVG tĩnh (cờ, biểu tượng chủ đề)
│   ├── src/
│   │   ├── api/                    # Cấu hình gọi API máy chủ
│   │   ├── components/             # Các khối giao diện dùng chung
│   │   ├── layouts/                # Bố cục khung trang
│   │   ├── pages/                  # Các màn hình chính (học tập, làm bài, thi thử)
│   │   └── store/                  # Quản lý trạng thái toàn cục Redux
│   └── package.json
│
├── mobile-android/                 # Ứng dụng di động Android Native
│   ├── app/
│   │   ├── src/main/java/com/els/app/
│   │   │   ├── data/local/         # Cơ sở dữ liệu Room SQLite nội bộ
│   │   │   ├── data/remote/        # Định nghĩa giao tiếp API Retrofit
│   │   │   ├── network/            # Cấu hình kết nối mạng và quản lý phiên
│   │   │   └── ui/                 # Các màn hình ứng dụng di động
│   │   └── src/main/res/           # Giao diện XML, màu sắc và chuỗi ngôn ngữ
│   └── build.gradle.kts
│
├── docker-compose.yml              # Khởi chạy PostgreSQL và Redis
├── docker-compose.kafka.yml        # Khởi chạy cụm 3 máy chủ Kafka và Kafka UI
└── README.md
```

---

## 6. Hướng dẫn cài đặt và khởi chạy

### 6.1. Yêu cầu môi trường
- Node.js phiên bản 18 hoặc 20 trở lên (khuyến nghị phiên bản 20 LTS).
- Docker và Docker Compose đã cài đặt và đang chạy.
- Git để quản lý mã nguồn.
- Đối với phần di động: Phần mềm Android Studio hỗ trợ JDK 17.

---

### 6.2. Khởi động cơ sở dữ liệu và bộ nhớ đệm
Dự án có sẵn tệp `docker-compose.yml` gồm PostgreSQL và Redis.

Tại thư mục gốc dự án, thực hiện lệnh:

- Trên Linux hoặc macOS:
  ```bash
  docker compose up -d
  ```
- Trên Windows (PowerShell hoặc Command Prompt):
  ```powershell
  docker compose up -d
  ```

Kiểm tra bằng lệnh `docker ps`, đảm bảo cả hai dịch vụ đều ở trạng thái hoạt động bình thường.

---

### 6.3. Khởi động cụm Kafka
Cụm Kafka được tách riêng trong tệp `docker-compose.kafka.yml` theo chế độ KRaft, gồm 3 máy chủ Kafka tại các cổng 9092, 9093, 9094 và giao diện trực quan Kafka UI tại cổng 8085.

Tại thư mục gốc dự án, thực hiện lệnh:

- Trên Linux hoặc macOS:
  ```bash
  docker compose -f docker-compose.kafka.yml up -d
  ```
- Trên Windows:
  ```powershell
  docker compose -f docker-compose.kafka.yml up -d
  ```

---

### 6.4. Nạp cấu trúc cơ sở dữ liệu ban đầu
Thực thi các tệp SQL theo thứ tự vào vùng chứa PostgreSQL:

- Trên Linux hoặc macOS:
  ```bash
  docker exec -i my_postgres psql -U postgres -d els_db < backend/src/docs/schema.sql
  docker exec -i my_postgres psql -U postgres -d els_db < backend/src/docs/seed_permissions.sql
  docker exec -i my_postgres psql -U postgres -d els_db < backend/src/docs/seed_topics.sql
  docker exec -i my_postgres psql -U postgres -d els_db < backend/src/docs/seed_admin.sql
  ```

- Trên Windows PowerShell:
  ```powershell
  Get-Content backend\src\docs\schema.sql | docker exec -i my_postgres psql -U postgres -d els_db
  Get-Content backend\src\docs\seed_permissions.sql | docker exec -i my_postgres psql -U postgres -d els_db
  Get-Content backend\src\docs\seed_topics.sql | docker exec -i my_postgres psql -U postgres -d els_db
  Get-Content backend\src\docs\seed_admin.sql | docker exec -i my_postgres psql -U postgres -d els_db
  ```

- Trên Windows Command Prompt:
  ```cmd
  docker exec -i my_postgres psql -U postgres -d els_db < backend\src\docs\schema.sql
  docker exec -i my_postgres psql -U postgres -d els_db < backend\src\docs\seed_permissions.sql
  docker exec -i my_postgres psql -U postgres -d els_db < backend\src\docs\seed_topics.sql
  docker exec -i my_postgres psql -U postgres -d els_db < backend\src\docs\seed_admin.sql
  ```

---

### 6.5. Cấu hình tệp môi trường

1. Tạo tệp cấu hình cho máy chủ:
   - Trên Linux/macOS: `cd backend && cp .env.example .env`
   - Trên Windows: `cd backend && copy .env.example .env`

   Các thông số chính trong `backend/.env`:
   - `PORT`: Cổng máy chủ, mặc định 5000.
   - `DATABASE_URL`: Đường dẫn kết nối cơ sở dữ liệu PostgreSQL.
   - `REDIS_URL`: Đường dẫn kết nối bộ nhớ đệm Redis (`redis://localhost:6379`).
   - `KAFKA_BROKERS`: Danh sách máy chủ Kafka (`localhost:9092,localhost:9093,localhost:9094`).
   - `JWT_SECRET`: Khóa bí mật dùng tạo mã xác thực.
   - `GROQ_API_KEY`: Khóa gọi trí tuệ nhân tạo để phân tích bài làm. Nếu để trống, hệ thống tự động chạy theo thuật toán nội bộ mà không cần Internet.

2. Tạo tệp cấu hình cho giao diện web:
   - Trên Linux/macOS: `cd ../frontend-web && cp .env.example .env`
   - Trên Windows: `cd ..\frontend-web && copy .env.example .env`

---

### 6.6. Cài đặt gói thư viện và kiểm tra kết nối
Tại thư mục gốc, thực hiện:

```bash
# Cài đặt cho máy chủ và kiểm tra kết nối
cd backend
npm install
npm run test:conn

# Cài đặt cho giao diện web
cd ../frontend-web
npm install
```

---

### 6.7. Nạp dữ liệu mẫu
Tại thư mục `backend/`, chạy lệnh sau để tự động nạp toàn bộ cấu hình, 36 chủ đề, bài thi phân loại, tài khoản quản trị và ngân hàng đề thi:

```bash
npm run seed:all
```

Tùy chọn nạp thêm từ điển Anh - Việt StarDict nếu muốn tra cứu ngoại tuyến:
```bash
npm run import:dict
```

---

### 6.8. Khởi chạy ứng dụng Web và máy chủ

Mở 3 cửa sổ dòng lệnh riêng biệt:

- Cửa sổ 1: Chạy máy chủ backend
  ```bash
  cd backend
  npm run dev
  ```
  Máy chủ hoạt động tại địa chỉ: `http://localhost:5000`

- Cửa sổ 2: Chạy tiến trình xử lý ngầm Kafka
  ```bash
  cd backend
  npm run kafka:worker
  ```
  Tiến trình sẽ kết nối cụm Kafka và sẵn sàng tiếp nhận các sự kiện.

- Cửa sổ 3: Chạy giao diện web
  ```bash
  cd frontend-web
  npm run dev
  ```
  Mở trình duyệt truy cập: `http://localhost:5173`

Kiểm tra nhanh các luồng sự kiện Kafka bằng các lệnh kiểm thử độc lập:
```bash
cd backend
npm run kafka:test           # Kiểm tra luồng chấm thi và phân tích AI
npm run kafka:test:activity  # Kiểm tra luồng tích lũy chuỗi ngày và điểm thưởng
npm run kafka:test:vocab     # Kiểm tra luồng tự động đưa từ sai vào ôn tập
```
Truy cập bảng điều khiển Kafka UI tại địa chỉ `http://localhost:8085` để xem các sự kiện trực quan.

---

### 6.9. Cài đặt và khởi chạy ứng dụng di động Android

Ứng dụng di động nằm trong thư mục `mobile-android/`.

Các bước thực hiện trên Android Studio:
1. Mở phần mềm Android Studio, chọn mục mở dự án và duyệt tới thư mục `mobile-android/`.
2. Chờ phần mềm hoàn tất quá trình đồng bộ thư viện Gradle.
3. Kiểm tra địa chỉ kết nối máy chủ trong tệp `app/build.gradle.kts`:
   - Nếu chạy trên máy ảo Android: Giữ nguyên địa chỉ mặc định `http://10.0.2.2:5000/api/v1/`.
   - Nếu chạy trên thiết bị thật: Đổi địa chỉ `10.0.2.2` thành địa chỉ mạng nội bộ của máy tính đang chạy backend (ví dụ: `http://192.168.1.50:5000/api/v1/`).
4. Nhấn nút chạy để biên dịch và cài đặt ứng dụng lên máy ảo hoặc thiết bị thật.

---

### 6.10. Tài khoản trải nghiệm hệ thống

- Tài khoản quản trị viên:
  - Địa chỉ đăng nhập: `http://localhost:5173/admin/login`
  - Tên đăng nhập: `admin`
  - Mật khẩu: `admin123`
  - Chức năng: Quản lý người dùng, phân quyền, ngân hàng đề thi, tạo đề bằng trí tuệ nhân tạo và cấu hình tham số.

- Dành cho học viên:
  - Đăng ký tài khoản mới tại `http://localhost:5173/register`.
  - Tham gia bài khảo sát mục tiêu và làm bài kiểm tra đầu vào để được xếp lớp phù hợp.
  - Làm bài thi thử và nhận nhận xét chi tiết do trí tuệ nhân tạo phân tích tự động.

---

### 6.11. Xử lý các sự cố thường gặp

| Tình huống | Nguyên nhân | Biện pháp xử lý |
|---|---|---|
| Lỗi từ chối kết nối cổng 5432 | Vùng chứa PostgreSQL chưa được bật | Dùng lệnh `docker ps` kiểm tra và chạy `docker compose up -d`. |
| Lỗi sai thông tin đăng nhập PostgreSQL | Sai mật khẩu kết nối | Kiểm tra tệp `.env` để thông số mật khẩu trùng khớp với tệp `docker-compose.yml` (`3821`). |
| Lỗi từ chối kết nối cổng 6379 | Vùng chứa Redis chưa được bật | Khởi động lại Redis bằng lệnh `docker compose restart my_redis`. |
| Lỗi từ chối kết nối cổng 9092 | Cụm Kafka chưa được bật | Chạy lệnh `docker compose -f docker-compose.kafka.yml up -d`. |
| Báo lỗi thiếu phân vùng khi chạy worker | Kênh Kafka chưa được tạo sẵn | Khởi động lại lệnh `npm run kafka:worker`. Mã nguồn đã tích hợp tự động kiểm tra và tạo kênh với cờ chờ máy chủ sẵn sàng. |
| Báo lỗi thiếu bảng khi nhập dữ liệu | Chưa chạy tệp SQL cấu trúc | Chạy tệp `backend/src/docs/schema.sql` vào cơ sở dữ liệu trước. |
| Máy chủ tắt ngay khi mở vì thiếu cài đặt | Chưa nạp tham số ban đầu | Chạy lệnh `npm run init:settings` hoặc `npm run seed:all` trong thư mục backend. |
| Máy ảo di động không gọi được máy chủ | Cấu hình sai địa chỉ kết nối | Kiểm tra đảm bảo máy chủ đang chạy cổng 5000 và tệp cấu hình ứng dụng dùng địa chỉ `10.0.2.2`. |

---

## 7. Danh mục các đường dẫn API chính

| Phương thức | Đường dẫn API | Mô tả chức năng |
|:---:|---|---|
| `POST` | `/api/v1/auth/register` | Đăng ký tài khoản mới kèm thông tin khảo sát |
| `POST` | `/api/v1/auth/login` | Đăng nhập hệ thống và cấp mã xác thực |
| `POST` | `/api/v1/auth/logout` | Đăng xuất và xóa phiên làm việc |
| `GET` | `/api/v1/auth/me` | Lấy thông tin cá nhân và quyền hạn người dùng |
| `GET` | `/api/v1/learning-path` | Lấy danh sách lộ trình học đã được cá nhân hóa |
| `GET` | `/api/v1/topics` | Lấy danh mục toàn bộ các chủ đề học tập |
| `GET` | `/api/v1/lessons/:topicId` | Lấy nội dung bài luyện tập gồm trắc nghiệm và phát âm |
| `POST` | `/api/v1/lessons/:topicId/complete` | Nộp bài luyện tập, cập nhật điểm và phát sự kiện Kafka |
| `GET` | `/api/v1/flashcards/daily` | Lấy bộ thẻ từ vựng cần ôn tập trong ngày |
| `PUT` | `/api/v1/flashcards/:id` | Cập nhật trạng thái ghi nhớ của thẻ từ vựng |
| `GET` | `/api/v1/exams/placement-exam` | Lấy đề thi kiểm tra trình độ đầu vào |
| `GET` | `/api/v1/exams/topics/:topicId` | Lấy danh sách đề thi theo từng chủ đề |
| `POST` | `/api/v1/exams/:id/start` | Bắt đầu phiên làm bài thi và lưu mốc thời gian |
| `POST` | `/api/v1/exams/:id/submit` | Nộp bài thi, tính điểm tức thì và kích hoạt phân tích AI ngầm |
| `GET` | `/api/v1/exams/sessions/:sessionId/ai-feedback` | Lấy kết quả phân tích lỗi sai và lời khuyên từ trí tuệ nhân tạo |
| `GET` | `/api/v1/gamification/leaderboard` | Lấy bảng xếp hạng học tập tuần |
| `GET` | `/api/v1/gamification/my-stats` | Xem điểm kinh nghiệm, cấp độ và vị trí xếp hạng cá nhân |
| `GET` | `/api/v1/words/analytics/weak-words` | Xem danh sách các từ vựng hay làm sai |
| `GET` | `/api/v1/words/search` | Tra cứu từ điển Anh - Việt |
| `GET` | `/api/v1/streaks/status` | Lấy chuỗi ngày học liên tục hiện tại |
| `POST` | `/api/v1/streaks/record` | Ghi nhận hoạt động học tập để duy trì chuỗi ngày |

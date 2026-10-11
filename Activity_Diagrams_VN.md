# Trọn bộ 6 Biểu đồ Hoạt động (Activity Diagrams) — Hệ thống Học tiếng Anh Đa nền tảng

Tài liệu này cung cấp toàn bộ **6 Biểu đồ Hoạt động (Activity Diagrams)** cốt lõi của hệ thống, chuẩn hóa theo ký hiệu UML tiêu chuẩn có phân chia làn đường trách nhiệm (**Swimlanes**):
1. **Học viên** (Người dùng cuối)
2. **Giao diện Client** (Web React / Mobile App)
3. **Hệ thống Backend** (Node.js / Express REST API)
4. **Cơ sở dữ liệu & Cache** (PostgreSQL / Redis)

---

## Hướng dẫn Import vào Draw.io
Bạn có thể đưa biểu đồ vào Draw.io chỉ với 3 bước:
1. Mở [draw.io](https://app.diagrams.net/).
2. Trên thanh menu, chọn **`+` (Insert)** hoặc **`Arrange`** $\rightarrow$ **`Advanced`** $\rightarrow$ chọn **`PlantUML`** (Khuyên dùng) hoặc **`Mermaid`**.
3. Dán đoạn mã tương ứng bên dưới vào và bấm **`Insert`**.

---

## 1. Biểu đồ 1: Xác thực & Đăng nhập hệ thống (Authentication)

Mô tả quy trình đăng nhập, mã hóa bcrypt, xác thực session qua Redis và cấp phát JWT token có hỗ trợ cookie HttpOnly.

### 1.1. Mã PlantUML
```plantuml
@startuml
skinparam conditionStyle insideDiamond
skinparam defaultTextAlignment center

|Học viên|
start
:Nhập Email và Mật khẩu;

|Giao diện Client|
:Gửi yêu cầu đăng nhập;

|Hệ thống Backend|
:Nhận thông tin đăng nhập;

|Cơ sở dữ liệu|
:Tìm kiếm User theo Email;

|Hệ thống Backend|
if (Có tồn tại User?) then (Có)
  :Xác thực mật khẩu (Hash);
  if (Mật khẩu đúng?) then (Đúng)
    :Tạo phiên đăng nhập (JWT Token);
    |Cơ sở dữ liệu|
    :Lưu Session vào Redis Cache;
    |Hệ thống Backend|
    :Đóng gói dữ liệu User & Token;
  else (Sai)
    :Trả về lỗi HTTP 401 (Sai thông tin đăng nhập);
  endif
else (Không)
  :Trả về lỗi HTTP 401 (Sai thông tin đăng nhập);
endif

|Giao diện Client|
if (Đăng nhập thành công?) then (Có)
  :Lưu HTTPOnly Cookie;
  :Chuyển hướng vào trang chủ;
else (Không)
  :Hiển thị thông báo đăng nhập thất bại;
endif

|Học viên|
:Xem trang chủ / Thông báo lỗi;
stop
@enduml
```

### 1.2. Mã Mermaid
```mermaid
graph TD
    subgraph Học_viên [Học viên]
        A(Bắt đầu) --> B[Nhập Email và Mật khẩu]
        Z[Xem trang chủ / Thông báo lỗi] --> END(Kết thúc)
    end

    subgraph Client [Giao diện Client]
        B --> C[Gửi yêu cầu đăng nhập]
        K[Nhận phản hồi từ Backend] --> L{Đăng nhập thành công?}
        L -- Có --> M[Lưu HTTPOnly Cookie & Chuyển hướng]
        L -- Không --> N[Hiển thị thông báo thất bại]
        M --> Z
        N --> Z
    end

    subgraph Backend [Hệ thống Backend]
        C --> D[Nhận thông tin đăng nhập]
        F{Có tồn tại User?}
        F -- Không --> ERR[Trả về lỗi HTTP 401]
        F -- Có --> G[Xác thực mật khẩu Hash]
        G --> H{Mật khẩu đúng?}
        H -- Sai --> ERR
        H -- Đúng --> I[Tạo phiên đăng nhập JWT]
        J[Đóng gói dữ liệu User & Token] --> K
        ERR --> K
    end

    subgraph DB [Cơ sở dữ liệu & Redis]
        D --> E[Tìm kiếm User theo Email]
        E --> F
        I --> REDIS[(Lưu Session vào Redis Cache)]
        REDIS --> J
    end
```

---

## 2. Biểu đồ 2: Tra cứu từ điển Lai (Multi-tier Dictionary Search)

Mô tả cơ chế tối ưu hiệu năng tra cứu qua 3 tầng: CSDL PostgreSQL nội bộ $\rightarrow$ Bộ nhớ đệm Redis $\rightarrow$ Dịch vụ dịch thuật bên ngoài.

### 2.1. Mã PlantUML
```plantuml
@startuml
skinparam conditionStyle insideDiamond
skinparam defaultTextAlignment center

|Học viên|
start
:Nhập từ vựng cần tra cứu;

|Giao diện Client|
:Gửi yêu cầu tìm kiếm từ vựng;

|Hệ thống Backend|
:Tiếp nhận từ khóa tra cứu;

|Cơ sở dữ liệu|
:Truy vấn trong CSDL PostgreSQL (bảng words);

|Hệ thống Backend|
if (Tìm thấy trong CSDL?) then (Có)
  :Lấy dữ liệu từ DB;
else (Không)
  |Cơ sở dữ liệu|
  :Kiểm tra bộ nhớ tạm (Redis Cache);
  |Hệ thống Backend|
  if (Có trong Redis Cache?) then (Có)
    :Lấy dữ liệu từ Cache;
  else (Không)
    :Gọi dịch vụ dịch thuật / API ngoài;
    :Xử lý và chuẩn hóa dữ liệu nghĩa từ;
    |Cơ sở dữ liệu|
    :Lưu kết quả mới vào Redis Cache;
    |Hệ thống Backend|
  endif
endif

:Chuẩn hóa JSON và trả về kết quả;

|Giao diện Client|
:Hiển thị chi tiết từ vựng và phiên âm;

|Học viên|
:Xem định nghĩa và phát âm từ vựng;
stop
@enduml
```

### 2.2. Mã Mermaid
```mermaid
graph TD
    subgraph Học_viên [Học viên]
        A(Bắt đầu) --> B[Nhập từ vựng cần tra cứu]
        O[Xem định nghĩa chi tiết] --> END(Kết thúc)
    end

    subgraph Client [Giao diện Client]
        B --> C[Gửi yêu cầu tìm kiếm]
        N[Hiển thị kết quả tra cứu] --> O
    end

    subgraph Backend [Hệ thống Backend]
        C --> D[Tiếp nhận từ khóa]
        F{Có trong CSDL?}
        F -- Có --> F1[Lấy dữ liệu từ CSDL]
        F -- Không --> G[Tìm kiếm trong Redis]
        H{Có trong Cache?}
        H -- Có --> H1[Lấy dữ liệu từ Redis]
        H -- Không --> I[Gọi API dịch ngoài]
        J[Chuẩn hóa dữ liệu nghĩa từ]
        M[Chuẩn hóa JSON trả về] --> N
        F1 --> M
        H1 --> M
        J --> M
    end

    subgraph DB [Cơ sở dữ liệu & Cache]
        D --> E[(Truy vấn bảng words)]
        E --> F
        G --> H
        I --> EXT_API[API Dịch thuật / Ngoài]
        EXT_API --> J
        J -.-> |Lưu cache| REDIS[(Lưu vào Redis)]
    end
```

---

## 3. Biểu đồ 3: Học từ vựng Flashcard (Cập nhật trạng thái & Tiến độ)

Mô tả quy trình lật thẻ học từ, đánh dấu mức độ ghi nhớ (NEW / LEARNING / MASTERED) và cập nhật thời gian ôn tập tự động.

### 3.1. Mã PlantUML
```plantuml
@startuml
skinparam conditionStyle insideDiamond
skinparam defaultTextAlignment center

|Học viên|
start
:Lật thẻ Flashcard và chọn trạng thái\n(Chưa thuộc / Đang học / Đã thuộc);

|Giao diện Client|
:Gửi yêu cầu cập nhật trạng thái thẻ;

|Hệ thống Backend|
:Tiếp nhận yêu cầu cập nhật;

|Cơ sở dữ liệu|
:Truy vấn thông tin Flashcard theo ID;

|Hệ thống Backend|
if (Thẻ từ tồn tại?) then (Có)
  :Tính toán trạng thái mới\nvà thời gian ôn tập tiếp theo;
  |Cơ sở dữ liệu|
  :Cập nhật trạng thái Flashcard & ngày ôn tập;
  |Hệ thống Backend|
  :Trả về kết quả cập nhật thành công (HTTP 200);
else (Không)
  :Trả về thông báo lỗi không tìm thấy thẻ (HTTP 404);
endif

|Giao diện Client|
if (Cập nhật thành công?) then (Có)
  :Cập nhật thanh tiến độ học của Topic;
  :Chuyển sang thẻ Flashcard tiếp theo;
else (Không)
  :Hiển thị thông báo lỗi cập nhật;
endif

|Học viên|
:Tiếp tục ôn tập thẻ kế tiếp / Xem kết quả;
stop
@enduml
```

### 3.2. Mã Mermaid
```mermaid
graph TD
    subgraph Học_viên [Học viên]
        A(Bắt đầu) --> B[Lật thẻ và chọn trạng thái ghi nhớ]
        L[Tiếp tục ôn tập thẻ tiếp theo] --> END(Kết thúc)
    end

    subgraph Client [Giao diện Client]
        B --> C[Gửi yêu cầu cập nhật thẻ từ]
        I[Nhận kết quả từ Backend] --> J{Cập nhật thành công?}
        J -- Có --> J1[Cập nhật tiến độ & chuyển thẻ tiếp theo]
        J -- Không --> J2[Hiển thị thông báo lỗi]
        J1 --> L
        J2 --> L
    end

    subgraph Backend [Hệ thống Backend]
        C --> D[Tiếp nhận yêu cầu]
        F{Thẻ từ tồn tại?}
        F -- Không --> ERR[Trả về HTTP 404 Not Found]
        F -- Có --> G[Tính toán trạng thái & chu kỳ ôn tập]
        H[Trả về phản hồi HTTP 200 OK] --> I
        ERR --> I
    end

    subgraph DB [Cơ sở dữ liệu]
        D --> E[(Truy vấn flashcard theo ID)]
        E --> F
        G --> DB_UP[(Cập nhật bảng flashcards)]
        DB_UP --> H
    end
```

---

## 4. Biểu đồ 4: Ghi nhận chuỗi ngày học liên tục (Streak Tracking)

Mô tả thuật toán kiểm tra tính liên tục theo múi giờ client để tăng chuỗi học, duy trì hoặc reset về ngày đầu tiên.

### 4.1. Mã PlantUML
```plantuml
@startuml
skinparam conditionStyle insideDiamond
skinparam defaultTextAlignment center

|Học viên|
start
:Truy cập ứng dụng / Hoàn thành bài học;

|Giao diện Client|
:Gửi yêu cầu ghi nhận hoạt động (kèm Timezone);

|Hệ thống Backend|
:Tiếp nhận yêu cầu và xác định ngày của User;

|Cơ sở dữ liệu|
:Truy vấn ngày học gần nhất và Streak hiện tại;

|Hệ thống Backend|
if (Đã học trong ngày hôm nay?) then (Đúng)
  :Giữ nguyên số chuỗi ngày Streak hiện tại;
else (Sai)
  if (Có học vào ngày hôm qua?) then (Liên tiếp)
    :Tăng số ngày Streak lên +1;
  else (Đứt đoạn)
    :Đặt lại chuỗi Streak về 1;
  endif
  |Cơ sở dữ liệu|
  :Lưu bản ghi streak_logs mới & cập nhật User;
  |Hệ thống Backend|
endif

:Chuẩn hóa dữ liệu lịch học 7 ngày;
:Trả về trạng thái Streak (HTTP 200);

|Giao diện Client|
:Hiển thị ngọn lửa Streak và lịch tuần;

|Học viên|
:Xem số ngày học liên tục được duy trì;
stop
@enduml
```

### 4.2. Mã Mermaid
```mermaid
graph TD
    subgraph Học_viên [Học viên]
        A(Bắt đầu) --> B[Truy cập ứng dụng / Học bài]
        N[Xem biểu tượng ngọn lửa Streak] --> END(Kết thúc)
    end

    subgraph Client [Giao diện Client]
        B --> C[Gửi yêu cầu ghi nhận Streak kèm Timezone]
        M[Render ngọn lửa Streak & lịch 7 ngày] --> N
    end

    subgraph Backend [Hệ thống Backend]
        C --> D[Tiếp nhận yêu cầu & tính ngày địa phương]
        F{Đã học hôm nay?}
        F -- Đúng --> G[Giữ nguyên chuỗi ngày Streak]
        F -- Sai --> H{Có học vào hôm qua?}
        H -- Có --> H1[Tăng Streak lên +1]
        H -- Không --> H2[Reset Streak về 1]
        K[Chuẩn hóa dữ liệu lịch 7 ngày] --> M
        G --> K
        J_DONE --> K
    end

    subgraph DB [Cơ sở dữ liệu]
        D --> E[(Lấy ngày học gần nhất)]
        E --> F
        H1 --> J[(Lưu vào bảng streak_logs)]
        H2 --> J
        J --> J_DONE[Xác nhận ghi log]
    end
```

---

## 5. Biểu đồ 5: Luyện đề trắc nghiệm (Nộp bài & Chống gian lận)

Mô tả cơ chế kiểm soát phiên thi nghiêm ngặt: kiểm tra quá giờ làm bài (Timeout trên Server) và phát hiện gian lận (chuyển tab trình duyệt) trước khi chấm điểm.

### 5.1. Mã PlantUML
```plantuml
@startuml
skinparam conditionStyle insideDiamond
skinparam defaultTextAlignment center

|Học viên|
start
:Bấm nút nộp bài thi trắc nghiệm;

|Giao diện Client|
:Thu thập danh sách đáp án\nvà nhật ký hành vi (chuyển tab);
:Gửi yêu cầu nộp bài (submit exam);

|Hệ thống Backend|
:Tiếp nhận bài thi và session_id;

|Cơ sở dữ liệu|
:Lấy thời gian bắt đầu phiên thi từ Redis/DB;

|Hệ thống Backend|
if (Quá thời gian làm bài quy định?) then (Có)
  :Gán trạng thái vi phạm Timeout;
  :Hủy kết quả bài thi (HTTP 400);
else (Không)
  if (Số lần chuyển tab vượt giới hạn?) then (Có)
    :Gán trạng thái lỗi Gian lận;
    |Cơ sở dữ liệu|
    :Lưu lịch sử vi phạm gian lận vào DB;
    |Hệ thống Backend|
    :Hủy kết quả bài thi;
  else (Không)
    :Đối chiếu đáp án đúng và tính điểm số;
    |Cơ sở dữ liệu|
    :Lưu exam_results, exam_answers vào DB;
    |Hệ thống Backend|
    :Chuẩn bị chi tiết kết quả (điểm, đáp án đúng/sai);
  endif
endif

|Giao diện Client|
if (Nộp bài thành công?) then (Có)
  :Hiển thị bảng điểm, phân tích câu đúng/sai;
else (Không)
  :Hiển thị thông báo hủy bài do vi phạm/hết giờ;
endif

|Học viên|
:Xem kết quả thi / Thông báo vi phạm;
stop
@enduml
```

### 5.2. Mã Mermaid
```mermaid
graph TD
    subgraph Học_viên [Học viên]
        A(Bắt đầu) --> B[Bấm nút nộp bài thi]
        O[Xem kết quả / Thông báo vi phạm] --> END(Kết thúc)
    end

    subgraph Client [Giao diện Client]
        B --> C[Thu thập đáp án & log chuyển tab]
        C --> D[Gửi yêu cầu nộp bài submit]
        M[Nhận phản hồi từ Backend] --> N{Nộp bài hợp lệ?}
        N -- Có --> N1[Hiển thị bảng điểm & phân tích]
        N -- Không --> N2[Hiển thị thông báo hủy bài thi]
        N1 --> O
        N2 --> O
    end

    subgraph Backend [Hệ thống Backend]
        D --> E[Tiếp nhận bài nộp]
        G{Quá giờ quy định?}
        G -- Có --> G1[Hủy bài do Timeout]
        G -- Không --> H{Phát hiện gian lận chuyển tab?}
        H -- Có --> H1[Hủy bài do Gian lận]
        H -- Không --> I[Tiến hành chấm điểm tự động]
        J[Chuẩn bị chi tiết kết quả] --> M
        G1 --> M
        H1 --> M
    end

    subgraph DB [Cơ sở dữ liệu & Redis]
        E --> F[(Lấy start_time của phiên thi)]
        F --> G
        H1 -.-> |Lưu log vi phạm| DB1[(Cơ sở dữ liệu)]
        I --> DB2[(Lưu exam_results & answers)]
        DB2 --> J
    end
```

---

## 6. Biểu đồ 6: Lộ trình học tập (Tính toán Mastery & Mở khóa Chủ đề)

Mô tả thuật toán tính toán Lộ trình cá nhân hóa dựa trên Trình độ đầu vào (Tier sau Placement Test), Mục tiêu học tập, kết hợp công thức Mastery đa thành phần (Vocab 50% + Exam 25% + Lesson 25%) và ngưỡng mở khóa 60%.

### 6.1. Mã PlantUML
```plantuml
@startuml
skinparam conditionStyle insideDiamond
skinparam defaultTextAlignment center

|Học viên|
start
:Truy cập trang Lộ trình học (Learning Path);

|Giao diện Client|
:Gửi yêu cầu lấy lộ trình cá nhân hóa;

|Hệ thống Backend|
:Tiếp nhận yêu cầu từ User;

|Cơ sở dữ liệu|
:Lấy thông tin User (Tier, Mục tiêu học tập);
:Lấy danh sách các Topics và tiến độ học;

|Hệ thống Backend|
:Lọc Topics theo Tier (BEGINNER / INTERMEDIATE / ADVANCED);
:Sắp xếp thứ tự Topics ưu tiên theo mục tiêu học;

loop Duyệt qua từng Topic trong lộ trình
  :Tính % Flashcard đã thuộc (Trọng số 50%);
  :Tính % Điểm thi cao nhất (Trọng số 25%);
  :Tính % Điểm bài luyện tập (Trọng số 25%);
  :Tổng hợp Mastery = Vocab*0.5 + Exam*0.25 + Lesson*0.25;
  
  if (Là Topic đầu tiên?) then (Đúng)
    :Đánh dấu mở khóa (isUnlocked = true);
  else (Sai)
    if (Mastery của Topic trước >= 60%?) then (Đạt)
      :Đánh dấu mở khóa (isUnlocked = true);
    else (Chưa đạt)
      :Đánh dấu khóa (isUnlocked = false);
    endif
  endif
endloop

:Đóng gói danh sách Topic và trạng thái lộ trình;

|Giao diện Client|
:Render cây lộ trình học (Learning Path Map);
:Đánh dấu chặng đang học (isCurrent) và chặng bị khóa;

|Học viên|
:Xem tiến độ lộ trình và chọn bài học tiếp theo;
stop
@enduml
```

### 6.2. Mã Mermaid
```mermaid
graph TD
    subgraph Học_viên [Học viên]
        A(Bắt đầu) --> B[Truy cập trang Lộ trình học]
        M[Xem bản đồ lộ trình & chọn bài học] --> END(Kết thúc)
    end

    subgraph Client [Giao diện Client]
        B --> C[Gửi yêu cầu lấy lộ trình cá nhân hóa]
        L[Render bản đồ lộ trình học & mở khóa] --> M
    end

    subgraph Backend [Hệ thống Backend]
        C --> D[Tiếp nhận yêu cầu]
        F[Lọc Topics theo Tier & Ưu tiên theo Goal]
        F --> G[Duyệt danh sách từng Topic]
        G --> H[Tính Mastery: 50% Vocab + 25% Exam + 25% Lesson]
        H --> I{Topic đầu hoặc Topic trước >= 60%?}
        I -- Đúng --> I1[Gán isUnlocked = true]
        I -- Sai --> I2[Gán isUnlocked = false]
        I1 --> J{Còn Topic tiếp theo?}
        I2 --> J
        J -- Còn --> G
        J -- Hết --> K[Đóng gói lộ trình hoàn chỉnh]
        K --> L
    end

    subgraph DB [Cơ sở dữ liệu]
        D --> E[(Lấy User Tier, Goal, Topics, Progress)]
        E --> F
    end
```

---

## 7. Bảng Tổng hợp Quyết định Logic (Decision Nodes Summary)

| Biểu đồ | Điểm rẽ nhánh (Condition) | Khi Đúng (True Path) | Khi Sai (False Path) | Ý nghĩa nghiệp vụ |
|---|---|---|---|---|
| **1. Đăng nhập** | `Có tồn tại User?` | Chuyển sang so khớp mật khẩu bằng bcrypt. | Trả về HTTP 401 ngay lập tức. | Bảo mật, ngăn chặn brute-force và giảm tải xử lý. |
| **1. Đăng nhập** | `Mật khẩu đúng?` | Tạo JWT Token, lưu Session vào Redis. | Trả về HTTP 401 (Sai mật khẩu). | Xác thực an toàn mật khẩu đã băm trong database. |
| **2. Tra từ điển** | `Tìm thấy trong CSDL?` | Lấy dữ liệu bảng `words` trả về ngay. | Chuyển sang kiểm tra bộ đệm Redis. | Tối ưu hóa truy vấn nội bộ tốc độ cao nhất. |
| **2. Tra từ điển** | `Có trong Redis Cache?` | Lấy trực tiếp từ RAM, không gọi API ngoài. | Gọi API dịch thuật và cập nhật vào Redis. | Tiết kiệm chi phí gọi dịch vụ bên ngoài và giảm độ trễ. |
| **3. Flashcard** | `Thẻ từ tồn tại?` | Cập nhật trạng thái và tính chu kỳ lặp lại. | Báo lỗi 404 Not Found. | Đảm bảo tính toàn vẹn dữ liệu người học. |
| **4. Streak** | `Đã học hôm nay?` | Giữ nguyên chuỗi ngày học hiện tại. | Kiểm tra tiếp xem có học ngày hôm qua không. | Tránh cộng dồn streak nhiều lần trong cùng một ngày. |
| **4. Streak** | `Có học vào hôm qua?` | Tăng chuỗi Streak lên +1 (Liên tục). | Reset Streak về 1 (Đứt đoạn). | Khuyến khích người học duy trì thói quen học tập đều đặn. |
| **5. Luyện thi** | `Quá thời gian quy định?` | Hủy kết quả do Timeout (Server tính). | Kiểm tra tiếp hành vi gian lận. | Chống sửa đổi đồng hồ phía client để kéo dài giờ thi. |
| **5. Luyện thi** | `Chuyển tab vượt giới hạn?`| Ghi nhận log vi phạm và hủy kết quả. | Tiến hành chấm điểm trắc nghiệm tự động. | Đảm bảo tính trung thực và công bằng cho bài thi. |
| **6. Lộ trình** | `Topic trước >= 60%?` | Mở khóa Topic tiếp theo (`isUnlocked = true`). | Khóa Topic (`isUnlocked = false`). | Đảm bảo người học nắm vững kiến thức cốt lõi trước khi học tiếp. |

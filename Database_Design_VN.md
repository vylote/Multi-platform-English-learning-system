# Đặc tả Thiết kế Cơ sở Dữ liệu Chi tiết - Hệ thống ELS

Tài liệu này cung cấp **Đặc tả chi tiết các bảng dữ liệu (Data Dictionary)** của hệ thống English Learning System (ELS) phiên bản V7 trên hệ quản trị CSDL PostgreSQL. Bảng đặc tả này được trình bày theo chuẩn báo cáo kỹ thuật phần mềm, giúp hội đồng thấy rõ kiểu dữ liệu, các ràng buộc (Constraints), Khóa chính (PK), Khóa ngoại (FK) và Khóa duy nhất (UK).

---

## PHẦN 1: HỆ THỐNG PHÂN QUYỀN VÀ NGƯỜI DÙNG

### 1.1 Bảng `roles` (Vai trò hệ thống)
*Mô tả: Quản lý danh mục các vai trò để cấp quyền cho người dùng (VD: ADMIN, USER).*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã định danh tự tăng |
| 2 | `code` | VARCHAR(50) | UK | Có | Mã vai trò viết hoa (VD: 'ADMIN') |
| 3 | `name` | VARCHAR(100) | | Có | Tên hiển thị (VD: 'Quản trị viên') |
| 4 | `description` | TEXT | | Không | Mô tả chức năng vai trò |
| 5 | `created_at` | TIMESTAMPTZ| | Có | Ngày tạo (Default: CURRENT_TIMESTAMP)|

### 1.2 Bảng `permissions` (Danh mục quyền hạn)
*Mô tả: Quản lý các quyền chi tiết (VD: VIEW_USERS, EDIT_WORDS).*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã định danh tự tăng |
| 2 | `code` | VARCHAR(100) | UK | Có | Mã quyền hạn hệ thống |
| 3 | `name` | VARCHAR(150) | | Có | Tên quyền hiển thị |
| 4 | `description` | TEXT | | Không | Mô tả quyền hạn |
| 5 | `created_at` | TIMESTAMPTZ| | Có | Ngày tạo |

### 1.3 Bảng `role_permissions` (Phân quyền chi tiết)
*Mô tả: Bảng trung gian giải quyết quan hệ Nhiều - Nhiều giữa Roles và Permissions.*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `role_id` | INTEGER | PK, FK | Có | Trỏ đến `roles(id)` |
| 2 | `permission_id`| INTEGER | PK, FK | Có | Trỏ đến `permissions(id)` |
*(Lưu ý: `role_id` + `permission_id` tạo thành Khóa chính ghép)*

### 1.4 Bảng `users` (Hồ sơ người dùng)
*Mô tả: Lưu trữ tài khoản và thông tin cá nhân hóa của người học.*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã định danh người dùng |
| 2 | `username` | VARCHAR(50) | UK | Có | Tên đăng nhập |
| 3 | `email` | VARCHAR(100) | UK | Có | Địa chỉ Email (Dùng để lấy lại mật khẩu) |
| 4 | `password_hash`| VARCHAR(255) | | Có | Mật khẩu đã được mã hóa Bcrypt |
| 5 | `role_id` | INTEGER | FK | Có | Phân quyền, trỏ đến `roles(id)` |
| 6 | `tier` | VARCHAR(50) | | Không | Thứ hạng (VD: Bronze, Silver, Gold) |
| 7 | `learning_purpose`| VARCHAR(150) | | Không | Mục tiêu học (Giao tiếp, Thi IELTS...) |
| 8 | `created_at` | TIMESTAMPTZ| | Có | Thời điểm đăng ký tài khoản |

---

## PHẦN 2: HỆ THỐNG CHỦ ĐỀ VÀ TỪ ĐIỂN CỐT LÕI

### 2.1 Bảng `topics` (Chủ đề học tập)
*Mô tả: Phân loại từ vựng và bài thi thành các nhóm chủ đề/lộ trình.*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã định danh chủ đề |
| 2 | `title` | VARCHAR(100) | | Có | Tên chủ đề (VD: 'Workplace', 'Travel') |
| 3 | `description` | TEXT | | Không | Giới thiệu nội dung chủ đề |
| 4 | `order_index` | INTEGER | | Có | Số thứ tự sắp xếp trên giao diện |
| 5 | `difficulty` | VARCHAR(20) | | Có | Độ khó (BEGINNER, INTERMEDIATE...) |

### 2.2 Bảng `words` (Từ vựng học thuật)
*Mô tả: Kho từ vựng được liên kết với Chủ đề để sinh Flashcard.*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã định danh từ vựng |
| 2 | `word` | VARCHAR(150) | UK | Có | Chữ tiếng Anh (Cần đánh Index LOWER) |
| 3 | `pronunciation`| VARCHAR(150) | | Không | Cách phát âm (Phiên âm quốc tế IPA) |
| 4 | `part_of_speech`| VARCHAR(100) | | Không | Từ loại (Noun, Verb, Adjective...) |
| 5 | `meaning_vi` | TEXT | | Có | Nghĩa tiếng Việt |
| 6 | `topic_id` | INTEGER | FK | Có | Trỏ đến `topics(id)` |
| 7 | `isExternal` | BOOLEAN | | Có | Đánh dấu lấy từ API ngoài hay DB gốc |

### 2.3 Bảng `dictionary_vi` (Từ điển tĩnh)
*Mô tả: Bảng hỗ trợ tra từ điển Anh - Việt độc lập (có thể nhập lượng lớn dữ liệu).*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã định danh |
| 2 | `word` | VARCHAR(150) | | Có | Từ tiếng Anh |
| 3 | `detail` | TEXT | | Có | Chi tiết giải nghĩa, ví dụ, đồng nghĩa |

### 2.4 Bảng `idioms` (Thành ngữ)
*Mô tả: Quản lý các cụm thành ngữ độc lập để người dùng tra cứu.*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã định danh |
| 2 | `idiom` | VARCHAR(150) | | Có | Cụm thành ngữ (VD: 'Break a leg') |
| 3 | `meaning` | TEXT | | Có | Giải nghĩa cụm từ |
| 4 | `example` | TEXT | | Không | Câu ví dụ minh họa |

---

## PHẦN 3: HOẠT ĐỘNG HỌC TẬP & GAMIFICATION

### 3.1 Bảng `flashcards` (Tiến độ học từ vựng)
*Mô tả: Ghi nhận mức độ thuộc từ (Spaced Repetition) của từng người dùng.*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã định danh thẻ |
| 2 | `user_id` | INTEGER | FK, UK1| Có | Trỏ tới người dùng |
| 3 | `word_id` | INTEGER | FK, UK1| Có | Trỏ tới từ vựng đang học |
| 4 | `topic_id` | INTEGER | FK | Có | Trỏ tới chủ đề chứa từ |
| 5 | `status` | VARCHAR(20) | | Có | Trạng thái học (NEW, LEARNING, MASTERED) |
| 6 | `last_reviewed`| TIMESTAMPTZ| | Không | Thời điểm ôn tập gần nhất |
| 7 | `created_at` | TIMESTAMPTZ| | Có | Ngày cấp thẻ |
*(Lưu ý: Constraint UNIQUE ghép trên `user_id` và `word_id`)*

### 3.2 Bảng `streak_logs` (Nhật ký chuỗi ngày học)
*Mô tả: Phục vụ hệ thống Gamification, ghi nhận mỗi ngày đăng nhập/học.*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã định danh log |
| 2 | `user_id` | INTEGER | FK, UK1| Có | Trỏ tới `users(id)` |
| 3 | `activity_date`| DATE | UK1| Có | Ngày có hoạt động học tập |
| 4 | `timezone_offset`| INTEGER | | Có | Độ lệch múi giờ để tính Streak chuẩn xác |
*(Lưu ý: Constraint UNIQUE ghép trên `user_id` và `activity_date` để chống lưu lặp)*

---

## PHẦN 4: HỆ THỐNG THI TRẮC NGHIỆM CHỐNG GIAN LẬN

### 4.1 Bảng `exams` (Danh sách đề thi)
*Mô tả: Thông tin tổng quan của một đề thi trắc nghiệm.*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã đề thi |
| 2 | `topic_id` | INTEGER | FK | Không | Đề thi thuộc chủ đề nào (Null nếu là Placement Test) |
| 3 | `title` | VARCHAR(150) | | Có | Tiêu đề bài thi |
| 4 | `duration` | INTEGER | | Có | Thời gian làm bài tối đa (Tính bằng giây/phút) |
| 5 | `exam_type` | VARCHAR(20) | | Có | Loại đề thi (TOPIC, PLACEMENT) |
| 6 | `created_at` | TIMESTAMPTZ| | Có | Ngày tạo đề |

### 4.2 Bảng `questions` (Kho câu hỏi)
*Mô tả: Lưu trữ nội dung câu hỏi và 4 đáp án A,B,C,D.*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã câu hỏi |
| 2 | `exam_id` | INTEGER | FK | Có | Trỏ đến `exams(id)` |
| 3 | `question_text`| TEXT | | Có | Nội dung câu hỏi |
| 4 | `option_a` | TEXT | | Có | Đáp án A |
| 5 | `option_b` | TEXT | | Có | Đáp án B |
| 6 | `option_c` | TEXT | | Có | Đáp án C |
| 7 | `option_d` | TEXT | | Có | Đáp án D |
| 8 | `correct_option`| CHAR(1) | | Có | Đáp án đúng ('A', 'B', 'C', 'D') |

### 4.3 Bảng `exam_sessions` (Phiên làm bài - Anti-cheat)
*Mô tả: Được tạo ra ngay khi User ấn "Bắt đầu làm bài" để đếm ngược trên Server.*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã phiên thi |
| 2 | `exam_id` | INTEGER | FK | Có | Đề thi đang làm |
| 3 | `user_id` | INTEGER | FK | Có | Người đang làm bài |
| 4 | `started_at` | TIMESTAMPTZ| | Có | Thời điểm Server ghi nhận bắt đầu |
| 5 | `submitted_at` | TIMESTAMPTZ| | Không | Thời điểm nộp bài (Sẽ update sau) |
| 6 | `status` | VARCHAR(20) | | Có | Trạng thái (IN_PROGRESS, SUBMITTED, CANCELLED) |

### 4.4 Bảng `exam_answers` (Lựa chọn của học viên)
*Mô tả: Ghi lại hành vi chọn đáp án cho từng câu để sau này review lại.*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã bản ghi |
| 2 | `session_id` | INTEGER | FK, UK1| Có | Thuộc về Phiên thi nào |
| 3 | `question_id` | INTEGER | FK, UK1| Có | Trả lời cho câu hỏi nào |
| 4 | `selected_option`| CHAR(1) | | Không | Đáp án User đã chọn ('A','B','C','D'). Null nếu bỏ trống. |
*(Lưu ý: Constraint UNIQUE ghép trên `session_id` và `question_id`)*

### 4.5 Bảng `exam_results` (Kết quả thi chốt)
*Mô tả: Lưu trữ kết quả điểm số và thời gian thực tế sau khi tính toán.*
| STT | Tên cột (Column) | Kiểu dữ liệu | Khóa | Bắt buộc (Not Null) | Giải thích ý nghĩa |
| :--- | :--- | :--- | :---: | :---: | :--- |
| 1 | `id` | SERIAL | PK | Có | Mã kết quả |
| 2 | `user_id` | INTEGER | FK | Có | Người thi |
| 3 | `exam_id` | INTEGER | FK | Có | Đề thi gốc |
| 4 | `session_id` | INTEGER | FK | Có | Tham chiếu về phiên thi đã tạo ra kết quả này |
| 5 | `score` | NUMERIC(5,2)| | Có | Điểm số đạt được (Phần trăm hoặc hệ 10) |
| 6 | `time_spent` | INTEGER | | Có | Thời gian làm bài (tính bằng Giây) |
| 7 | `submitted_at` | TIMESTAMPTZ| | Có | Thời gian hoàn tất |

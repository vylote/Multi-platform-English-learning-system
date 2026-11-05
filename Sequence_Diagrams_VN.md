# Danh sách Biểu đồ Tuần tự (Sequence Diagrams)

Toàn bộ các biểu đồ dưới đây đã được chuẩn hóa theo ký hiệu UML tiêu chuẩn bao gồm:
- **Actor** (Hình người): Người dùng
- **Boundary** (Hình chữ T tròn): Giao diện người dùng
- **Control** (Hình mũi tên tròn): Hệ thống xử lý logic
- **Entity** (Hình gạch ngang tròn): Cơ sở dữ liệu / Bộ nhớ tạm

*(Đã gỡ bỏ toàn bộ các khung vuông bọc ngoài / khung dọc (activation boxes) và khung dưới cùng (footbox) để biểu đồ trông gọn gàng, giống hình mẫu nhất).*

---

## 1. Luồng Xác thực người dùng (Đăng nhập)

```plantuml
@startuml
hide footbox
skinparam maxMessageSize 150
skinparam ParticipantPadding 20

actor "Học viên" as User
boundary "Giao diện Đăng nhập" as UI
control "Hệ thống Xác thực" as Auth
entity "Cơ sở dữ liệu" as DB
entity "Bộ nhớ tạm (Redis)" as Cache

autonumber

User -> UI : Nhập thông tin đăng nhập (Email, Mật khẩu)
UI -> Auth : Gửi yêu cầu xác thực tài khoản
Auth -> DB : Yêu cầu kiểm tra thông tin tài khoản
DB --> Auth : Trả về thông tin tài khoản

alt Thông tin không hợp lệ
    Auth --> UI : Thông báo sai thông tin đăng nhập
    UI --> User : Hiển thị lỗi trên màn hình
else Thông tin hợp lệ
    Auth -> Auth : Kiểm tra mật khẩu và tạo phiên đăng nhập
    Auth -> Cache : Gửi yêu cầu lưu phiên đăng nhập
    Cache --> Auth : Xác nhận lưu thành công
    Auth --> UI : Trả về thông báo đăng nhập thành công
end

UI --> User : Chuyển hướng vào trang chủ
@enduml
```

---

## 2. Luồng Tra cứu từ điển (Có lưu tạm thời)

```plantuml
@startuml
hide footbox
skinparam maxMessageSize 150
skinparam ParticipantPadding 20

actor "Học viên" as User
boundary "Giao diện Tra từ" as UI
control "Hệ thống Tra cứu" as Dict
entity "Cơ sở dữ liệu Nội bộ" as DB
entity "Bộ nhớ tạm (Redis)" as Cache
control "API Từ điển Ngoài" as ExtAPI

autonumber

User -> UI : Nhập từ vựng cần tra cứu
UI -> Dict : Gửi yêu cầu tra cứu từ vựng
Dict -> DB : Yêu cầu tìm kiếm từ vựng
DB --> Dict : Trả về kết quả tìm kiếm

alt Có sẵn trong CSDL nội bộ
    Dict --> UI : Trả về chi tiết từ vựng
else Không có trong CSDL nội bộ
    Dict -> Cache : Kiểm tra từ vựng trong bộ nhớ tạm
    Cache --> Dict : Trả về kết quả từ bộ nhớ tạm
    
    alt Có trong bộ nhớ tạm
        Dict --> UI : Trả về chi tiết từ vựng
    else Không có trong bộ nhớ tạm
        Dict -> ExtAPI : Gửi yêu cầu lấy nghĩa của từ
        ExtAPI --> Dict : Trả về dữ liệu từ vựng
        Dict -> Cache : Yêu cầu lưu dữ liệu từ vựng vào bộ nhớ
        Cache --> Dict : Xác nhận lưu thành công
        Dict --> UI : Trả về chi tiết từ vựng
    end
end

UI --> User : Hiển thị chi tiết từ vựng cho học viên
@enduml
```

---

## 3. Luồng Học từ vựng (Cập nhật tiến độ Flashcard & Bắn sự kiện Kafka)

```plantuml
@startuml
hide footbox
skinparam maxMessageSize 150
skinparam ParticipantPadding 20

actor "Học viên" as User
boundary "Giao diện Học từ" as UI
control "Hệ thống Học tập" as System
entity "Cơ sở dữ liệu" as DB
control "Hàng đợi Kafka (Broker)" as Kafka
control "Tiến trình nền (Kafka Consumer)" as Worker

autonumber

User -> UI : Đánh dấu trạng thái thẻ từ (Mastered / Review)
UI -> System : Gửi yêu cầu cập nhật trạng thái thẻ từ
System -> DB : Yêu cầu lấy thông tin thẻ từ hiện tại
DB --> System : Trả về thông tin thẻ từ

alt Thẻ từ không hợp lệ
    System --> UI : Thông báo lỗi không tìm thấy thẻ
    UI --> User : Hiển thị thông báo lỗi trên màn hình
else Thẻ từ hợp lệ
    System -> System : Kiểm tra tính hợp lệ và cập nhật cấp độ thẻ
    System -> DB : Cập nhật trạng thái và thời gian ôn tập mới
    DB --> System : Xác nhận cập nhật thành công
    
    System -> Kafka : Bắn sự kiện học từ vựng (Topic: vocab.learning.events)
    Kafka --> System : Xác nhận đã tiếp nhận sự kiện (Bất đồng bộ)
    
    System --> UI : Trả về thông báo cập nhật thành công
    
    Kafka -> Worker : Phân phối sự kiện đến smart-flashcard-enqueue-group
    Worker -> Worker : Tính toán chu kỳ lặp lại ngắt quãng (SRS)
    Worker -> DB : Cập nhật lịch trình ôn tập thông minh
end

UI --> User : Cập nhật lại giao diện thẻ từ
@enduml
```

---

## 4. Luồng Chuỗi ngày học (Tự động cập nhật qua Kafka & Hiển thị Streak)

```plantuml
@startuml
hide footbox
skinparam maxMessageSize 150
skinparam ParticipantPadding 20

actor "Học viên" as User
boundary "Giao diện Trang chủ" as UI
control "Hệ thống Tiến độ" as System
entity "Bộ nhớ tạm (Redis)" as Cache
entity "Cơ sở dữ liệu" as DB
control "Hàng đợi Kafka (Broker)" as Kafka
control "Tiến trình nền (streak-tracker-group)" as Worker

autonumber

== Phần 1: Tự động ghi nhận Streak qua sự kiện Kafka ==
Kafka -> Worker : Phân phối sự kiện hoàn thành (Topic: learning.activity.completed)
Worker -> DB : Yêu cầu lấy lịch sử hoạt động và múi giờ học viên
DB --> Worker : Trả về ngày học gần nhất và chuỗi streak hiện tại

alt Đã ghi nhận trong ngày hôm nay
    Worker -> Worker : Giữ nguyên chuỗi ngày học hiện tại
else Học liên tiếp so với ngày hôm trước
    Worker -> DB : Cập nhật tăng chuỗi ngày học lên 1
    DB --> Worker : Xác nhận cập nhật thành công
else Bị ngắt quãng (Không học ngày hôm trước)
    Worker -> DB : Đặt lại chuỗi ngày học về 1
    DB --> Worker : Xác nhận cập nhật thành công
end

Worker -> Cache : Lưu trạng thái Streak mới vào bộ nhớ tạm (TTL 24 giờ)
Cache --> Worker : Xác nhận lưu thành công

== Phần 2: Học viên xem tiến độ Streak trên giao diện ==
User -> UI : Truy cập vào ứng dụng học tập
UI -> System : Gửi yêu cầu lấy trạng thái chuỗi ngày học
System -> Cache : Kiểm tra thông tin Streak trong bộ nhớ tạm
Cache --> System : Trả về thông tin chuỗi ngày học tức thời
System --> UI : Trả về trạng thái chuỗi ngày học (Số ngày, trạng thái hôm nay)
UI --> User : Hiển thị trực quan chuỗi ngày học trên màn hình
@enduml
```

---

## 5. Luồng Luyện đề trắc nghiệm (Nộp bài, Chống gian lận & Phân tích AI qua Kafka)

```plantuml
@startuml
hide footbox
skinparam maxMessageSize 150
skinparam ParticipantPadding 20

actor "Học viên" as User
boundary "Giao diện Bài thi" as UI
control "Hệ thống Luyện thi" as System
entity "Bộ nhớ tạm (Redis)" as Cache
entity "Cơ sở dữ liệu" as DB
control "Hàng đợi Kafka (Broker)" as Kafka
control "Tiến trình nền (Kafka Consumers)" as Worker
control "Dịch vụ Trí tuệ Nhân tạo (AI)" as AI

autonumber

User -> UI : Bấm nút nộp bài thi
UI -> System : Gửi đáp án và nhật ký hành vi trong lúc thi
System -> Cache : Yêu cầu lấy thông tin thời gian bắt đầu phiên thi
Cache --> System : Trả về thông tin phiên thi

alt Đã vượt quá thời gian quy định (Hết giờ)
    System --> UI : Thông báo lỗi nộp bài quá giờ quy định
    UI --> User : Hiển thị thông báo bài thi bị hủy
else Phát hiện hành vi gian lận (Chuyển tab quá số lần)
    System -> DB : Lưu kết quả với trạng thái vi phạm quy chế
    DB --> System : Xác nhận lưu thành công
    System --> UI : Thông báo vi phạm quy chế thi
    UI --> User : Hiển thị thông báo hủy kết quả do gian lận
else Bài thi hoàn toàn hợp lệ
    System -> System : Tiến hành chấm điểm dựa trên ngân hàng đáp án
    System -> DB : Lưu điểm số và các câu trả lời chi tiết
    DB --> System : Xác nhận lưu thành công
    
    System -> Kafka : Bắn sự kiện nộp bài (Topic: exam.submissions)
    System -> Kafka : Bắn sự kiện hoạt động học tập (Topic: learning.activity.completed)
    
    System --> UI : Trả về điểm số và kết quả bài thi ngay lập tức
    UI --> User : Hiển thị điểm số và đáp án chi tiết
    
    par Xử lý ngầm qua Kafka Consumer 1
        Kafka -> Worker : Phân phối sự kiện nộp bài đến exam-ai-evaluation-group
        Worker -> AI : Gửi danh sách các câu làm sai để phân tích
        AI --> Worker : Trả về tóm tắt lỗi sai và lời khuyên cá nhân hóa
        Worker -> Cache : Lưu AI Feedback vào bộ nhớ tạm (Cache 7 ngày)
    else Xử lý ngầm qua Kafka Consumer 2
        Kafka -> Worker : Phân phối sự kiện hoạt động đến gamification-exp-group
        Worker -> Worker : Tính điểm kinh nghiệm (EXP) tích lũy
        Worker -> DB : Cập nhật tổng EXP cho học viên
    end
end
@enduml
```

---

## 6. Luồng Lộ trình học tập (Tính toán Tiến độ & Mở khóa Chủ đề)

```plantuml
@startuml
hide footbox
skinparam maxMessageSize 150
skinparam ParticipantPadding 20

actor "Học viên" as User
boundary "Giao diện Lộ trình" as UI
control "Hệ thống Lộ trình" as System
entity "Cơ sở dữ liệu" as DB

autonumber

User -> UI : Truy cập trang lộ trình học tập
UI -> System : Yêu cầu lấy danh sách chủ đề và tiến độ học tập
System -> DB : Lấy toàn bộ danh sách chủ đề theo mục tiêu học viên
DB --> System : Trả về danh sách chủ đề đã sắp xếp thứ tự

loop Duyệt qua từng chủ đề trong danh sách
    System -> DB : Lấy điểm bài học cao nhất, điểm bài thi và số từ đã thuộc
    DB --> System : Trả về chỉ số tiến độ (bestLessonScore, bestExamScore, masteredWords)
    
    System -> System : Tính mức độ thành thạo của chủ đề (masteryPercent)
    
    alt Là chủ đề đầu tiên trong lộ trình
        System -> System : Đánh dấu trạng thái "Mở khóa" (isUnlocked = true)
    else Là các chủ đề kế tiếp
        alt Chủ đề liền trước đạt chuẩn (Đáp ứng TẤT CẢ: Bài học >= 80% VÀ Bài thi >= 8.0 VÀ Độ thành thạo >= 70%)
            System -> System : Đánh dấu trạng thái "Mở khóa" cho chủ đề hiện tại
        else Chủ đề liền trước chưa hoàn thành đủ tất cả yêu cầu
            System -> System : Giữ trạng thái "Khóa" (Yêu cầu hoàn thành bài học và bài thi của chủ đề trước)
        end
    end
end

System --> UI : Trả về danh sách chủ đề kèm trạng thái đóng/mở và % tiến độ
UI --> User : Hiển thị bản đồ lộ trình học tập trực quan
@enduml
```

---

## 7. Luồng Hoàn thành Bài học Chủ đề & Sinh trước câu hỏi AI qua Kafka

```plantuml
@startuml
hide footbox
skinparam maxMessageSize 150
skinparam ParticipantPadding 20

actor "Học viên" as User
boundary "Giao diện Bài học" as UI
control "Hệ thống Bài học" as System
entity "Bộ nhớ tạm (Redis)" as Cache
entity "Cơ sở dữ liệu" as DB
control "Hàng đợi Kafka (Broker)" as Kafka
control "Tiến trình nền (Kafka Consumers)" as Worker
control "Dịch vụ Trí tuệ Nhân tạo (Groq AI)" as AI

autonumber

User -> UI : Bấm nút hoàn thành bài học (10 câu trắc nghiệm & 10 từ phát âm)
UI -> System : Gửi kết quả trắc nghiệm và kết quả phát âm
System -> Cache : Lấy phiên câu hỏi trắc nghiệm đã sinh
Cache --> System : Trả về danh sách câu hỏi kèm đáp án đúng

System -> System : Chấm điểm tích cực theo số câu trả lời đúng (Mỗi câu +10%)
System -> DB : Lưu kết quả lượt học vào bảng lesson_attempts
DB --> System : Xác nhận lưu thành công

System -> Kafka : Bắn sự kiện hoàn thành (Topic: learning.activity.completed)
System -> Kafka : Bắn sự kiện từ vựng yếu nếu có sai sót (Topic: vocab.learning.events)

System --> UI : Trả về kết quả bài học (Điểm trắc nghiệm, phát âm, tổng điểm)
UI --> User : Hiển thị bảng điểm và trạng thái mở khóa chủ đề tiếp theo

par Tiến trình nền 1: Sinh trước câu hỏi AI cho chủ đề tiếp theo
    Kafka -> Worker : Phân phối sự kiện đến lesson-ai-pregen-group
    Worker -> DB : Kiểm tra các từ vựng của chủ đề kế tiếp chưa có câu hỏi
    DB --> Worker : Trả về danh sách từ vựng còn thiếu câu hỏi
    
    opt Có từ vựng chưa có câu hỏi AI
        Worker -> AI : Yêu cầu sinh câu hỏi ngữ cảnh tiếng Anh chuẩn Cambridge
        AI --> Worker : Trả về danh sách câu hỏi trắc nghiệm ngữ cảnh mới
        Worker -> DB : Lưu câu hỏi vào bảng word_questions (Bộ đệm vĩnh viễn)
        DB --> Worker : Xác nhận lưu thành công
    end
else Tiến trình nền 2: Thu thập từ vựng yếu & Lập lịch SRS
    Kafka -> Worker : Phân phối sự kiện đến smart-flashcard-enqueue-group
    Worker -> DB : Cập nhật trạng thái thẻ từ sang cần ôn tập (Status: LEARNING)
    DB --> Worker : Xác nhận cập nhật thành công
end
@enduml
```

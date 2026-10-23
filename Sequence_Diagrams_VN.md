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

## 3. Luồng Học từ vựng (Cập nhật tiến độ Flashcard)

```plantuml
@startuml
hide footbox
skinparam maxMessageSize 150
skinparam ParticipantPadding 20

actor "Học viên" as User
boundary "Giao diện Học từ" as UI
control "Hệ thống Học tập" as System
entity "Cơ sở dữ liệu" as DB

autonumber

User -> UI : Đánh dấu đã thuộc thẻ từ (Mastered)
UI -> System : Gửi yêu cầu cập nhật trạng thái thẻ từ
System -> DB : Yêu cầu lấy thông tin thẻ từ hiện tại
DB --> System : Trả về thông tin thẻ từ

alt Thẻ từ không hợp lệ
    System --> UI : Thông báo lỗi không tìm thấy thẻ
    UI --> User : Hiển thị lỗi trên màn hình
else Thẻ từ hợp lệ
    System -> System : Kiểm tra tính hợp lệ của việc đổi trạng thái
    System -> DB : Yêu cầu cập nhật trạng thái và thời gian ôn tập
    DB --> System : Xác nhận cập nhật thành công
    System --> UI : Trả về thông báo thành công
end

UI --> User : Cập nhật lại giao diện thẻ từ
@enduml
```

---

## 4. Luồng Chuỗi ngày học (Ghi nhận hoạt động - Streak)

```plantuml
@startuml
hide footbox
skinparam maxMessageSize 150
skinparam ParticipantPadding 20

actor "Học viên" as User
boundary "Giao diện Trang chủ" as UI
control "Hệ thống Tiến độ" as System
entity "Cơ sở dữ liệu" as DB

autonumber

User -> UI : Truy cập vào ứng dụng học tập
UI -> System : Gửi yêu cầu ghi nhận hoạt động trong ngày
System -> DB : Yêu cầu lấy thời gian học gần nhất
DB --> System : Trả về lịch sử hoạt động
System -> System : So sánh ngày hiện tại và ngày học gần nhất

alt Đã ghi nhận trong ngày hôm nay
    System --> UI : Trả về chuỗi ngày học hiện tại (không đổi)
else Có học vào ngày hôm qua (Liên tiếp)
    System -> DB : Yêu cầu tăng chuỗi ngày học lên 1
    DB --> System : Xác nhận cập nhật thành công
    System --> UI : Trả về chuỗi ngày học mới (được cộng dồn)
else Không học vào ngày hôm qua (Đứt đoạn)
    System -> DB : Yêu cầu đặt lại chuỗi ngày học về 1
    DB --> System : Xác nhận cập nhật thành công
    System --> UI : Trả về chuỗi ngày học mới (bắt đầu lại từ đầu)
end

UI --> User : Hiển thị biểu đồ chuỗi ngày học
@enduml
```

---

## 5. Luồng Luyện đề trắc nghiệm (Nộp bài & Chống gian lận)

```plantuml
@startuml
hide footbox
skinparam maxMessageSize 150
skinparam ParticipantPadding 20

actor "Học viên" as User
boundary "Giao diện Bài thi" as UI
control "Hệ thống Luyện thi" as System
entity "Bộ nhớ tạm (Lưu phiên)" as Cache
entity "Cơ sở dữ liệu" as DB

autonumber

User -> UI : Bấm nút nộp bài thi
UI -> System : Gửi đáp án và nhật ký hành vi trong lúc thi
System -> Cache : Yêu cầu lấy thông tin thời gian bắt đầu
Cache --> System : Trả về thông tin phiên thi

alt Đã vượt quá thời gian quy định (Hết giờ)
    System --> UI : Thông báo lỗi nộp bài quá giờ
    UI --> User : Hiển thị thông báo bài thi bị hủy
else Phát hiện hành vi gian lận (Chuyển tab)
    System -> DB : Yêu cầu lưu kết quả với trạng thái "Gian lận"
    DB --> System : Xác nhận lưu thành công
    System --> UI : Thông báo vi phạm quy chế thi
    UI --> User : Hiển thị thông báo hủy kết quả do gian lận
else Bài thi hoàn toàn hợp lệ
    System -> System : Tiến hành chấm điểm dựa trên đáp án đúng
    System -> DB : Yêu cầu lưu điểm số và trạng thái hoàn thành
    DB --> System : Xác nhận lưu thành công
    System --> UI : Trả về chi tiết kết quả bài thi
    UI --> User : Hiển thị điểm số và chi tiết đáp án
end
@enduml
```

---

## 6. Luồng Lộ trình học tập (Tính toán & Mở khóa Chủ đề)

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
UI -> System : Yêu cầu lấy danh sách chủ đề và tiến độ
System -> DB : Yêu cầu lấy toàn bộ danh sách chủ đề
DB --> System : Trả về danh sách chủ đề

loop Duyệt qua từng chủ đề trong danh sách
    System -> DB : Yêu cầu đếm số từ vựng đã thuộc
    DB --> System : Trả về số lượng từ vựng
    
    System -> DB : Yêu cầu lấy điểm số bài thi cao nhất
    DB --> System : Trả về điểm số bài thi
    
    System -> System : Tính toán mức độ thành thạo của chủ đề
    
    alt Là chủ đề đầu tiên trong lộ trình
        System -> System : Đánh dấu chủ đề ở trạng thái "Mở khóa"
    else Là các chủ đề tiếp theo
        System -> System : Kiểm tra mức độ thành thạo của chủ đề trước (>= 60%) để quyết định mở khóa
    end
end

System --> UI : Trả về danh sách chủ đề kèm trạng thái đóng/mở
UI --> User : Hiển thị bản đồ lộ trình học tập
@enduml
```

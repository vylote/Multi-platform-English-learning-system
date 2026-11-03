# Kiến Trúc Apache Kafka & Bảng So Sánh Với RabbitMQ

## 1. Kiến Trúc Cơ Bản & Thuật Ngữ Trong Apache Kafka

Apache Kafka là một nền tảng stream dữ liệu phân tán mã nguồn mở, được tối ưu hóa cho việc xử lý luồng dữ liệu thời gian thực với độ tin cậy và khả năng chịu lỗi cao.

### Giải Thích Các Thuật Ngữ Kiến Trúc:

* **Kafka Cluster**: Là một tập hợp gồm nhiều máy chủ (server) Kafka hoạt động cùng nhau để lưu trữ và xử lý dữ liệu luồng.
* **Broker**: Mỗi máy chủ (server) nằm trong Kafka Cluster được gọi là một Broker. Broker đóng vai trò cầu nối trung chuyển tin nhắn giữa Producer và Consumer.
* **Zookeeper**: Thành phần chịu trách nhiệm quản lý, điều phối và bố trí các Broker trong Kafka Cluster, duy trì trạng thái của cụm.
* **Producer**: Ứng dụng xuất bản (publish) dữ liệu/thông điệp vào các Topic trong Kafka Cluster dưới dạng mảng byte.
* **Consumer**: Ứng dụng đăng ký (subscribe) vào các Topic để nhận và tiêu thụ dữ liệu tin nhắn.
* **Consumer Group**: Tập hợp các Consumer cùng xử lý dữ liệu cho một Topic cụ thể. Mỗi Consumer trong group sẽ đảm nhận đọc dữ liệu từ một Partition riêng biệt để đảm bảo xử lý song song.
* **Topic**: Danh mục hoặc chủ đề được dùng để phân loại dữ liệu truyền trong Kafka.
* **Partition**: Phân đoạn chia nhỏ của một Topic. Dữ liệu trong Partition được lưu trữ cố định trên đĩa cứng và gán ID thứ tự gọi là Offset. Các Partition được phân tán và sao chép (replicate) giữa các Broker dưới dạng Leader và Follower để đảm bảo tính chịu lỗi.
* **Messages**: Đơn vị dữ liệu được truyền đi dưới dạng mảng byte (byte array), thường là String, JSON hoặc Avro.

---

## 2. Bảng So Sánh Kiến Trúc Apache Kafka và RabbitMQ

| Tiêu chí so sánh | Apache Kafka | RabbitMQ |
| :--- | :--- | :--- |
| **Mô hình kiến trúc** | Kết hợp mô hình hàng đợi và Publish/Subscribe dựa trên bản ghi phân vùng (Partitioned Log). | Sử dụng mô hình hàng đợi tin nhắn truyền thống (Message Queue). |
| **Cơ chế lưu giữ tin nhắn (Retention)** | Tin nhắn được ghi vào đĩa và lưu giữ theo chính sách thời gian (Retention period), có thể đọc/phát lại (replay). | Dựa trên xác nhận (Acknowledgment); tin nhắn mặc định sẽ bị xóa sau khi Consumer tiêu thụ thành công. |
| **Khả năng mở rộng (Scalability)** | Phân chia Partition phân tán trên các Broker, giúp mở rộng dung lượng và đạt băng thông cực lớn (High-throughput). | Tăng số lượng Consumer xử lý trên hàng đợi để tăng quy mô theo phiên bản. |
| **Xử lý nhiều Consumer** | Cho phép nhiều Consumer/Consumer Group cùng đăng ký đọc lại một luồng tin nhắn độc lập. | Mỗi tin nhắn chỉ gửi cho 1 Consumer duy nhất; không hỗ trợ nhiều bên cùng nhận tin nhắn trên một hàng đợi. |
| **Sao chép chịu lỗi (Replication)** | Tự động sao chép (replicate) các Topic/Partition trên các máy chủ Broker trong Cluster. | Không tự động sao chép tin nhắn, phải cấu hình thủ công. |
| **Thứ tự tin nhắn (Message Ordering)** | Đảm bảo thứ tự tin nhắn chính xác theo trình tự trong từng Partition. | Gửi tin nhắn đến Consumer theo thứ tự vào hàng đợi; nếu có nhiều Consumer cạnh tranh thì mỗi bên xử lý một tập con. |
| **Giao thức kết nối** | Sử dụng giao thức nhị phân riêng tối ưu trên nền TCP. | Sử dụng giao thức AMQP (Advanced Message Queuing Protocol), hỗ trợ thêm MQTT, STOMP qua plugin. |

-- ==============================================================================
-- SEED 36 CHỦ ĐỀ HỌC TẬP (TOPICS) & MỤC TIÊU ƯU TIÊN (TOPIC_GOAL_PRIORITY)
-- ==============================================================================

-- 1. Chèn danh mục 36 Topics chuẩn với ID cố định, Độ khó và Thứ tự Lộ trình
INSERT INTO topics (id, title, description, difficulty, order_index) VALUES
-- CẤP ĐỘ 1: BEGINNER (1 -> 12)
(1, 'Food & Drink', 'đồ ăn, thức ăn, món ăn, nấu ăn, nhà hàng, thực phẩm, hoa quả, rau củ, gia vị, bữa ăn, đồ uống, thực đơn, gọi món, tiền tip, ăn chay, công thức nấu ăn, tiệc tùng, hương vị, dinh dưỡng', 'BEGINNER', 1),
(2, 'Travel & Transport', 'du lịch, đi lại, giao thông, sân bay, khách sạn, hộ chiếu, vé máy bay, hành lý, chuyến đi, xe cộ, đặt phòng, hỏi đường, hoãn chuyến, quá cảnh, bản đồ, ga tàu, hải quan, tham quan', 'BEGINNER', 2),
(3, 'Family & Relationships', 'gia đình, cha mẹ, con cái, anh chị em, họ hàng, người thân, hôn nhân, bạn bè, mối quan hệ, hẹn hò, thơ ấu, nuôi dạy, ly hôn, họp mặt, hàng xóm, tổ tiên, thế hệ, tình bạn', 'BEGINNER', 3),
(4, 'Sports & Entertainment', 'thể thao, bóng đá, vận động, thi đấu, giải trí, âm nhạc, nghệ thuật, phim ảnh, trò chơi, nhạc cụ, rạp phim, người hâm mộ, hòa nhạc, nhiếp ảnh, giải đấu, vận động viên, sở thích, truyền hình', 'BEGINNER', 4),
(5, 'Actions & States', 'hành động, trạng thái, chuyển động, dừng lại, bắt đầu, kết thúc, thay đổi, di chuyển, thường nhật, thói quen, kế hoạch, trì hoãn, hoàn thành, hủy bỏ, duy trì, thực hiện, tồn tại', 'BEGINNER', 5),
(6, 'Shopping & Fashion', 'mua sắm, thời trang, quần áo, giày dép, cửa hàng, trung tâm thương mại, giảm giá, hóa đơn, hoàn tiền, thử đồ, xu hướng, phụ kiện, chất liệu, thương hiệu, giá cả, thanh toán, trực tuyến', 'BEGINNER', 6),
(7, 'Home & Daily Life', 'nhà cửa, đời sống thường nhật, phòng ngủ, phòng khách, nội thất, đồ gia dụng, dọn dẹp, sửa chữa, tiền thuê nhà, lối sống, thói quen sinh hoạt, khu xóm, làm vườn, chung cư, kiến trúc', 'BEGINNER', 7),
(8, 'Time & Seasons', 'thời gian, các mùa, ngày tháng, lịch trình, tương lai, quá khứ, hiện tại, thế kỷ, thập kỷ, giờ giấc, thời hạn, vĩnh viễn, tạm thời, bình minh, hoàng hôn, múi giờ, lễ hội', 'BEGINNER', 8),
(9, 'Numbers & Measurement', 'con số, đo lường, kích thước, chiều dài, trọng lượng, số lượng, khoảng cách, diện tích, thể tích, tỷ lệ, phần trưng, phép tính, toán học, chiều cao, độ dày, nhiệt độ, mật độ', 'BEGINNER', 9),
(10, 'Colors & Shapes', 'màu sắc, hình khối, hình tròn, hình vuông, hình tam giác, đậm nhạt, hoa văn, kết cấu, độ tương phản, bảng màu, trong suốt, mờ đục, hình trụ, hình chữ nhật, đa giác, sắc thái', 'BEGINNER', 10),
(11, 'Feelings & Senses', 'giác quan, cảm giác, thị giác, thính giác, khứu giác, vị giác, xúc giác, đau đớn, ngứa ngáy, ấm áp, lạnh lẽo, tê dại, nhạy cảm, nhận biết, trực giác, ảo giác', 'BEGINNER', 11),
(12, 'Weather & Atmosphere', 'thời tiết, khí quyển, mây, mưa, gió, bão, nắng, tuyết, sương mù, độ ẩm, áp suất, nhiệt độ, dự báo, sấm sét, cầu vồng, oi bức, lạnh giá, gió mùa', 'BEGINNER', 12),

-- CẤP ĐỘ 2: INTERMEDIATE (13 -> 24)
(13, 'Business & Finance', 'kinh doanh, công ty, thị trường, tài chính, lợi nhuận, hợp đồng, đầu tư, kinh tế, doanh nghiệp, tiền bạc, phỏng vấn, sơ yếu lý lịch, tiền lương, đồng nghiệp, ngân sách, thăng tiến, cổ phiếu, kế toán', 'INTERMEDIATE', 13),
(14, 'Health & Medicine', 'sức khỏe, bệnh tật, bác sĩ, bệnh viện, thuốc, điều trị, cơ thể người, nội tạng, giải phẫu, y tế, triệu chứng, đơn thuốc, hiệu thuốc, thể hình, ăn kiêng, phòng tập, sơ cứu, bảo hiểm', 'INTERMEDIATE', 14),
(15, 'Education & Science', 'giáo dục, học tập, trường học, giáo viên, học sinh, bài tập, kiến thức, thi cử, khoa học, nghiên cứu, học bổng, luận văn, thuyết trình, sinh học, hóa học, vật lý, phòng thí nghiệm, học thuật', 'INTERMEDIATE', 15),
(16, 'Nature & Environment', 'thiên nhiên, động vật, thực vật, cây cối, môi trường, khí hậu, thời tiết, sông núi, vũ trụ, biến đổi khí hậu, tái chế, ô nhiễm, thiên tai, bảo tồn, hệ sinh thái, đa dạng sinh học, năng lượng xanh', 'INTERMEDIATE', 16),
(17, 'Emotions & Personality', 'cảm xúc, tình cảm, tính cách, vui buồn, hạnh phúc, tức giận, lo lắng, yêu thương, tâm lý, tự tin, thất vọng, hướng nội, hướng ngoại, hào hứng, đồng cảm, kiên nhẫn, ghen tị, tâm trạng', 'INTERMEDIATE', 17),
(18, 'Communication & Media', 'giao tiếp, truyền thông, báo chí, mạng xã hội, tin tức, trò chuyện, thảo luận, ngôn ngữ, phát thanh, phỏng vấn, xuất bản, thông điệp, quảng cáo, dư luận, tương tác, tranh luận', 'INTERMEDIATE', 18),
(19, 'Arts & Literature', 'nghệ thuật, văn học, hội họa, điêu khắc, thơ ca, tiểu thuyết, tác giả, triển lãm, bảo tàng, sáng tác, phê bình, kiến trúc, truyện tranh, kịch nghệ, di sản, nguồn cảm hứng', 'INTERMEDIATE', 19),
(20, 'History & Culture', 'lịch sử, văn hóa, cổ đại, khảo cổ, văn minh, thế kỷ trước, truyền thuyết, phong tục, ngày lễ, bản sắc, di tích, bảo tàng, tư liệu, sự kiện lịch sử, triều đại, truyền miệng', 'INTERMEDIATE', 20),
(21, 'Geography & Places', 'địa lý, địa điểm, quốc gia, thành phố, nông thôn, biên giới, bản đồ, châu lục, đại dương, sa mạc, hòn đảo, thung lũng, địa hình, tọa độ, vùng miền, thủ đô, kỳ quan', 'INTERMEDIATE', 21),
(22, 'Work & Professions', 'công việc, nghề nghiệp, sự nghiệp, việc làm, công sở, nhân viên, tuyển dụng, nghỉ hưu, kỹ năng, kinh nghiệm, hồ sơ xin việc, tăng ca, từ chức, lao động, chuyên gia, thực tập', 'INTERMEDIATE', 22),
(23, 'Materials & Substances', 'chất liệu, vật chất, kim loại, nhựa, gỗ, thủy tinh, cao su, vải vóc, hóa chất, chất lỏng, chất rắn, chất khí, thuộc tính, độ bền, kết cấu, hợp chất, nguyên tố', 'INTERMEDIATE', 23),
(24, 'Buildings & Infrastructure', 'tòa nhà, cơ sở hạ tầng, đường xá, cầu cống, công trình, xây dựng, kiến trúc, quy hoạch, đô thị, hệ thống thoát nước, ga tàu, bến cảng, quảng trường, tháp, trung tâm', 'INTERMEDIATE', 24),

-- CẤP ĐỘ 3: ADVANCED (25 -> 36)
(25, 'Technology & IT', 'công nghệ, máy tính, phần mềm, internet, điện tử, kỹ thuật số, thiết bị, phần cứng, mạng, ứng dụng, mật khẩu, trí tuệ nhân tạo, an ninh mạng, lỗi hệ thống, lập trình, dữ liệu, viễn thông', 'ADVANCED', 25),
(26, 'Law & Society', 'pháp luật, chính trị, luật sư, tòa án, tội phạm, cảnh sát, xã hội, tôn giáo, nhà thờ, quyền lợi, thời sự, công dân, từ thiện, bầu cử, phong tục, truyền thống, chính phủ, nhân quyền', 'ADVANCED', 26),
(27, 'Philosophy & Thinking', 'triết học, tư duy, suy nghĩ, logic, quan điểm, lý thuyết, ý thức, nhận thức, niềm tin, giá trị, đạo đức, trí tuệ, phân tích, tưởng tượng, giả thuyết, định kiến, khách quan', 'ADVANCED', 27),
(28, 'Abstract Concepts', 'khái niệm trừu tượng, tự do, công lý, hòa bình, thời gian, không gian, số phận, may mắn, cơ hội, rủi ro, bí ẩn, tiềm năng, nguồn gốc, bản chất, xu hướng, sự phức tạp, cốt lõi', 'ADVANCED', 28),
(29, 'Politics & Government', 'chính trị, chính phủ, nhà nước, đảng phái, bầu cử, chính sách, tổng thống, thủ tướng, quốc hội, ngoại giao, liên minh, biểu tình, trưng cầu dân ý, khủng hoảng, quyền lực', 'ADVANCED', 29),
(30, 'Military & Warfare', 'quân sự, chiến tranh, quân đội, binh lính, vũ khí, chiến thuật, hòa bình, phòng thủ, tấn công, căn cứ, điều ước, hiệp định, xung đột, anh hùng, súng ống, xe tăng, lực lượng', 'ADVANCED', 30),
(31, 'Agriculture & Farming', 'nông nghiệp, trồng trọt, chăn nuôi, nông trại, mùa màng, thu hoạch, đất đai, phân bón, tưới tiêu, gia súc, gia cầm, hạt giống, nông dân, sản lượng, cày cấy, hữu cơ', 'ADVANCED', 31),
(32, 'Industry & Manufacturing', 'công nghiệp, sản xuất, nhà máy, xí nghiệp, nguyên liệu, dây chuyền, máy móc, tự động hóa, cung ứng, phân phối, hàng hóa, năng suất, lao động, kho bãi, bảo trì', 'ADVANCED', 32),
(33, 'Energy & Resources', 'năng lượng, tài nguyên, điện lực, dầu mỏ, than đá, khí đốt, năng lượng mặt trời, gió, hạt nhân, thủy điện, khai thác, tiêu thụ, tiết kiệm, lưới điện, khan hiếm', 'ADVANCED', 33),
(34, 'Religion & Spirituality', 'tôn giáo, tâm linh, tín ngưỡng, thần linh, cầu nguyện, nhà thờ, chùa chiền, thánh đường, kinh thánh, nghi lễ, linh hồn, đức tin, phước lành, thiền định, đạo đức', 'ADVANCED', 34),
(35, 'Crime & Justice', 'tội phạm, công lý, vụ án, xét xử, thẩm phán, nhân chứng, bằng chứng, tù tội, giam giữ, điều tra, bắt giữ, trộm cắp, tham nhũng, phạt tiền, bào chữa, luật sư', 'ADVANCED', 35),
(36, 'Disasters & Emergencies', 'tai nạn, thảm họa, khẩn cấp, cứu hộ, sơ tán, hỏa hoạn, lũ lụt, động đất, dịch bệnh, cứu thương, cứu hỏa, sống sót, thiệt hại, viện trợ, nguy hiểm, cảnh báo', 'ADVANCED', 36)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty,
  order_index = EXCLUDED.order_index;

-- Đồng bộ sequence tự tăng của bảng topics để tránh xung đột khi tạo mới sau này
SELECT setval('topics_id_seq', (SELECT COALESCE(MAX(id), 1) FROM topics));


-- ==============================================================================
-- 2. Nạp liên kết mục tiêu học tập (TOPIC_GOAL_PRIORITY)
-- ==============================================================================

-- DAILY_COMMUNICATION: Giao tiếp đời sống thường nhật
INSERT INTO topic_goal_priority (goal, topic_id)
SELECT 'DAILY_COMMUNICATION', id FROM topics
WHERE title IN (
  'Family & Relationships',
  'Home & Daily Life',
  'Emotions & Personality',
  'Communication & Media',
  'Feelings & Senses',
  'Health & Medicine'
)
ON CONFLICT (goal, topic_id) DO NOTHING;

-- CAREER: Công việc & Phát triển sự nghiệp
INSERT INTO topic_goal_priority (goal, topic_id)
SELECT 'CAREER', id FROM topics
WHERE title IN (
  'Business & Finance',
  'Work & Professions',
  'Communication & Media',
  'Technology & IT',
  'Education & Science',
  'Industry & Manufacturing'
)
ON CONFLICT (goal, topic_id) DO NOTHING;

-- TRAVEL: Du lịch & Khám phá
INSERT INTO topic_goal_priority (goal, topic_id)
SELECT 'TRAVEL', id FROM topics
WHERE title IN (
  'Travel & Transport',
  'Food & Drink',
  'Geography & Places',
  'Weather & Atmosphere',
  'Shopping & Fashion',
  'Buildings & Infrastructure'
)
ON CONFLICT (goal, topic_id) DO NOTHING;

-- HOBBY: Sở thích & Đời sống tinh thần
INSERT INTO topic_goal_priority (goal, topic_id)
SELECT 'HOBBY', id FROM topics
WHERE title IN (
  'Sports & Entertainment',
  'Arts & Literature',
  'Nature & Environment',
  'History & Culture',
  'Colors & Shapes',
  'Philosophy & Thinking'
)
ON CONFLICT (goal, topic_id) DO NOTHING;

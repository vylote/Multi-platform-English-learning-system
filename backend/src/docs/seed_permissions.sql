-- =======================================================
-- 1. NẠP DỮ LIỆU BẢNG ROLES (VAI TRÒ)
-- =======================================================
INSERT INTO roles (code, name, description) VALUES
('ADMIN', 'Quản trị viên', 'Toàn quyền cấu hình hệ thống, quản trị nội dung từ điển, ngân hàng đề thi và quản lý người dùng'),
('STUDENT', 'Học viên', 'Học viên tham gia học từ vựng, quản lý thẻ ghi nhớ cá nhân, đọc thành ngữ và thi trắc nghiệm trực tuyến')
ON CONFLICT (code) DO NOTHING;


-- =======================================================
-- 2. NẠP DỮ LIỆU BẢNG PERMISSIONS (QUYỀN HẠN CHI TIẾT)
-- =======================================================
INSERT INTO permissions (code, name, description) VALUES
-- Nhóm phân quyền Từ điển & Thành ngữ
('VIEW_DICTIONARY', 'Tra cứu từ điển', 'Cho phép tìm kiếm từ vựng và xem định nghĩa chi tiết'),
('MANAGE_WORDS', 'Quản lý từ vựng', 'Cho phép thêm mới, cập nhật hoặc xóa từ vựng trong kho dữ liệu gốc'),
('VIEW_IDIOMS', 'Đọc thành ngữ', 'Cho phép xem cụm thành ngữ mỗi ngày'),
('MANAGE_IDIOMS', 'Quản lý thành ngữ', 'Cho phép thêm mới, sửa đổi hoặc xóa danh sách thành ngữ'),

-- Nhóm phân quyền Học tập & Thẻ ghi nhớ (Flashcards)
('MANAGE_FLASHCARDS', 'Học Flashcards', 'Cho phép thêm từ vựng vào bộ thẻ học cá nhân, cập nhật trạng thái học tập (NEW, LEARNING, MASTERED)'),

-- Nhóm phân quyền Thi cử (Testing Engine)
('TAKE_EXAMS', 'Làm đề thi thử', 'Cho phép truy cập và thực hiện làm đề thi trắc nghiệm trực tuyến có tính giờ'),
('MANAGE_EXAMS', 'Quản lý đề thi', 'Cho phép tạo đề thi mới, chỉnh sửa ngân hàng câu hỏi trắc nghiệm'),
('VIEW_ALL_RESULTS', 'Xem kết quả toàn hệ thống', 'Cho phép xem và thống kê bảng điểm, kết quả thi của tất cả học viên'),

-- Nhóm phân quyền Hệ thống
('MANAGE_USERS', 'Quản trị người dùng', 'Cho phép xem thông tin tài khoản, thay đổi trạng thái hoặc phân bổ lại vai trò hệ thống')
ON CONFLICT (code) DO NOTHING;
-- Kích hoạt extension UUID nếu cần dùng ở môi trường phân tán
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================================================
-- 1. BẢNG ROLES: Quản lý danh sách các vai trò hệ thống
-- =======================================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,       -- e.g., 'ADMIN', 'STUDENT'
    name VARCHAR(100) NOT NULL,              -- e.g., 'Quản trị viên', 'Học viên'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- 2. BẢNG PERMISSIONS: Định nghĩa các quyền hạn chi tiết
-- =======================================================
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,      -- e.g., 'MANAGE_EXAMS', 'READ_DICTIONARY'
    name VARCHAR(150) NOT NULL,              -- e.g., 'Quản lý đề thi', 'Tra cứu từ điển'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- 3. BẢNG ROLE_PERMISSIONS: Quan hệ Nhiều - Nhiều (N - N) giữa Roles và Permissions
-- =======================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- =======================================================
-- 4. BẢNG USERS: Mỗi User gắn với đúng 1 Role
-- Nếu Role bị xoá -> xoá luôn tài khoản User thuộc Role đó (ON DELETE CASCADE)
-- =======================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- 5. BẢNG WORDS: Kho từ vựng dùng chung cho từ điển & học tập
-- =======================================================
CREATE TABLE IF NOT EXISTS words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(100) NOT NULL,
    pronunciation VARCHAR(100),
    part_of_speech VARCHAR(30),
    definition TEXT NOT NULL,
    example_sentence TEXT
);
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);

-- =======================================================
-- 6. BẢNG IDIOMS: Thành ngữ tiếng Anh (Đọc tĩnh - Cached Redis)
-- =======================================================
CREATE TABLE IF NOT EXISTS idioms (
    id SERIAL PRIMARY KEY,
    idiom VARCHAR(150) NOT NULL,
    meaning TEXT NOT NULL,
    example TEXT
);

-- =======================================================
-- 7. BẢNG TOPICS: Phân nhóm chủ đề học tập và lộ trình
-- =======================================================
CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT
);

-- =======================================================
-- 8. BẢNG FLASHCARDS: Tiến trình học tập (Bảng nối đa chiều động)
-- =======================================================
CREATE TABLE IF NOT EXISTS flashcards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'LEARNING', 'MASTERED')),
    last_reviewed TIMESTAMPTZ,
    CONSTRAINT uq_user_word UNIQUE(user_id, word_id)
);

-- =======================================================
-- 9. BẢNG STREAK_LOGS: Ghi nhận lịch sử chuỗi ngày học liên tục
-- =======================================================
CREATE TABLE IF NOT EXISTS streak_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    timezone_offset INTEGER NOT NULL,
    CONSTRAINT uq_user_activity UNIQUE(user_id, activity_date)
);

-- =======================================================
-- 10. BẢNG EXAMS: Danh sách đề thi trắc nghiệm có tính giờ
-- =======================================================
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    duration INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- 11. BẢNG QUESTIONS: Danh sách câu hỏi trắc nghiệm chi tiết
-- =======================================================
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D'))
);

-- =======================================================
-- 12. BẢNG EXAM_RESULTS: Kết quả và thời gian làm bài chống gian lận
-- =======================================================
CREATE TABLE IF NOT EXISTS exam_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL,
    time_spent INTEGER NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
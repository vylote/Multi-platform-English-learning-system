-- Kích hoạt tiện ích tạo mã UUID nếu cần
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================================================
-- 1. BẢNG USERS: Quản lý người dùng và phân quyền
-- =======================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- 2. BẢNG TOPICS: Phân nhóm chủ đề từ vựng và đề thi
-- =======================================================
CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- 3. BẢNG WORDS: Kho từ vựng dùng cho từ điển & học tập
-- =======================================================
CREATE TABLE IF NOT EXISTS words (
    id SERIAL PRIMARY KEY,
    word VARCHAR(100) NOT NULL,
    pronunciation VARCHAR(100),
    part_of_speech VARCHAR(30),
    definition TEXT NOT NULL,
    example_sentence TEXT,
    topic_id INT REFERENCES topics(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Tạo Index cho từ vựng để hỗ trợ tra cứu nhanh
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);

-- =======================================================
-- 4. BẢNG IDIOMS: Thành ngữ tiếng Anh
-- =======================================================
CREATE TABLE IF NOT EXISTS idioms (
    id SERIAL PRIMARY KEY,
    idiom VARCHAR(150) NOT NULL,
    meaning TEXT NOT NULL,
    example_sentence TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- 5. BẢNG FLASHCARDS: Tiến trình học thẻ từ vựng của từng học viên
-- =======================================================
CREATE TABLE IF NOT EXISTS flashcards (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_id INT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'LEARNING', 'MASTERED')),
    review_count INT DEFAULT 0,
    last_reviewed TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, word_id)
);

-- =======================================================
-- 6. BẢNG STREAK_LOGS: Ghi nhận chuỗi ngày học liên tục
-- =======================================================
CREATE TABLE IF NOT EXISTS streak_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    timezone_offset INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, activity_date)
);

-- =======================================================
-- 7. BẢNG EXAMS: Danh mục đề thi trắc nghiệm (TOEIC/IELTS)
-- =======================================================
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    duration INT NOT NULL, -- Thời lượng thi tính bằng PHÚT (vd: 45)
    total_questions INT NOT NULL DEFAULT 0,
    topic_id INT REFERENCES topics(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================
-- 8. BẢNG QUESTIONS: Danh sách câu hỏi trắc nghiệm thuộc đề thi
-- =======================================================
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    exam_id INT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    options JSONB NOT NULL, -- Dạng JSON: {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct_answer VARCHAR(5) NOT NULL, -- "A", "B", "C" hoặc "D"
    explanation TEXT
);

-- =======================================================
-- 9. BẢNG EXAM_RESULTS: Kết quả và thời gian làm bài chống gian lận
-- =======================================================
CREATE TABLE IF NOT EXISTS exam_results (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id INT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INT NOT NULL, -- Thời gian thực tế học viên làm bài (tính bằng GIÂY)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kích hoạt extension UUID nếu cần dùng ở môi trường phân tán
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BẢNG ROLES: Quản lý danh sách các vai trò hệ thống
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,                  -- Tự sinh index: roles_pkey
    code VARCHAR(50) UNIQUE NOT NULL,       -- Tự sinh index: roles_code_key
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG PERMISSIONS: Định nghĩa các quyền hạn chi tiết
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,                  -- Tự sinh index: permissions_pkey
    code VARCHAR(100) UNIQUE NOT NULL,      -- Tự sinh index: permissions_code_key
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG ROLE_PERMISSIONS: Quan hệ Nhiều - Nhiều (N-N) giữa Roles và Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)    -- Tự sinh index: role_permissions_pkey (role_id, permission_id)
    -- CHƯA CẦN: index riêng cho permission_id một mình - chưa có tính năng
    -- "tìm role nào có quyền X" trong code hiện tại
);

-- 4. BẢNG USERS: Mỗi User gắn với đúng 1 Role
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,                  -- Tự sinh index: users_pkey
    username VARCHAR(50) UNIQUE NOT NULL,   -- Tự sinh index: users_username_key
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,     -- Tự sinh index: users_email_key
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    -- CHƯA CẦN: index cho role_id - user.repository.js hiện chỉ JOIN roles
    -- sau khi đã lọc theo username/email/id (đã có index), không cần thêm
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. BẢNG WORDS: Kho từ vựng dùng chung cho từ điển & học tập
CREATE TABLE IF NOT EXISTS words (
    id SERIAL PRIMARY KEY,                  -- Tự sinh index: words_pkey
    word VARCHAR(150) NOT NULL,
    pronunciation VARCHAR(150),
    part_of_speech VARCHAR(100),
    meaning_vi TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS word_lower_unique_idx ON words (LOWER(word));

-- 6. BẢNG IDIOMS: Thành ngữ tiếng Anh (Đọc tĩnh - Cached Redis)
CREATE TABLE IF NOT EXISTS idioms (
    id SERIAL PRIMARY KEY,                  -- Tự sinh index: idioms_pkey
    idiom VARCHAR(150) NOT NULL,
    meaning TEXT NOT NULL,
    example TEXT
);

-- 7. BẢNG TOPICS: Phân nhóm chủ đề học tập và lộ trình
CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,                  -- Tự sinh index: topics_pkey
    title VARCHAR(100) NOT NULL,
    description TEXT
);

-- 8. BẢNG FLASHCARDS: Tiến trình học tập (Bảng nối đa chiều động)
CREATE TABLE IF NOT EXISTS flashcards (
    id SERIAL PRIMARY KEY,                  -- Tự sinh index: flashcards_pkey
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'LEARNING', 'MASTERED')),
    last_reviewed TIMESTAMPTZ,
    CONSTRAINT uq_user_word UNIQUE(user_id, word_id)  -- Tự sinh index: uq_user_word (user_id, word_id)
    -- CHƯA CẦN: index riêng cho topic_id hoặc word_id một mình - chưa có
    -- repository nào query theo 2 cột này độc lập. Khi có tính năng
    -- "lọc flashcard theo chủ đề" hoặc "thống kê độ phổ biến từ vựng",
);

CREATE INDEX IF NOT EXISTS uq_flashcards_user_topic ON flashcards (user_id, topic_id);

-- 9. BẢNG STREAK_LOGS: Ghi nhận lịch sử chuỗi ngày học liên tục
CREATE TABLE IF NOT EXISTS streak_logs (
    id SERIAL PRIMARY KEY,                  -- Tự sinh index: streak_logs_pkey
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    timezone_offset INTEGER NOT NULL,
    CONSTRAINT uq_user_activity UNIQUE(user_id, activity_date)  -- Tự sinh index: uq_user_activity (user_id, activity_date)
);

-- 10. BẢNG EXAMS: Danh sách đề thi trắc nghiệm có tính giờ
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,                  -- Tự sinh index: exams_pkey
    topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    duration INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    -- CHƯA CẦN: index cho topic_id - chưa có tính năng "danh sách đề thi
    -- theo chủ đề" được triển khai trong repository hiện tại
);

-- 11. BẢNG QUESTIONS: Danh sách câu hỏi trắc nghiệm chi tiết
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,                  -- Tự sinh index: questions_pkey
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D'))
    -- CHƯA CẦN: index cho exam_id - chức năng làm bài thi (lấy câu hỏi
    -- theo exam_id) CHƯA được code trong repository nào ở thời điểm này.
    -- Khi triển khai exam.repository.js, thêm index này vào PHẦN B.
);

-- 12. BẢNG EXAM_RESULTS: Kết quả và thời gian làm bài chống gian lận
CREATE TABLE IF NOT EXISTS exam_results (
    id SERIAL PRIMARY KEY,                  -- Tự sinh index: exam_results_pkey
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL,
    time_spent INTEGER NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    -- CHƯA CẦN: index cho user_id/exam_id - tương tự questions, chỉ thêm
    -- khi thực sự có repository query theo 2 cột này.
);

-- Phiên làm bài: theo dõi mốc bắt đầu/nộp bài để tính time_spent chống gian lận
CREATE TABLE IF NOT EXISTS exam_sessions (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'SUBMITTED'))
);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON exam_sessions (user_id);

-- Đáp án học viên đã chọn cho từng câu, dùng để chấm điểm + hiển thị review chi tiết
CREATE TABLE IF NOT EXISTS exam_answers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option CHAR(1) CHECK (selected_option IN ('A', 'B', 'C', 'D')),
    CONSTRAINT uq_session_question UNIQUE (session_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_exam_answers_session_id ON exam_answers (session_id);

-- Liên kết exam_results với đúng phiên đã sinh ra nó, phục vụ /exams/history xem lại chi tiết
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES exam_sessions(id) ON DELETE SET NULL;
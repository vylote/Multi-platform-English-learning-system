-- ==============================================================================
-- BẢN SEED CẤU HÌNH HỆ THỐNG: CHÍNH SÁCH MỞ KHÓA LỘ TRÌNH VÀ BÀI HỌC
-- Khớp 100% với giao diện Quản trị viên (Admin Settings)
-- ==============================================================================

INSERT INTO system_settings (key, value, data_type, group_name, label, description, updated_at)
VALUES
  (
    'learning.words_per_lesson',
    '10',
    'number',
    'LEARNING',
    'Số từ vựng mỗi bài học',
    'Số lượng từ vựng nạp vào một bài học tương tác theo chủ đề.',
    CURRENT_TIMESTAMP
  ),
  (
    'learning.questions_per_lesson',
    '10',
    'number',
    'LEARNING',
    'Số câu hỏi trắc nghiệm / bài học',
    'Số câu hỏi trắc nghiệm kiểm tra độ hiểu sau khi học từ vựng.',
    CURRENT_TIMESTAMP
  ),
  (
    'learning.unlock_threshold',
    '60',
    'number',
    'LEARNING',
    'Ngưỡng mở khóa chủ đề (%)',
    'Độ thành thạo (%) tối thiểu của chủ đề trước để mở khóa học chủ đề kế tiếp trong lộ trình.',
    CURRENT_TIMESTAMP
  ),
  (
    'learning.lesson_weight',
    '0.25',
    'number',
    'LEARNING',
    'Trọng số Bài học (Mastery)',
    'Tỷ trọng của bài học tương tác trong độ thành thạo chủ đề (0.0 - 1.0).',
    CURRENT_TIMESTAMP
  ),
  (
    'learning.exam_weight',
    '0.45',
    'number',
    'LEARNING',
    'Trọng số Bài thi (Mastery)',
    'Tỷ trọng của bài thi trắc nghiệm trong độ thành thạo chủ đề (0.0 - 1.0).',
    CURRENT_TIMESTAMP
  ),
  (
    'learning.vocab_weight',
    '0.30',
    'number',
    'LEARNING',
    'Trọng số Từ vựng (Mastery)',
    'Tỷ trọng của từ vựng trong công thức tính độ thành thạo chủ đề (0.0 - 1.0).',
    CURRENT_TIMESTAMP
  )
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    group_name = EXCLUDED.group_name,
    data_type = EXCLUDED.data_type,
    updated_at = CURRENT_TIMESTAMP;

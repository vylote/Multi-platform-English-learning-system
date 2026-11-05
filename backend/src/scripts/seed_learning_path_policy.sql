-- ==============================================================================
-- BẢN SEED CẤU HÌNH HỆ THỐNG: CHÍNH SÁCH MỞ KHÓA LỘ TRÌNH VÀ BÀI HỌC
-- Đảm bảo học viên phải đáp ứng TẤT CẢ các tiêu chí nghiêm ngặt để mở khóa chủ đề tiếp theo
-- ==============================================================================

INSERT INTO system_settings (key, value, data_type, group_name, label, description, updated_at)
VALUES
  (
    'learning.words_per_lesson',
    '10',
    'number',
    'LEARNING',
    'Số từ vựng mỗi bài học',
    'Số lượng từ vựng nạp vào một bài học tương tác theo chủ đề (tối thiểu 10 từ).',
    CURRENT_TIMESTAMP
  ),
  (
    'learning.questions_per_lesson',
    '10',
    'number',
    'LEARNING',
    'Số câu hỏi trắc nghiệm / bài học',
    'Số câu hỏi trắc nghiệm kiểm tra độ hiểu sau khi học từ vựng (tối thiểu 10 câu).',
    CURRENT_TIMESTAMP
  ),
  (
    'learning.lesson_pass_threshold',
    '80',
    'number',
    'LEARNING',
    'Ngưỡng đạt bài học tương tác (%)',
    'Điểm tối thiểu (%) học viên phải đạt ở bài học tương tác để đủ điều kiện xét mở khóa.',
    CURRENT_TIMESTAMP
  ),
  (
    'learning.exam_pass_threshold',
    '8.0',
    'number',
    'LEARNING',
    'Ngưỡng đạt bài thi chủ đề (Thang điểm 10)',
    'Điểm bài thi trắc nghiệm chủ đề tối thiểu học viên phải đạt để đủ điều kiện xét mở khóa.',
    CURRENT_TIMESTAMP
  ),
  (
    'learning.unlock_threshold',
    '70',
    'number',
    'LEARNING',
    'Ngưỡng độ thành thạo chủ đề (%)',
    'Độ thành thạo tổng hợp tối thiểu (%) của chủ đề trước để mở khóa chủ đề kế tiếp.',
    CURRENT_TIMESTAMP
  ),
  (
    'learning.lesson_weight',
    '0.45',
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
    '0.10',
    'number',
    'LEARNING',
    'Trọng số Từ vựng (Mastery)',
    'Tỷ trọng của từ vựng thuần thục qua SRS trong độ thành thạo chủ đề (0.0 - 1.0).',
    CURRENT_TIMESTAMP
  )
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    group_name = EXCLUDED.group_name,
    data_type = EXCLUDED.data_type,
    updated_at = CURRENT_TIMESTAMP;


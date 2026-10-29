const db = require("../config/db");

const DEFAULT_SETTINGS = [
  // --- NHÓM 1: HỌC TẬP & LỘ TRÌNH (LEARNING) ---
  {
    key: "learning.unlock_threshold",
    value: "60",
    data_type: "number",
    group_name: "LEARNING",
    label: "Ngưỡng mở khóa chủ đề (%)",
    description: "Độ thành thạo (%) tối thiểu của chủ đề trước để mở khóa học chủ đề kế tiếp trong lộ trình.",
  },
  {
    key: "learning.words_per_lesson",
    value: "5",
    data_type: "number",
    group_name: "LEARNING",
    label: "Số từ vựng mỗi bài học",
    description: "Số lượng từ vựng nạp vào một bài học tương tác theo chủ đề.",
  },
  {
    key: "learning.questions_per_lesson",
    value: "5",
    data_type: "number",
    group_name: "LEARNING",
    label: "Số câu hỏi trắc nghiệm / bài học",
    description: "Số câu hỏi trắc nghiệm kiểm tra độ hiểu sau khi học từ vựng.",
  },
  {
    key: "learning.flashcard_daily_target",
    value: "10",
    data_type: "number",
    group_name: "LEARNING",
    label: "Mục tiêu Flashcard hàng ngày",
    description: "Số lượng từ vựng cần ôn tập mỗi ngày để hoàn thành mục tiêu ngày.",
  },
  {
    key: "learning.vocab_weight",
    value: "0.5",
    data_type: "number",
    group_name: "LEARNING",
    label: "Trọng số Từ vựng (Mastery)",
    description: "Tỷ trọng của từ vựng trong công thức tính độ thành thạo chủ đề (0.0 - 1.0).",
  },
  {
    key: "learning.exam_weight",
    value: "0.25",
    data_type: "number",
    group_name: "LEARNING",
    label: "Trọng số Bài thi (Mastery)",
    description: "Tỷ trọng của điểm thi trắc nghiệm trong độ thành thạo chủ đề (0.0 - 1.0).",
  },
  {
    key: "learning.lesson_weight",
    value: "0.25",
    data_type: "number",
    group_name: "LEARNING",
    label: "Trọng số Bài học (Mastery)",
    description: "Tỷ trọng của bài học tương tác trong độ thành thạo chủ đề (0.0 - 1.0).",
  },

  // --- NHÓM 2: XẾP LỚP ĐẦU VÀO (PLACEMENT) ---
  {
    key: "placement.beginner_max",
    value: "5.0",
    data_type: "number",
    group_name: "PLACEMENT",
    label: "Điểm tối đa phân loại Cơ bản (Beginner)",
    description: "Điểm bài thi đầu vào dưới mốc này sẽ được xếp vào cấp độ Cơ bản (Beginner).",
  },
  {
    key: "placement.intermediate_max",
    value: "8.0",
    data_type: "number",
    group_name: "PLACEMENT",
    label: "Điểm tối đa phân loại Trung cấp (Intermediate)",
    description: "Điểm bài thi đầu vào từ mốc Beginner đến dưới mốc này được xếp vào Trung cấp (Intermediate), trên mốc này là Nâng cao (Advanced).",
  },

  // --- NHÓM 3: THI CỬ & CHỐNG GIAN LẬN (EXAM) ---
  {
    key: "exam.network_buffer_seconds",
    value: "15",
    data_type: "number",
    group_name: "EXAM",
    label: "Khoảng đệm độ trễ mạng khi nộp bài (giây)",
    description: "Số giây cộng thêm vào thời gian làm bài để bù trừ trễ mạng khi học viên nộp bài thi.",
  },

  // --- NHÓM 4: CÔNG TẮC HỆ THỐNG (SYSTEM) ---
  {
    key: "system.maintenance_mode",
    value: "false",
    data_type: "boolean",
    group_name: "SYSTEM",
    label: "Chế độ bảo trì hệ thống",
    description: "Khi kích hoạt, chỉ tài khoản Quản trị viên (ADMIN) mới có thể đăng nhập và truy cập các API.",
  },
  {
    key: "system.allow_registration",
    value: "true",
    data_type: "boolean",
    group_name: "SYSTEM",
    label: "Cho phép đăng ký tài khoản mới",
    description: "Bật hoặc tạm khóa tính năng đăng ký thành viên mới của hệ thống.",
  },

  // --- NHÓM 5: TRÍ TUỆ NHÂN TẠO (AI) ---
  {
    key: "ai.enable_generation",
    value: "true",
    data_type: "boolean",
    group_name: "AI",
    label: "Kích hoạt AI sinh đề thi",
    description: "Cho phép gọi API AI (Groq/XAI) để tự động sinh câu hỏi trắc nghiệm.",
  },
];

async function initSettingsTable() {
  console.log("--- Bắt đầu khởi tạo bảng system_settings ---");

  // 1. Tạo bảng
  await db.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      data_type VARCHAR(20) NOT NULL DEFAULT 'string',
      group_name VARCHAR(50) NOT NULL,
      label VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("✓ Bảng system_settings đã sẵn sàng.");

  // 2. Chèn cấu hình mặc định nếu chưa tồn tại
  for (const item of DEFAULT_SETTINGS) {
    await db.query(
      `
      INSERT INTO system_settings (key, value, data_type, group_name, label, description, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE 
      SET label = EXCLUDED.label,
          description = EXCLUDED.description,
          group_name = EXCLUDED.group_name,
          data_type = EXCLUDED.data_type;
      `,
      [
        item.key,
        item.value,
        item.data_type,
        item.group_name,
        item.label,
        item.description,
      ],
    );
  }

  console.log(`✓ Đã nạp thành công ${DEFAULT_SETTINGS.length} cấu hình hệ thống ban đầu.`);
}

if (require.main === module) {
  initSettingsTable()
    .then(() => {
      console.log("Khởi tạo cấu hình hoàn tất!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Lỗi khi khởi tạo cấu hình:", err);
      process.exit(1);
    });
}

module.exports = { initSettingsTable, DEFAULT_SETTINGS };

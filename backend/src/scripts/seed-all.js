const { spawnSync } = require("child_process");
const path = require("path");

const scripts = [
  { name: "Cấu hình hệ thống (Settings)", file: "init-settings.js" },
  { name: "36 Chủ đề & Lộ trình học (Topics)", file: "seed-topics.js" },
  { name: "Đề thi đầu vào (Placement Exam)", file: "seed-placement-exam.js" },
  { name: "Tài khoản Quản trị viên (Admin)", file: "seed-admin.js" },
  { 
    name: "Ngân hàng đề thi 36 chủ đề (Exams)", 
    file: "gen_exam.js",
    args: ["--topics=1-36", "--count=10", "--duration=15"]
  },
];

console.log("=======================================================");
console.log("🌟 BẮT ĐẦU CHẠY TOÀN BỘ QUY TRÌNH NẠP DỮ LIỆU (SEED ALL)");
console.log("=======================================================\n");

for (let i = 0; i < scripts.length; i++) {
  const item = scripts[i];
  console.log(`[${i + 1}/${scripts.length}] Đang chạy: ${item.name}...`);
  const scriptPath = path.join(__dirname, item.file);
  const args = item.args ? [scriptPath, ...item.args] : [scriptPath];

  const result = spawnSync("node", args, {
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    console.error(`\n❌ Script ${item.file} thất bại (Exit code: ${result.status})`);
    process.exit(result.status || 1);
  }
  console.log(`✅ Hoàn thành: ${item.name}\n`);
}

console.log("=======================================================");
console.log("🎉 TẤT CẢ DỮ LIỆU ĐÃ ĐƯỢC SEED THÀNH CÔNG VÀO DATABASE!");
console.log("👉 Đăng nhập Admin: http://localhost:5173/admin/login");
console.log("   - Username: admin");
console.log("   - Password: admin123");
console.log("=======================================================");

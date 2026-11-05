const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../../backend/.env") });
const fs = require("fs");
const db = require("../config/db");

async function runSqlSeed() {
  const targetFile = process.argv[2] || path.join(__dirname, "seed_learning_path_policy.sql");
  const fullPath = path.isAbsolute(targetFile) ? targetFile : path.resolve(process.cwd(), targetFile);

  if (!fs.existsSync(fullPath)) {
    console.error(`Không tìm thấy tệp SQL: ${fullPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(fullPath, "utf8");
  console.log(`Đang thực thi script SQL: ${fullPath}...`);

  try {
    await db.query(sqlContent);
    console.log("Thực thi script SQL thành công!");
    process.exit(0);
  } catch (err) {
    console.error("Lỗi khi thực thi script SQL:", err);
    process.exit(1);
  }
}

runSqlSeed();

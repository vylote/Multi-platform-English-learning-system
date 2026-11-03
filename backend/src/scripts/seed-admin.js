require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function seedAdmin() {
  const client = await db.pool.connect();
  try {
    console.log("🚀 Đang khởi tạo tài khoản Quản trị viên (ADMIN)...");

    // 1. Tìm vai trò ADMIN
    const roleRes = await client.query("SELECT id FROM roles WHERE code = 'ADMIN'");
    if (roleRes.rows.length === 0) {
      throw new Error("Không tìm thấy vai trò 'ADMIN' trong bảng roles! Hãy chạy seed_permissions.sql trước.");
    }
    const adminRoleId = roleRes.rows[0].id;

    // 2. Hash mật khẩu admin123
    const passwordHash = await bcrypt.hash("admin123", 10);

    // 3. Chèn hoặc cập nhật admin
    const userRes = await client.query(
      `INSERT INTO users (username, email, password_hash, role_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE
       SET role_id = EXCLUDED.role_id,
           password_hash = EXCLUDED.password_hash
       RETURNING id, username, email`,
      ["admin", "admin@anhlingo.com", passwordHash, adminRoleId]
    );

    console.log("✅ Khởi tạo tài khoản ADMIN thành công!");
    console.log(`   - Username: ${userRes.rows[0].username}`);
    console.log(`   - Email: ${userRes.rows[0].email}`);
    console.log("   - Password: admin123");
    console.log("👉 Đăng nhập tại: http://localhost:5173/admin/login");
  } catch (err) {
    console.error("❌ Lỗi khi khởi tạo tài khoản ADMIN:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await db.pool.end();
  }
}

seedAdmin();

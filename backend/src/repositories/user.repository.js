const db = require('../config/db');
const User = require('../models/user.model');

class UserRepository {
  // Tìm kiếm người dùng theo username
  async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1 LIMIT 1';
    const result = await db.query(query, [username]);
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  // Tìm kiếm người dùng theo email
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1 LIMIT 1';
    const result = await db.query(query, [email]);
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  // Tìm kiếm người dùng theo ID (phục vụ lấy Profile)
  async findById(id) {
    const query = 'SELECT id, username, email, role, created_at FROM users WHERE id = $1 LIMIT 1';
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  // Thêm mới một người dùng vào cơ sở dữ liệu
  async create({ username, email, password_hash, role = 'STUDENT' }) {
    const query = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, created_at
    `;
    const values = [username, email, password_hash, role];
    const result = await db.query(query, values);
    return new User(result.rows[0]);
  }
}

module.exports = new UserRepository();
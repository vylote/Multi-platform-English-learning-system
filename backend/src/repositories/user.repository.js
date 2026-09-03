const db = require('../config/db');
const User = require('../models/user.model');

class UserRepository {
  // Tìm kiếm người dùng theo username (JOIN roles để lấy role code)
  async findByUsername(username) {
    const query = `
      SELECT u.id, u.username, u.email, u.password_hash, u.created_at, r.code AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = $1
      LIMIT 1
    `;
    const result = await db.query(query, [username]);
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  // Tìm kiếm người dùng theo email
  async findByEmail(email) {
    const query = `
      SELECT u.id, u.username, u.email, u.password_hash, u.created_at, r.code AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
      LIMIT 1
    `;
    const result = await db.query(query, [email]);
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  // Tìm kiếm người dùng theo ID (phục vụ lấy Profile)
  async findById(id) {
    const query = `
      SELECT u.id, u.username, u.email, u.created_at, r.code AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
      LIMIT 1
    `;
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  // Thêm mới một người dùng vào cơ sở dữ liệu (nhận role_id thay vì role text)
  async create({ username, email, password_hash, role_id }) {
    const query = `
      INSERT INTO users (username, email, password_hash, role_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const values = [username, email, password_hash, role_id];
    const result = await db.query(query, values);

    // Query lại qua findById để lấy kèm role code (JOIN roles) trong 1 lần duy nhất
    return this.findById(result.rows[0].id);
  }
}

module.exports = new UserRepository();
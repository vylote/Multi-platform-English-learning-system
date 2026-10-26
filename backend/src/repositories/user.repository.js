const db = require("../config/db");
const User = require("../models/user.model");

class UserRepository {
  // Tìm kiếm người dùng theo username (JOIN roles để lấy role code)
  async findByUsername(username) {
    const query = `
      SELECT u.id, u.username, u.email, u.password_hash, u.created_at, u.tier, u.experience_level, u.learning_purpose, r.code AS role
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
      SELECT u.id, u.username, u.email, u.password_hash, u.created_at, u.tier, u.experience_level, u.learning_purpose, r.code AS role
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
      SELECT u.id, u.username, u.email, u.created_at, u.tier, u.experience_level, u.learning_purpose, r.code AS role
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

  async updateOnboarding(userId, { experience_level, learning_purpose, tier }) {
    const query = `
      UPDATE users 
      SET experience_level = $1, learning_purpose = $2, tier = $3
      WHERE id = $4
    `;
    await db.query(query, [experience_level, learning_purpose, tier, userId]);

    // Gọi lại findById để lấy thông tin user mới nhất trả về
    return this.findById(userId);
  }

  // Cập nhật tier cho user sau khi làm bài Placement Test
  async updateTier(userId, tier) {
    const query = `
      UPDATE users 
      SET tier = $1 
      WHERE id = $2
      RETURNING *;
    `;
    const result = await db.query(query, [tier, userId]);
    return result.rows[0];
  }

  // Admin: Lấy danh sách người dùng kèm phân trang, tìm kiếm và bộ lọc
  async findUsers({ search = "", role = "ALL", tier = "ALL", page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      conditions.push(`(u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (role && role !== "ALL") {
      conditions.push(`r.code = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (tier && tier !== "ALL") {
      conditions.push(`u.tier = $${paramIndex}`);
      params.push(tier);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Query đếm tổng số bản ghi
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.total || 0, 10);

    // Query lấy dữ liệu người dùng
    const dataQuery = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.tier, 
        u.experience_level, 
        u.learning_purpose, 
        u.created_at,
        r.id AS role_id,
        r.code AS role_code,
        r.name AS role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataParams = [...params, limit, offset];
    const dataResult = await db.query(dataQuery, dataParams);

    return {
      users: dataResult.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // Admin: Cập nhật vai trò (Role) cho người dùng
  async updateUserRole(userId, roleId) {
    const query = `
      UPDATE users
      SET role_id = $1
      WHERE id = $2
      RETURNING id, username, email, role_id
    `;
    const result = await db.query(query, [roleId, userId]);
    if (result.rows.length === 0) return null;
    return this.findById(userId);
  }

  // Admin: Thống kê số lượng người dùng theo vai trò và tổng quát
  async getUserStats() {
    const query = `
      SELECT 
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE r.code = 'STUDENT') AS total_students,
        COUNT(*) FILTER (WHERE r.code = 'ADMIN') AS total_admins,
        COUNT(*) FILTER (WHERE u.created_at >= NOW() - INTERVAL '7 days') AS new_users_week
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `;
    const result = await db.query(query);
    const row = result.rows[0] || {};
    return {
      totalUsers: parseInt(row.total_users || 0, 10),
      totalStudents: parseInt(row.total_students || 0, 10),
      totalAdmins: parseInt(row.total_admins || 0, 10),
      newUsersWeek: parseInt(row.new_users_week || 0, 10),
    };
  }
}

module.exports = new UserRepository();

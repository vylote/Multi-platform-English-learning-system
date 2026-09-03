const db = require('../config/db');

class RoleRepository {
  // Tìm role theo code (VD: 'STUDENT', 'ADMIN')
  async findByCode(code) {
    const query = 'SELECT id, code, name FROM roles WHERE code = $1 LIMIT 1';
    const result = await db.query(query, [code]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async findById(id) {
    const query = 'SELECT id, code, name FROM roles WHERE id = $1 LIMIT 1';
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  // Lấy danh sách permission CODE thuộc về 1 role (dùng cho middleware authorize)
  async findPermissionCodesByRoleCode(roleCode) {
    const query = `
      SELECT p.code
      FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.id
      JOIN roles r ON r.id = rp.role_id
      WHERE r.code = $1
    `;
    const result = await db.query(query, [roleCode]);
    return result.rows.map((row) => row.code);
  }
}

module.exports = new RoleRepository();
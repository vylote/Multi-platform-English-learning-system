const db = require('../config/db');
const Role = require('../models/role.model');

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

  async findAll() {
    const query = `SELECT id, code, name, description FROM roles ORDER BY id`;
    const result = await db.query(query);
    return result.rows.map((row) => new Role(row));
  }

  // Lấy toàn bộ danh sách permissions có trong hệ thống
  async getAllPermissions() {
    const query = `SELECT id, code, name, description FROM permissions ORDER BY id`;
    const result = await db.query(query);
    return result.rows;
  }

  // Lấy toàn bộ bảng phân quyền N-N giữa roles và permissions
  async getRolePermissionsMatrix() {
    const query = `
      SELECT rp.role_id, rp.permission_id, p.code AS permission_code, r.code AS role_code
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
    `;
    const result = await db.query(query);
    return result.rows;
  }

  // Cập nhật toàn bộ permissions cho 1 role trong 1 transaction an toàn
  async updateRolePermissions(roleId, permissionIds) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Xóa các quyền cũ của role
      await client.query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);

      // Gán danh sách quyền mới
      if (Array.isArray(permissionIds) && permissionIds.length > 0) {
        for (const permId of permissionIds) {
          await client.query(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [roleId, parseInt(permId, 10)],
          );
        }
      }

      await client.query("COMMIT");
      return true;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new RoleRepository();
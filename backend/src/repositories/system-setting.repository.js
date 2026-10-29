const db = require("../config/db");

class SystemSettingRepository {
  async findAll() {
    const sql = `
      SELECT key, value, data_type, group_name, label, description, updated_at
      FROM system_settings
      ORDER BY group_name ASC, key ASC
    `;
    const { rows } = await db.query(sql);
    return rows;
  }

  async findByKey(key) {
    const sql = `
      SELECT key, value, data_type, group_name, label, description, updated_at
      FROM system_settings
      WHERE key = $1
    `;
    const { rows } = await db.query(sql, [key]);
    return rows[0] || null;
  }

  async updateBatch(updates) {
    // updates: [{ key, value }]
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      for (const item of updates) {
        await client.query(
          `
          UPDATE system_settings
          SET value = $1, updated_at = CURRENT_TIMESTAMP
          WHERE key = $2
          `,
          [String(item.value), item.key],
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async resetDefaults(defaultSettings) {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      for (const item of defaultSettings) {
        await client.query(
          `
          UPDATE system_settings
          SET value = $1, updated_at = CURRENT_TIMESTAMP
          WHERE key = $2
          `,
          [String(item.value), item.key],
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new SystemSettingRepository();

const db = require("../config/db");

class StreakRepository {
  /**
   * Ghi nhận 1 hoạt động vào ngày localDateStr (tính sẵn theo timezone_offset của client).
   * ON CONFLICT DO NOTHING vì 1 ngày chỉ cần đúng 1 bản ghi (đã hoàn thành hay chưa là nhị phân,
   * làm nhiều task trong cùng 1 ngày không cần lưu thêm dòng nào nữa).
   */
  async recordActivity(userId, localDateStr, timezoneOffset) {
    const sql = `
      INSERT INTO streak_logs (user_id, activity_date, timezone_offset)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, activity_date) DO NOTHING
      RETURNING id;
    `;
    const { rows } = await db.query(sql, [
      userId,
      localDateStr,
      timezoneOffset,
    ]);
    return rows.length > 0;
  }

  /**
   * Lấy toàn bộ ngày đã học của user, mới nhất -> cũ nhất, dạng chuỗi 'YYYY-MM-DD'.
   */
  async findActivityDates(userId) {
    const sql = `
      SELECT TO_CHAR(activity_date, 'YYYY-MM-DD') AS date_str
      FROM streak_logs
      WHERE user_id = $1
      ORDER BY activity_date DESC;
    `;
    const { rows } = await db.query(sql, [userId]);
    return rows.map((r) => r.date_str);
  }
}

module.exports = new StreakRepository();

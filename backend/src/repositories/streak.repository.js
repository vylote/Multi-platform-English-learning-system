const db = require("../config/db");

class StreakRepository {
  
  //idx uq_user_activity
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

  //Lấy toàn bộ ngày đã học của user, mới nhất -> cũ nhất, dạng chuỗi 'YYYY-MM-DD'.
  //idx uq_user_activity
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

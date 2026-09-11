const streakRepository = require("../repositories/streak.repository");
const { StreakStatus } = require("../models/streak.model");

class StreakService {
  /* xử lí bài toán lệch múi giờ
    tham số: số phút lệch, số ngày cần lùi */
  _getLocalDateStr(timezoneOffsetMinutes, daysAgo = 0) {
    const now = new Date();
    // Quy đổi thời điểm UTC hiện tại sang giờ địa phương bằng cách cộng thêm offset (phút)
    const localMillis =
      now.getTime() +
      timezoneOffsetMinutes * 60 * 1000 -
      daysAgo * 24 * 60 * 60 * 1000;
    const localDate = new Date(localMillis);
    // Dùng các hàm UTC-getter trên đối tượng đã dịch chuyển để lấy đúng "ngày theo giờ địa phương"
    // mà không bị lệch thêm lần nữa do múi giờ hệ điều hành server.
    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, "0"); //TODO: thang trong node.js đếm từ 0, padStart ép 9->09
    const day = String(localDate.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  _subtractOneDay(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() - 1);
    const year = dt.getUTCFullYear();
    const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dt.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async testRecordActivity(userId, timezoneOffsetMinutes, daysAgo) {
    const todayStr = this._getLocalDateStr(timezoneOffsetMinutes, daysAgo);
    await streakRepository.recordActivity(
      userId,
      todayStr,
      timezoneOffsetMinutes
    );
    return this.getStatus(userId, timezoneOffsetMinutes);
  }

  /**
   * API 1: Ghi nhận hoạt động cho ngày hôm nay (theo giờ địa phương client), rồi tính lại streak.
   */
  async recordActivity(userId, timezoneOffsetMinutes) {
    const todayStr = this._getLocalDateStr(timezoneOffsetMinutes);
    await streakRepository.recordActivity(
      userId,
      todayStr,
      timezoneOffsetMinutes,
    );
    return this.getStatus(userId, timezoneOffsetMinutes);
  }

  /**
   * API 2: Tính trạng thái streak hiện tại theo đúng thuật toán 3 bước đã mô tả.
   */
  async getStatus(userId, timezoneOffsetMinutes) {
    // Bước 1: lấy toàn bộ ngày đã học, mới nhất -> cũ nhất
    const dates = await streakRepository.findActivityDates(userId);
    const dateSet = new Set(dates);

    // Bước 2: xác định mốc bắt đầu đếm
    const todayStr = this._getLocalDateStr(timezoneOffsetMinutes);
    const yesterdayStr = this._subtractOneDay(todayStr);

    const hasToday = dateSet.has(todayStr);
    const hasYesterday = dateSet.has(yesterdayStr);

    if (!hasToday && !hasYesterday) {
      return new StreakStatus({ currentStreak: 0, completedToday: false });
    }

    const completedToday = hasToday;
    let expectedDate = hasToday ? todayStr : yesterdayStr;

    // Bước 3: vòng lặp đếm lùi liên tục, dừng ngay khi phát hiện đứt gãy
    let currentStreak = 0;
    while (dateSet.has(expectedDate)) {
      currentStreak++;
      expectedDate = this._subtractOneDay(expectedDate);
    }

    return new StreakStatus({ currentStreak, completedToday });
  }

  async getWeekView(userId, timezoneOffsetMinutes, days = 7) {
    const dates = await streakRepository.findActivityDates(userId);
    const dateSet = new Set(dates);

    const todayStr = this._getLocalDateStr(timezoneOffsetMinutes);
    const result = [];
    let cursor = todayStr;
    for (let i = 0; i < days; i++) {
      result.unshift({ date: cursor, completed: dateSet.has(cursor) });
      cursor = this._subtractOneDay(cursor);
    }
    return result;
  }
}

module.exports = new StreakService();

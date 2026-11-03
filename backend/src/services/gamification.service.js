const redisClient = require("../config/redis");
const userRepository = require("../repositories/user.repository");

class GamificationService {
  /**
   * Lấy Bảng xếp hạng tuần từ Redis Sorted Set
   * @param {number} limit Số lượng học viên top đầu cần lấy
   */
  async getWeeklyLeaderboard(limit = 10) {
    const leaderboardKey = "leaderboard:weekly";

    // Lấy top người dùng có điểm EXP cao nhất từ Redis (Sorted Set ZREVRANGE)
    let rawEntries = [];
    try {
      rawEntries = await redisClient.zRangeWithScores(
        leaderboardKey,
        0,
        limit - 1,
        { REV: true }
      );
    } catch (err) {
      console.warn("[Gamification] Lỗi lấy BXH từ Redis:", err.message);
    }

    if (!rawEntries || rawEntries.length === 0) {
      return [];
    }

    const leaderboard = [];
    for (let i = 0; i < rawEntries.length; i++) {
      const entry = rawEntries[i];
      const userId = parseInt(entry.value, 10);
      const exp = Math.round(entry.score);
      const level = Math.floor(exp / 100) + 1;

      // Truy vấn thông tin cơ bản của học viên
      let username = `Học viên #${userId}`;
      let tier = "BEGINNER";

      try {
        const user = await userRepository.findById(userId);
        if (user) {
          username = user.username || user.email?.split("@")[0] || username;
          tier = user.tier || tier;
        }
      } catch (_) {}

      leaderboard.push({
        rank: i + 1,
        userId,
        username,
        tier,
        exp,
        level,
      });
    }

    return leaderboard;
  }

  /**
   * Lấy chỉ số EXP và Xếp hạng tuần của học viên hiện tại
   * @param {number} userId ID người dùng
   */
  async getUserStats(userId) {
    const leaderboardKey = "leaderboard:weekly";
    const userExpKey = `user:exp:${userId}`;

    let totalExp = 0;
    let weeklyExp = 0;
    let rank = null;

    try {
      const expStr = await redisClient.get(userExpKey);
      totalExp = expStr ? parseInt(expStr, 10) : 0;

      const score = await redisClient.zScore(leaderboardKey, String(userId));
      weeklyExp = score !== null ? Math.round(score) : 0;

      const revRank = await redisClient.zRevRank(leaderboardKey, String(userId));
      rank = revRank !== null ? revRank + 1 : null;
    } catch (err) {
      console.warn("[Gamification] Lỗi đọc stats từ Redis:", err.message);
    }

    const level = Math.floor(totalExp / 100) + 1;
    const expInCurrentLevel = totalExp % 100;
    const expNeededForNextLevel = 100 - expInCurrentLevel;

    return {
      userId,
      totalExp,
      weeklyExp,
      level,
      rank: rank || "Chưa xếp hạng",
      expInCurrentLevel,
      expNeededForNextLevel,
    };
  }
}

module.exports = new GamificationService();


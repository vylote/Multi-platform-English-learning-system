class StreakStatus {
  constructor({ currentStreak, completedToday }) {
    this.currentStreak = currentStreak;
    this.completedToday = completedToday;
  }

  toJSON() {
    return {
      currentStreak: this.currentStreak,
      completedToday: this.completedToday,
    };
  }
}

module.exports = { StreakStatus };
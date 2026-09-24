const userRepository = require("../repositories/user.repository");

class UserService {
  /**
   * Hoàn thành thông tin Onboarding cho user
   */
  async completeOnboarding(userId, { experience_level, learning_purpose }) {
    // Logic nghiệp vụ: Nếu mới bắt đầu thì tier là BEGINNER, còn không thì để null 
    // (Placement test sau đó sẽ cập nhật lại tier này)
    let tier = null;
    if (experience_level === "BEGINNER") {
      tier = "BEGINNER";
    }

    // Gọi repository để cập nhật database
    const updatedUser = await userRepository.updateOnboarding(userId, {
      experience_level,
      learning_purpose,
      tier,
    });

    return updatedUser;
  }

  // Bạn có thể bổ sung thêm các hàm khác ở đây (ví dụ: findUserById, register, login,...)
}

module.exports = new UserService();
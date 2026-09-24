const ApiResponse = require("../common/api-response");
const { ErrorCode } = require("../common/error-code");
const userService = require("../services/user.service");

class OnboardingController {
  async completeInfo(req, res, next) {
    try {
      const userId = req.user.id;
      const { experience_level, learning_purpose } = req.body;

      const updatedUser = await userService.completeOnboarding(userId, {
        experience_level,
        learning_purpose,
      });

      return res.status(ErrorCode.SUCCESS.statusCode).json(
        ApiResponse.builder()
          .code(ErrorCode.SUCCESS.code)
          .message("Cập nhật thông tin Onboarding thành công")
          .result(updatedUser.toJSON()) // Loại bỏ password_hash qua toJSON()
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OnboardingController();

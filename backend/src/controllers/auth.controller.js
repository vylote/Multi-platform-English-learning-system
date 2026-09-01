const ApiResponse = require('../common/api-response');
const authService = require('../services/auth.service');

class AuthController {
  // Tiếp nhận yêu cầu Đăng ký
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json(
          ApiResponse.builder()
            .code('1021')
            .message('Vui lòng cung cấp đầy đủ username, email và password.')
            .build()
        );
      }

      const newUser = await authService.registerUser({ username, email, password });
      return res.status(201).json(
        ApiResponse.builder()
          .code('1000')
          .message('Đăng ký tài khoản học viên thành công!')
          .result(newUser)
          .build()
      );
    } catch (error) {
      next(error);
    }
  }

  // Tiếp nhận yêu cầu Đăng nhập
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json(
          ApiResponse.builder()
            .code('1021')
            .message('Vui lòng điền tên đăng nhập và mật khẩu.')
            .build()
        );
      }

      const result = await authService.loginUser({ username, password });

      return res.status(200).json(
        ApiResponse.builder()
          .code('1000')
          .message('Đăng nhập thành công')
          .result(result)
          .build()
      );
    } catch (error) {
      next(error);
    }
  }

  // Tiếp nhận yêu cầu lấy Hồ sơ cá nhân
  async getProfile(req, res, next) {
    try {
      const profile = await authService.getUserProfile(req.user.id);
      return res.status(200).json(
        ApiResponse.builder()
          .code('1000')
          .message('Lấy hồ sơ cá nhân thành công')
          .result(profile)
          .build()
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
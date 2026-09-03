const authService = require("../services/auth.service");
const ApiResponse = require("../common/api-response");

const COOKIE_NAME = "access_token";

class AuthController {
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json(
          ApiResponse.builder()
            .code("1021")
            .message("Vui lòng cung cấp đầy đủ username, email và password.")
            .build(),
        );
      }

      const newUser = await authService.registerUser({
        username,
        email,
        password,
      });

      return res.status(201).json(
        ApiResponse.builder()
          .code("1000")
          .message("Đăng ký tài khoản học viên thành công!")
          .result(newUser)
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json(
          ApiResponse.builder()
            .code("1021")
            .message("Vui lòng điền tên đăng nhập và mật khẩu.")
            .build(),
        );
      }

      const { user, accessToken, expirySeconds } = await authService.loginUser({
        username,
        password,
      });

      // Access Token nằm trong httpOnly cookie -> JS phía FE không đọc/sửa được (chống XSS)
      res.cookie(COOKIE_NAME, accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // chỉ bắt buộc HTTPS khi production
        sameSite: "lax",
        maxAge: expirySeconds * 1000,
      });

      return res.status(200).json(
        ApiResponse.builder()
          .code("1000")
          .message("Đăng nhập thành công")
          .result({ user })
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }

  // Được bảo vệ bởi verifyToken -> FE gọi để khôi phục session khi load lại trang
  async me(req, res, next) {
    try {
      const profile = await authService.getUserProfile(req.user.id);

      return res.status(200).json(
        ApiResponse.builder()
          .code("1000")
          .message("Lấy thông tin phiên đăng nhập thành công")
          .result(profile)
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await authService.logoutUser(req.user.id);
      res.clearCookie(COOKIE_NAME);

      return res.status(200).json(
        ApiResponse.builder()
          .code("1000")
          .message("Đăng xuất thành công")
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const profile = await authService.getUserProfile(req.user.id);

      return res.status(200).json(
        ApiResponse.builder()
          .code("1000")
          .message("Lấy hồ sơ cá nhân thành công")
          .result(profile)
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
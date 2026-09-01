const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/user.repository");
const { ErrorCode } = require("../common/error-code");
const AppException = require("../exceptions/app.exception");

class AuthService {
  // Xử lý nghiệp vụ Đăng ký tài khoản
  async registerUser({ username, email, password }) {
    // 1. Kiểm tra tồn tại username
    const existingUser = await userRepository.findByUsername(username);
    if (existingUser) {
      throw new AppException(
        ErrorCode.RESOURCE_EXISTED,
        "Tên đăng nhập đã được sử dụng",
      );
    }

    // 2. Kiểm tra tồn tại email
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      throw new AppException(
        ErrorCode.RESOURCE_EXISTED,
        "Địa chỉ email đã được đăng ký.",
      );
    }

    // 3. Tiến hành mã hóa mật khẩu bảo mật
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Lưu thực thể thông qua Repository
    const newUser = await userRepository.create({
      username,
      email,
      password_hash: passwordHash,
      role: "STUDENT",
    });

    return newUser.toJSON();
  }

  // Xử lý nghiệp vụ Đăng nhập và tạo JWT Token
  async loginUser({ username, password }) {
    // 1. Tìm thông tin người dùng
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new AppException(
        ErrorCode.UNAUTHENTICATED,
        "Tên đăng nhập hoặc mật khẩu không chính xác",
      );
    }

    // 2. Kiểm tra tính hợp lệ của mật khẩu
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppException(
        ErrorCode.UNAUTHENTICATED,
        "Tên đăng nhập hoặc mật khẩu không chính xác",
      );
    }

    // 3. Khởi tạo Payload và ký số Token JWT
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    return {
      token
    };
  }

  // Lấy thông tin người dùng hiện tại
  async getUserProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
        throw new AppException(
        ErrorCode.RESOURCE_NOT_FOUND,
        "Không tìm thấy hồ sơ người dùng.",
      );
    }
    return user.toJSON();
  }
}

module.exports = new AuthService();

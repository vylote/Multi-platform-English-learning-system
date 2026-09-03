const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ms = require("ms");
const userRepository = require("../repositories/user.repository");
const roleRepository = require("../repositories/role.repository");
const redisClient = require("../config/redis");
const { ErrorCode } = require("../common/error-code");
const AppException = require("../exceptions/app.exception");

const DEFAULT_ROLE_CODE = "STUDENT";
const SESSION_KEY_PREFIX = "session:"; // session:{userId} -> access token hiện hành

class AuthService {
  async registerUser({ username, email, password }) {
    const existingUser = await userRepository.findByUsername(username);
    if (existingUser) {
      throw new AppException(
        ErrorCode.RESOURCE_EXISTED,
        "Tên đăng nhập đã được sử dụng",
      );
    }

    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      throw new AppException(
        ErrorCode.RESOURCE_EXISTED,
        "Địa chỉ email đã được đăng ký.",
      );
    }

    const studentRole = await roleRepository.findByCode(DEFAULT_ROLE_CODE);
    if (!studentRole) {
      throw new AppException(
        ErrorCode.SYSTEM_ERROR,
        "Vai trò STUDENT chưa được khởi tạo trong hệ thống. Vui lòng seed bảng roles trước.",
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await userRepository.create({
      username,
      email,
      password_hash: passwordHash,
      role_id: studentRole.id,
    });

    return newUser.toJSON();
  }

  async loginUser({ username, password }) {
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new AppException(
        ErrorCode.UNAUTHENTICATED,
        "Tên đăng nhập hoặc mật khẩu không chính xác",
      );
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppException(
        ErrorCode.UNAUTHENTICATED,
        "Tên đăng nhập hoặc mật khẩu không chính xác",
      );
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN;
    const expirySeconds = Math.floor(ms(expiresIn) / 1000);

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
    });

    // Lưu session vào Redis với TTL trùng thời hạn JWT
    // -> cho phép server chủ động thu hồi (logout) mà không cần chờ JWT tự hết hạn
    await redisClient.set(`${SESSION_KEY_PREFIX}${user.id}`, accessToken, {
      EX: expirySeconds,
    });

    return {
      user: user.toJSON(),
      accessToken,
      expirySeconds,
    };
  }

  async logoutUser(userId) {
    await redisClient.del(`${SESSION_KEY_PREFIX}${userId}`);
  }

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
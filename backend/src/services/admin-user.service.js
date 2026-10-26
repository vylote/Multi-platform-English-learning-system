const userRepository = require("../repositories/user.repository");
const roleRepository = require("../repositories/role.repository");
const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");

class AdminUserService {
  // Lấy danh sách người dùng kèm bộ lọc và phân trang
  async getUsers(params) {
    return await userRepository.findUsers(params);
  }

  // Lấy thống kê số lượng người dùng
  async getUserStats() {
    return await userRepository.getUserStats();
  }

  // Lấy danh sách tất cả vai trò trong hệ thống
  async getRoles() {
    return await roleRepository.findAll();
  }

  // Cập nhật vai trò (phân quyền) cho người dùng
  async updateUserRole(currentAdminId, targetUserId, roleId) {
    const roleIdNum = parseInt(roleId, 10);
    const targetUserIdNum = parseInt(targetUserId, 10);

    if (isNaN(roleIdNum)) {
      throw new AppException(ErrorCode.INVALID_DATA, "Mã vai trò không hợp lệ.");
    }

    // Kiểm tra vai trò có tồn tại
    const targetRole = await roleRepository.findById(roleIdNum);
    if (!targetRole) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Vai trò được chọn không tồn tại trong hệ thống.");
    }

    // Kiểm tra người dùng mục tiêu có tồn tại
    const targetUser = await userRepository.findById(targetUserIdNum);
    if (!targetUser) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy người dùng mục tiêu.");
    }

    // Bảo vệ: Admin không thể tự tước quyền ADMIN của chính mình
    if (Number(currentAdminId) === targetUserIdNum && targetRole.code !== "ADMIN") {
      throw new AppException(
        ErrorCode.INVALID_DATA,
        "Bạn không thể tự thu hồi quyền Quản trị viên của chính tài khoản đang đăng nhập.",
      );
    }

    const updatedUser = await userRepository.updateUserRole(targetUserIdNum, roleIdNum);
    return updatedUser;
  }
}

module.exports = new AdminUserService();

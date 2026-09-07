const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");
const permissionService = require("../services/permission.service");

const authorize = (permissionCode) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.role) {
        // Không có role trong payload -> verifyToken chưa chạy trước hoặc token lỗi cấu trúc
        return next(
          new AppException(
            ErrorCode.UNAUTHENTICATED,
            "Không xác định được vai trò người dùng.",
          ),
        );
      }

      const rolePermissions = await permissionService.getRolePermissions(
        req.user.role,
      );

      if (!rolePermissions.includes(permissionCode)) {
        return next(
          new AppException(
            ErrorCode.UNAUTHORIZED,
            `Bạn không có quyền thực hiện hành động này (yêu cầu quyền: ${permissionCode}).`,
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authorize;
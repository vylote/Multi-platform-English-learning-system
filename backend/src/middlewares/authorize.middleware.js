const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");
const permissionService = require("../services/permission.service");

/**
 * Middleware factory kiểm tra quyền hạn (permission) của role đang đăng nhập.
 * Tương đương @PreAuthorize("hasAuthority('PERMISSION_CODE')") bên Spring Security.
 *
 * BẮT BUỘC dùng SAU verifyToken (cần req.user.role đã được set sẵn từ JWT payload).
 * Không cần query lại user theo id -> chỉ cần role, vì permission gắn với ROLE chứ
 * không gắn với từng user, nên cache theo role là đủ và hiệu quả hơn cache theo userId.
 *
 * Cách dùng:
 *   router.post('/exams', verifyToken, authorize('MANAGE_EXAMS'), examController.create);
 */
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
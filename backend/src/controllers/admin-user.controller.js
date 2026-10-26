const adminUserService = require("../services/admin-user.service");
const ApiResponse = require("../common/api-response");

class AdminUserController {
  // GET /api/v1/admin/users
  async getUsers(req, res, next) {
    try {
      const { search, role, tier, page, limit } = req.query;
      const data = await adminUserService.getUsers({
        search,
        role,
        tier,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
      });

      return res
        .status(200)
        .json(ApiResponse.success(data, "Lấy danh sách người dùng thành công."));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/users/stats
  async getUserStats(req, res, next) {
    try {
      const stats = await adminUserService.getUserStats();
      return res
        .status(200)
        .json(ApiResponse.success(stats, "Lấy thống kê người dùng thành công."));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/roles
  async getRoles(req, res, next) {
    try {
      const roles = await adminUserService.getRoles();
      return res
        .status(200)
        .json(ApiResponse.success(roles, "Lấy danh sách vai trò thành công."));
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/admin/users/:id/role
  async updateUserRole(req, res, next) {
    try {
      const targetUserId = req.params.id;
      const { role_id } = req.body;
      const currentAdminId = req.user.id;

      const updatedUser = await adminUserService.updateUserRole(
        currentAdminId,
        targetUserId,
        role_id,
      );

      return res
        .status(200)
        .json(ApiResponse.success(updatedUser, "Cập nhật vai trò người dùng thành công."));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminUserController();

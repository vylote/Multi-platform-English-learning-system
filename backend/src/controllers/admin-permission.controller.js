const adminPermissionService = require("../services/admin-permission.service");
const ApiResponse = require("../common/api-response");

class AdminPermissionController {
  // GET /api/v1/admin/role-permissions
  async getRolePermissionsData(req, res, next) {
    try {
      const data = await adminPermissionService.getRolePermissionsData();
      return res
        .status(200)
        .json(ApiResponse.success(data, "Lấy ma trận phân quyền thành công."));
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/admin/role-permissions/:roleId
  async updateRolePermissions(req, res, next) {
    try {
      const { roleId } = req.params;
      const { permissionIds } = req.body;

      const result = await adminPermissionService.updateRolePermissions(
        roleId,
        permissionIds,
      );

      return res
        .status(200)
        .json(ApiResponse.success(result, "Cập nhật phân quyền vai trò thành công."));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminPermissionController();

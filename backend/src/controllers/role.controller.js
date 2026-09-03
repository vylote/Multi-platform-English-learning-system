const ApiResponse = require("../common/api-response");
const roleRepository = require("../repositories/role.repository");

class RoleController {
  async getAllRoles(req, res, next) {
    try {
      const roles = await roleRepository.findAll();

      return res.status(200).json(
        ApiResponse.builder()
          .code("1000")
          .message("Lấy danh sách vai trò thành công")
          .result(roles)
          .build(),
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoleController();
const ApiResponse = require("../common/api-response");
const { ErrorCode } = require("../common/error-code");
const roleRepository = require("../repositories/role.repository");

class RoleController {
  async getAllRoles(req, res, next) {
    try {
      const roles = await roleRepository.findAll();

      return res.status(ErrorCode.SUCCESS.statusCode).json(
        ApiResponse.builder()
          .code(ErrorCode.SUCCESS.code)
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
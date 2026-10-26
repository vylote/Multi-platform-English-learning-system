const roleRepository = require("../repositories/role.repository");
const permissionService = require("./permission.service");
const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");

// Phân nhóm quyền trực quan cho giao diện
const PERMISSION_GROUPS = {
  DICTIONARY: {
    name: "Từ điển & Thành ngữ",
    codes: ["VIEW_DICTIONARY", "MANAGE_WORDS", "VIEW_IDIOMS", "MANAGE_IDIOMS"],
  },
  LEARNING: {
    name: "Học tập & Ghi nhớ",
    codes: ["MANAGE_FLASHCARDS"],
  },
  TESTING: {
    name: "Thi cử & Đề thi",
    codes: ["TAKE_EXAMS", "MANAGE_EXAMS", "VIEW_ALL_RESULTS"],
  },
  SYSTEM: {
    name: "Hệ thống & Quản trị",
    codes: ["MANAGE_USERS"],
  },
};

class AdminPermissionService {
  // Lấy toàn bộ ma trận phân quyền hệ thống (Roles, Permissions, Mappings)
  async getRolePermissionsData() {
    const [roles, allPermissions, matrixRows] = await Promise.all([
      roleRepository.findAll(),
      roleRepository.getAllPermissions(),
      roleRepository.getRolePermissionsMatrix(),
    ]);

    // Gắn nhóm module vào từng permission
    const permissionsWithGroup = allPermissions.map((perm) => {
      let groupKey = "OTHER";
      let groupName = "Khác";

      for (const [key, grp] of Object.entries(PERMISSION_GROUPS)) {
        if (grp.codes.includes(perm.code)) {
          groupKey = key;
          groupName = grp.name;
          break;
        }
      }

      return {
        ...perm,
        groupKey,
        groupName,
      };
    });

    // Gom danh sách permission_id theo role_id: { [role_id]: [permission_id1, ...] }
    const rolePermissionsMap = {};
    for (const role of roles) {
      rolePermissionsMap[role.id] = [];
    }

    for (const row of matrixRows) {
      if (rolePermissionsMap[row.role_id]) {
        rolePermissionsMap[row.role_id].push(row.permission_id);
      }
    }

    return {
      roles,
      permissions: permissionsWithGroup,
      rolePermissions: rolePermissionsMap,
      groups: Object.entries(PERMISSION_GROUPS).map(([key, val]) => ({
        key,
        name: val.name,
      })),
    };
  }

  // Cập nhật danh sách quyền cho 1 vai trò (role_id)
  async updateRolePermissions(roleId, permissionIds) {
    const id = parseInt(roleId, 10);
    if (isNaN(id)) {
      throw new AppException(ErrorCode.INVALID_DATA, "Mã vai trò không hợp lệ.");
    }

    const role = await roleRepository.findById(id);
    if (!role) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy vai trò.");
    }

    const permIds = Array.isArray(permissionIds)
      ? permissionIds.map((p) => parseInt(p, 10)).filter((p) => !isNaN(p))
      : [];

    // Thực hiện cập nhật DB trong Transaction
    await roleRepository.updateRolePermissions(id, permIds);

    // Xóa Redis cache của role này để phân quyền mới áp dụng ngay lập tức
    await permissionService.clearRolePermissionsCache(role.code);

    return {
      roleId: id,
      roleCode: role.code,
      roleName: role.name,
      updatedPermissionIds: permIds,
    };
  }
}

module.exports = new AdminPermissionService();

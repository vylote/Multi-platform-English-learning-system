const roleRepository = require("../repositories/role.repository");
const redisClient = require("../config/redis");

const ROLE_PERMISSIONS_KEY_PREFIX = "role_permissions:"; // role_permissions:{roleCode} -> ["CODE1","CODE2",...]
const ROLE_PERMISSIONS_TTL = 3600; // 1 giờ - permission ít khi đổi, TTL dài hơn session token là hợp lý

class PermissionService {
  // Lấy danh sách permission code của 1 role, ưu tiên đọc từ Redis (cache-aside)
  async getRolePermissions(roleCode) {
    const cacheKey = `${ROLE_PERMISSIONS_KEY_PREFIX}${roleCode}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cache miss -> query DB rồi set lại cache
    const permissions = await roleRepository.findPermissionCodesByRoleCode(roleCode);
    await redisClient.set(cacheKey, JSON.stringify(permissions), {
      EX: ROLE_PERMISSIONS_TTL,
    });

    return permissions;
  }

  // Gọi hàm này ở bất kỳ API nào thay đổi role_permissions (gán/thu hồi quyền)
  // để cache không bị "cũ" trong tối đa 1 giờ chờ tự hết hạn
  async clearRolePermissionsCache(roleCode) {
    await redisClient.del(`${ROLE_PERMISSIONS_KEY_PREFIX}${roleCode}`);
  }
}

module.exports = new PermissionService();
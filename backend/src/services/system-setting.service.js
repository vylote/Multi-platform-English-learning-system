const systemSettingRepository = require("../repositories/system-setting.repository");
const redisClient = require("../config/redis");
const { DEFAULT_SETTINGS } = require("../scripts/init-settings");

const CACHE_KEY = "system:settings:all";
const CACHE_TTL_SECONDS = 3600; // 1 hour

class SystemSettingService {
  _castValue(value, dataType) {
    if (value === null || value === undefined) return null;
    switch (dataType) {
      case "boolean":
        return String(value).toLowerCase() === "true";
      case "number":
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      case "json":
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      case "string":
      default:
        return String(value);
    }
  }

  // Lấy toàn bộ settings dạng flat map { [key]: typedValue } có cache Redis
  async getSettingsMap() {
    try {
      const cached = await redisClient.get(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn("Redis get settings error, fallback DB:", err.message);
    }

    const rows = await systemSettingRepository.findAll();
    const map = {};
    for (const r of rows) {
      map[r.key] = this._castValue(r.value, r.data_type);
    }

    try {
      await redisClient.set(CACHE_KEY, JSON.stringify(map), {
        EX: CACHE_TTL_SECONDS,
      });
    } catch (err) {
      console.warn("Redis set settings error:", err.message);
    }

    return map;
  }

  // Lấy giá trị của một setting cụ thể
  async get(key, defaultValue = null) {
    const map = await this.getSettingsMap();
    if (key in map) {
      return map[key];
    }
    return defaultValue;
  }

  // Lấy toàn bộ chi tiết kèm group và metadata cho Admin UI
  async getAllForAdmin() {
    const rows = await systemSettingRepository.findAll();
    const grouped = {};

    for (const r of rows) {
      if (!grouped[r.group_name]) {
        grouped[r.group_name] = [];
      }
      grouped[r.group_name].push({
        key: r.key,
        value: this._castValue(r.value, r.data_type),
        rawValue: r.value,
        dataType: r.data_type,
        groupName: r.group_name,
        label: r.label,
        description: r.description,
        updatedAt: r.updated_at,
      });
    }

    return {
      settings: rows.map((r) => ({
        key: r.key,
        value: this._castValue(r.value, r.data_type),
        rawValue: r.value,
        dataType: r.data_type,
        groupName: r.group_name,
        label: r.label,
        description: r.description,
        updatedAt: r.updated_at,
      })),
      grouped,
    };
  }

  // Cập nhật batch settings từ Admin
  async updateSettings(settingsMap) {
    if (!settingsMap || typeof settingsMap !== "object") {
      throw new Error("Dữ liệu cấu hình không hợp lệ.");
    }

    const updates = Object.entries(settingsMap).map(([key, value]) => ({
      key,
      value: String(value),
    }));

    if (updates.length > 0) {
      await systemSettingRepository.updateBatch(updates);
      // Xóa cache Redis
      try {
        await redisClient.del(CACHE_KEY);
      } catch (err) {
        console.warn("Redis del settings error:", err.message);
      }
    }

    return await this.getAllForAdmin();
  }

  // Đặt lại cấu hình mặc định ban đầu
  async resetToDefaults() {
    await systemSettingRepository.resetDefaults(DEFAULT_SETTINGS);
    try {
      await redisClient.del(CACHE_KEY);
    } catch (err) {
      console.warn("Redis del settings error:", err.message);
    }
    return await this.getAllForAdmin();
  }
}

module.exports = new SystemSettingService();

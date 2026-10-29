const systemSettingService = require("../services/system-setting.service");
const ApiResponse = require("../common/api-response");

class AdminSettingController {
  // GET /api/v1/admin/settings
  async getSettings(req, res, next) {
    try {
      const data = await systemSettingService.getAllForAdmin();
      return res
        .status(200)
        .json(ApiResponse.success(data, "Lấy danh sách cấu hình hệ thống thành công."));
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/admin/settings
  async updateSettings(req, res, next) {
    try {
      const { settings } = req.body;
      const data = await systemSettingService.updateSettings(settings);
      return res
        .status(200)
        .json(ApiResponse.success(data, "Cập nhật cấu hình hệ thống thành công."));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/settings/reset
  async resetDefaults(req, res, next) {
    try {
      const data = await systemSettingService.resetToDefaults();
      return res
        .status(200)
        .json(ApiResponse.success(data, "Đã khôi phục toàn bộ cấu hình hệ thống về mặc định."));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminSettingController();

const express = require("express");
const router = express.Router();

const adminUserController = require("../controllers/admin-user.controller");
const adminExamController = require("../controllers/admin-exam.controller");
const adminPermissionController = require("../controllers/admin-permission.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const AppException = require("../exceptions/app.exception");
const { ErrorCode } = require("../common/error-code");

// Middleware xác thực quyền ADMIN bắt buộc
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(
      new AppException(
        ErrorCode.UNAUTHORIZED,
        "Truy cập bị từ chối: Yêu cầu quyền Quản trị viên (ADMIN).",
      ),
    );
  }
  next();
};

// Áp dụng authMiddleware và requireAdmin cho toàn bộ routes admin
router.use(authMiddleware, requireAdmin);

// 1. Quản lý người dùng & Thống kê
router.get("/users", adminUserController.getUsers);
router.get("/users/stats", adminUserController.getUserStats);

// 2. Danh mục vai trò & Gán vai trò cho User
router.get("/roles", adminUserController.getRoles);
router.put("/users/:id/role", adminUserController.updateUserRole);

// 3. Quản lý Phân quyền theo vai trò (Role Permissions / RBAC)
router.get("/role-permissions", adminPermissionController.getRolePermissionsData);
router.put("/role-permissions/:roleId", adminPermissionController.updateRolePermissions);

// 3. Quản lý & Sinh đề thi theo chủ đề
router.get("/topics", adminExamController.getTopics);
router.get("/exams", adminExamController.getExams);
router.get("/exams/:id", adminExamController.getExamDetail);
router.post("/exams/generate", adminExamController.generateExam);
router.delete("/exams/:id", adminExamController.deleteExam);

module.exports = router;

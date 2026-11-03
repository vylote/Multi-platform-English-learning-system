const express = require("express");
const router = express.Router();
const gamificationController = require("../controllers/gamification.controller");
const verifyToken = require("../middlewares/auth.middleware");

// Bảng xếp hạng tuần (Công khai hoặc có đăng nhập)
router.get("/leaderboard", gamificationController.getLeaderboard);

// Thống kê EXP & Cấp độ cá nhân (Bắt buộc đăng nhập)
router.get("/my-stats", verifyToken, gamificationController.getMyStats);

module.exports = router;


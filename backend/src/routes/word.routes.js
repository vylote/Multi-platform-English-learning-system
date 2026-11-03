const express = require('express');
const router = express.Router();
const WordController = require('../controllers/word.controller');
const verifyToken = require('../middlewares/auth.middleware');

// Tra từ điển Hybrid (nội bộ + Fallback API ngoài + Auto-cache)
router.get('/search', WordController.searchWords);

// Thống kê từ vựng yếu & hay quên (Học viên & Toàn hệ thống)
router.get('/analytics/weak-words', (req, res, next) => {
  // Cho phép gọi cả khi có token hoặc không token (nếu có token thì đọc thêm userWeakWords)
  verifyToken(req, res, () => {
    next();
  }).catch(() => {
    next();
  });
}, WordController.getWeakWordsAnalytics);

module.exports = router;
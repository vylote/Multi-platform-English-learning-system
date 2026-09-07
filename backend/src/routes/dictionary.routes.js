const express = require('express');
const router = express.Router();
const dictionaryController = require('../controllers/dictionary.controller');

// Tra từ điển Hybrid (FTS nội bộ + Fallback API ngoài + Auto-cache)
// Không bắt buộc đăng nhập — cho phép cả khách vãng lai tra từ
router.get('/search', dictionaryController.searchWords);

module.exports = router;
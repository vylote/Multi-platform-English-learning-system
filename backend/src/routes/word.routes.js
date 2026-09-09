const express = require('express');
const router = express.Router();
const WordController = require('../controllers/word.controller');

// Tra từ điển Hybrid (nội bộ + Fallback API ngoài + Auto-cache)
router.get('/search', WordController.searchWords);

module.exports = router;
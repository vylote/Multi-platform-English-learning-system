const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcard.controller');
const verifyToken = require('../middlewares/auth.middleware');

// Toàn bộ route Flashcard đều gắn với user cụ thể -> bắt buộc xác thực
router.post('/', verifyToken, flashcardController.addFlashcard);
router.get('/', verifyToken, flashcardController.getMyFlashcards);

module.exports = router;
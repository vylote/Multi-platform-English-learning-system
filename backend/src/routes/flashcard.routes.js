const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcard.controller');
const verifyToken = require('../middlewares/auth.middleware');

router.get('/', verifyToken, flashcardController.getMyFlashcards);

router.get('/daily', verifyToken, flashcardController.getDaily);

router.put('/:id', verifyToken, flashcardController.updateFlashcard);
router.delete('/:id', verifyToken, flashcardController.deleteFlashcard);

module.exports = router;
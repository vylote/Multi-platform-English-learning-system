const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const verifyToken = require('../middlewares/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);

// FE gọi khi load lại trang để khôi phục session từ cookie
router.get('/me', verifyToken, authController.me);
router.post('/logout', verifyToken, authController.logout);

// Endpoint được bảo vệ nghiêm ngặt bằng JWT Middleware
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
const express = require("express");
const router = express.Router();
const learningPathController = require("../controllers/learning-path.controller");
const verifyToken = require("../middlewares/auth.middleware");

router.get("/", verifyToken, learningPathController.getMyLearningPath);

module.exports = router;
const express = require("express");
const router = express.Router();
const lessonController = require("../controllers/lesson.controller");
const verifyToken = require("../middlewares/auth.middleware");

router.get("/topics/:topicId", verifyToken, lessonController.getTopicLesson);
router.post("/topics/:topicId/complete", verifyToken, lessonController.completeLesson);

module.exports = router;
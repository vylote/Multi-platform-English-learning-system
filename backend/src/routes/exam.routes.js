const express = require("express");
const router = express.Router();
const examController = require("../controllers/exam.controller");
const verifyToken = require("../middlewares/auth.middleware");

router.get("/", verifyToken, examController.getExams);
router.get("/history", verifyToken, examController.getHistory);

router.post("/:id/start", verifyToken, examController.start);
router.post("/:id/submit", verifyToken, examController.submit);

module.exports = router;
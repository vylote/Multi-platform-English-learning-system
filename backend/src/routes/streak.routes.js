const express = require("express");
const router = express.Router();
const streakController = require("../controllers/streak.controller");
const verifyToken = require("../middlewares/auth.middleware");

router.post("/record", verifyToken, streakController.record);

router.post("/test-record", verifyToken, streakController.testRecord);

router.get("/status", verifyToken, streakController.status);

router.get("/week", verifyToken, streakController.week);

module.exports = router;
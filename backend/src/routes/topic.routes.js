const express = require("express");
const router = express.Router();
const topicController = require("../controllers/topic.controller");
const verifyToken = require("../middlewares/auth.middleware");

router.get("/", verifyToken, topicController.getAll);

module.exports = router;
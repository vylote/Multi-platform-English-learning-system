const express = require("express");
const router = express.Router();
const onboardingController = require("../controllers/onboarding.controller");
const verifyToken = require("../middlewares/auth.middleware");

router.post("/complete-info", verifyToken, onboardingController.completeInfo);

module.exports = router;
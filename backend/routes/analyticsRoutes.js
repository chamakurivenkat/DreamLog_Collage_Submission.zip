const express = require("express");
const router = express.Router();
const { getAnalytics, seedData } = require("../controllers/analyticsController");
const { optionalAuth } = require("../middleware/authMiddleware");

router.use(optionalAuth);

router.get("/", getAnalytics);
router.post("/seed", seedData);

module.exports = router;

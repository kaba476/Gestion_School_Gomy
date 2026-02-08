const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { getStatistics } = require("../controllers/statisticsController");

// 📊 Statistiques de présences (ADMIN uniquement)
router.get("/", protect, authorize("ADMIN"), getStatistics);

module.exports = router;

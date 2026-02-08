const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { getNotificationsEleve, markNotificationLu } = require("../controllers/notificationController");

// 🔔 Récupérer les notifications de l'élève connecté
router.get("/eleve", protect, authorize("ELEVE"), getNotificationsEleve);

// 🔔 Marquer une notification comme lue
router.patch("/:id/lu", protect, authorize("ELEVE"), markNotificationLu);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  createAlerte,
  createConvocation,
  getAlertes,
  getAlertesEleve,
  getAlertesProf,
  markAlerteLu,
} = require("../controllers/alerteController");
const { protect, authorize } = require("../middleware/authMiddleware");

// 🔹 Créer une alerte (ADMIN)
router.post("/", protect, authorize("ADMIN"), createAlerte);

// 🔹 Convocation admin → professeur
router.post("/convocation", protect, authorize("ADMIN"), createConvocation);

// 🔹 Liste des alertes élèves (ADMIN)
router.get("/", protect, getAlertes);

// 🔹 Alertes de l'élève connecté (3 absences non justifiées, etc.)
router.get("/eleve", protect, authorize("ELEVE"), getAlertesEleve);

// 🔹 Alertes du professeur connecté (convocations admin)
router.get("/prof", protect, authorize("PROF"), getAlertesProf);

// 🔹 Marquer une alerte comme lue
router.patch("/:id/lu", protect, markAlerteLu);

module.exports = router;

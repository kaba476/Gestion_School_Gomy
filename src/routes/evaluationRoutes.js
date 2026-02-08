const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createEvaluation,
  getEvaluations,
  createConstatForEvaluation,
} = require("../controllers/evaluationController");

// 🔹 Élève : créer une évaluation sur un professeur
router.post("/", protect, authorize("ELEVE"), createEvaluation);

// 🔹 Admin : lister toutes les évaluations
router.get("/", protect, authorize("ADMIN"), getEvaluations);

// 🔹 Admin : rédiger un constat et envoyer un message au prof (via alerte)
router.post("/:id/constat", protect, authorize("ADMIN"), createConstatForEvaluation);

module.exports = router;


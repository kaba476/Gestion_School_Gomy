const express = require("express");
const router = express.Router();
const {
  addJustification,
  getJustifications,
  getJustificationsEleve,
  updateJustificationStatus,
  updateJustificationComment,
} = require("../controllers/justificationController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Ajouter une justification (Élève)
router.post("/", protect, authorize("ELEVE"), addJustification);

// Lister les justifications de l'élève connecté
router.get("/eleve", protect, authorize("ELEVE"), getJustificationsEleve);

// Lister toutes les justifications (Admin/Prof)
router.get("/", protect, authorize("PROF", "ADMIN"), getJustifications);

// Mettre à jour le statut + commentaire optionnel (Admin/Prof)
router.put("/:id", protect, authorize("PROF", "ADMIN"), updateJustificationStatus);

// Ajouter ou modifier le commentaire admin (Admin uniquement)
router.patch("/:id/commentaire", protect, authorize("ADMIN"), updateJustificationComment);

module.exports = router;

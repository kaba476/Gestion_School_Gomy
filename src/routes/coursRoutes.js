const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createCours,
  getCours,
  getCoursEleve,
  getElevesByCours,
  updateCours,
  deleteCours,
} = require("../controllers/coursController");

// Créer un cours → ADMIN ou PROF
router.post("/", protect, authorize("ADMIN", "PROF"), createCours);

// Lister tous les cours
router.get("/", protect, authorize("ADMIN", "PROF"), getCours);

// Cours de l'élève connecté
router.get("/eleve", protect, authorize("ELEVE"), getCoursEleve);

// Modifier / Supprimer un cours → ADMIN ou prof propriétaire
router.put("/:id", protect, updateCours);
router.delete("/:id", protect, deleteCours);

// Élèves d'un cours → ADMIN ou PROF (propriétaire)
router.get("/:id/eleves", protect, authorize("ADMIN", "PROF"), getElevesByCours);

module.exports = router;

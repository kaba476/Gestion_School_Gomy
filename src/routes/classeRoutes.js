const express = require("express");
const router = express.Router();
const {
  createClasse,
  getClasses,
  addEleveToClasse,
  updateClasse,
  deleteClasse,
} = require("../controllers/classeController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Créer une classe → seulement ADMIN
router.post("/", protect, authorize("ADMIN"), createClasse);

// Lister toutes les classes → tous connectés (prof, admin)
router.get("/", protect, getClasses);

// Modifier / Supprimer une classe → ADMIN
router.put("/:id", protect, authorize("ADMIN"), updateClasse);
router.delete("/:id", protect, authorize("ADMIN"), deleteClasse);

// Affecter un élève à une classe (ADMIN) — Body : { eleveId: "..." }
router.post("/:id/eleves", protect, authorize("ADMIN"), addEleveToClasse);

module.exports = router;

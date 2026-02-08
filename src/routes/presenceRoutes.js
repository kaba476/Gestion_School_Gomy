// src/routes/presenceRoutes.js

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Import des fonctions du controller
const {
  createPresence,
  createAppel,
  getPresences,
  getPresencesEleve,
  updatePresence,
  validerPresencesJournee,
} = require("../controllers/presenceController");
const { authorize } = require("../middleware/authMiddleware");

// 🔹 Créer une présence (Admin ou Prof)
router.post("/", protect, createPresence);

// 🔹 Créer plusieurs présences en une fois (appel pour une date) - PROF uniquement
router.post("/appel", protect, authorize("PROF"), createAppel);

// 🔹 Valider les présences d'un cours pour une date (ADMIN) — plus de modification après
router.post("/valider", protect, authorize("ADMIN"), validerPresencesJournee);

// 🔹 Modifier une présence (Prof du cours ou Admin)
router.patch("/:id", protect, updatePresence);

// 🔹 Lister les présences (?cours=id pour filtrer par cours)
router.get("/", protect, getPresences);

// 🔹 Récupérer les présences de l’élève connecté
// NOTE: on passe en GET + on s'appuie sur req.user
// pour connaître l'élève (via le JWT).
router.get("/eleve", protect, getPresencesEleve);

module.exports = router;

const express = require("express");
const router = express.Router();

// ⚠️ Route d'authentification historique.
// On la garde pour compatibilité, mais on délègue désormais
// toute la logique de connexion sécurisée à userController.loginUser
// qui utilise les mots de passe hashés + JWT.
const { loginUser } = require("../controllers/userController");

// 🔐 POST /api/auth/login
// Cette route appelle la même logique que /api/users/login
// afin d'éviter d'avoir deux systèmes d'authentification différents.
router.post("/login", loginUser);

module.exports = router;

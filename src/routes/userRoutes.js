const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  toggleActif,
} = require("../controllers/userController");

// Routes publiques
router.post("/register", registerUser);
router.post("/login", loginUser);

// Routes protégées Admin
router.get("/", protect, authorize("ADMIN"), getUsers);
router.post("/", protect, authorize("ADMIN"), createUser);
router.put("/:id", protect, authorize("ADMIN"), updateUser);
router.delete("/:id", protect, authorize("ADMIN"), deleteUser);
router.patch("/:id/reset-password", protect, authorize("ADMIN"), resetPassword);
router.patch("/:id/actif", protect, authorize("ADMIN"), toggleActif);

module.exports = router;

// src/controllers/userController.js
const User = require("../models/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Inscription
const registerUser = async (req, res) => {
  const { nom, prenom, email, password, role, classe } = req.body;
  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ message: "nom, prenom, email et mot de passe sont requis." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email).trim())) {
    return res.status(400).json({ message: "Format d'email invalide." });
  }
  try {
    const userExists = await User.findOne({ email: String(email).trim() });
    if (userExists) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Si le rôle n'est pas défini, par défaut attribuer "ELEVE"
    const userRole = role || "ELEVE"; 

    // Création de l'utilisateur
    // On accepte éventuellement un champ "classe" (ObjectId) pour rattacher
    // directement l'élève ou le prof à une classe. Cela ne met PAS encore
    // automatiquement à jour la liste des élèves dans la classe, c'est géré
    // par une route dédiée côté ClasseController.
    const user = await User.create({
      nom,
      prenom,
      email,
      password: hashedPassword,
      role: userRole,
      ...(classe && { classe }),
    });

    res.status(201).json(user); // Envoie l'utilisateur créé
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ message: "L'email est requis." });
  }
  if (!password || typeof password !== "string") {
    return res.status(400).json({ message: "Le mot de passe est requis." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ message: "Format d'email invalide." });
  }
  try {
    const user = await User.findOne({ email: email.trim() });
    if (!user) return res.status(400).json({ message: "Email ou mot de passe invalide" });
    if (user.actif === false) return res.status(403).json({ message: "Ce compte est désactivé. Contactez l'administration." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Email ou mot de passe invalide" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lister tous les utilisateurs (Admin), optionnel ?search= pour filtrer par nom, prénom, email
const getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search && typeof search === "string" && search.trim()) {
      const term = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(term, "i");
      filter.$or = [
        { nom: regex },
        { prenom: regex },
        { email: regex },
      ];
    }
    const users = await User.find(filter).select("-password").populate("classe", "nom");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Créer un utilisateur (Admin uniquement) — prof ou élève
const createUser = async (req, res) => {
  const { nom, prenom, email, password, role, classe } = req.body;
  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ message: "nom, prenom, email et password sont requis." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email).trim())) {
    return res.status(400).json({ message: "Format d'email invalide." });
  }
  if (String(password).length < 3) {
    return res.status(400).json({ message: "Le mot de passe doit contenir au moins 3 caractères." });
  }
  const userRole = role || "ELEVE";
  if (!["PROF", "ELEVE"].includes(userRole)) {
    return res.status(400).json({ message: "role doit être PROF ou ELEVE." });
  }
  try {
    const userExists = await User.findOne({ email: String(email).trim() });
    if (userExists) return res.status(400).json({ message: "Cet email est déjà utilisé." });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      nom,
      prenom,
      email,
      password: hashedPassword,
      role: userRole,
      ...(classe && { classe }),
    });
    const u = user.toObject();
    delete u.password;
    res.status(201).json(u);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Modifier un utilisateur (Admin uniquement)
const updateUser = async (req, res) => {
  const { nom, prenom, email, password, role, classe } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    if (nom !== undefined) user.nom = nom;
    if (prenom !== undefined) user.prenom = prenom;
    if (email !== undefined) {
      const exists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (exists) return res.status(400).json({ message: "Cet email est déjà utilisé." });
      user.email = email;
    }
    if (password !== undefined && password.trim() !== "") {
      user.password = await bcrypt.hash(password, 10);
    }
    if (role !== undefined && ["ADMIN", "PROF", "ELEVE"].includes(role)) user.role = role;
    if (classe !== undefined) user.classe = classe || null;
    await user.save();
    const u = user.toObject();
    delete u.password;
    res.json(u);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un utilisateur (Admin uniquement)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Utilisateur supprimé." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Réinitialiser le mot de passe (Admin uniquement)
const resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
    return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    user.password = await bcrypt.hash(newPassword.trim(), 10);
    await user.save();
    res.json({ message: "Mot de passe réinitialisé." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activer / Désactiver un compte (Admin uniquement)
const toggleActif = async (req, res) => {
  const { actif } = req.body;
  if (typeof actif !== "boolean") {
    return res.status(400).json({ message: "Le champ actif doit être true ou false." });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    if (user.role === "ADMIN") {
      return res.status(403).json({ message: "Impossible de désactiver un compte administrateur." });
    }
    user.actif = actif;
    await user.save();
    const u = user.toObject();
    delete u.password;
    res.json(u);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUsers, createUser, updateUser, deleteUser, resetPassword, toggleActif };

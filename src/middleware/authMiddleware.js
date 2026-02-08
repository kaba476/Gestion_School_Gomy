const jwt = require("jsonwebtoken");
const User = require("../models/UserModel"); // Assure-toi que ce chemin est correct

// Middleware pour protéger les routes (vérification du token JWT)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1]; // Extraire le token

      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Vérifier le token

      req.user = await User.findById(decoded.id).select("-password"); // Ajouter l'utilisateur dans la requête

      next(); // Passer à la route suivante
    } catch (error) {
      res.status(401).json({ message: "Non autorisé, token invalide" });
    }
  } else {
    res.status(401).json({ message: "Non autorisé, token manquant" });
  }
};

// Middleware pour vérifier le rôle de l'utilisateur (optionnel)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé pour ce rôle" });
    }
    next(); // L'utilisateur a le bon rôle, passer à la route suivante
  };
};

module.exports = { protect, authorize };

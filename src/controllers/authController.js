const User = require("../models/UserModel");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Utilisateur introuvable" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    res.json({
      _id: user._id,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const Cours = require("../models/CoursModel");
const User = require("../models/UserModel");

// 🔹 Créer un cours (réservé aux professeurs)
const createCours = async (req, res) => {
  const { nom, professeur, classe, description } = req.body;

  try {
    const cours = new Cours({
      nom,
      professeur,
      classe,
      description,
    });

    const savedCours = await cours.save();
    res.status(201).json(savedCours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Lister tous les cours (par ex. pour admin/prof)
const getCours = async (req, res) => {
  try {
    const cours = await Cours.find()
      .populate("professeur", "nom prenom")
      .populate("classe", "nom");

    res.json(cours);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🔹 Récupérer les cours de l’élève connecté
// On passe par req.user pour retrouver sa classe,
// puis on retourne tous les cours liés à cette classe.
const getCoursEleve = async (req, res) => {
  try {
    const eleveId = req.user._id;

    const eleve = await User.findById(eleveId);
    if (!eleve) {
      return res.status(404).json({ message: "Élève non trouvé" });
    }

    if (!eleve.classe) {
      return res.status(400).json({ message: "Élève non affecté à une classe" });
    }

    const cours = await Cours.find({ classe: eleve.classe })
      .populate("professeur", "nom prenom")
      .populate("classe", "nom");

    res.json(cours);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🔹 Récupérer les étudiants d'un cours spécifique (pour le prof ou l'admin)
const getElevesByCours = async (req, res) => {
  try {
    const coursId = req.params.id;
    const userId = req.user._id;
    const isAdmin = req.user.role === "ADMIN";

    const cours = await Cours.findById(coursId)
      .populate("classe", "nom")
      .populate("professeur", "nom prenom");

    if (!cours) return res.status(404).json({ message: "Cours non trouvé" });

    if (!isAdmin && (!cours.professeur || String(cours.professeur._id) !== String(userId))) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à accéder à ce cours" });
    }

    const eleves = await User.find({
      classe: cours.classe?._id,
      role: "ELEVE",
    }).select("nom prenom classe email");

    res.json({
      cours: {
        _id: cours._id,
        nom: cours.nom,
        classe: cours.classe?.nom,
      },
      eleves: eleves.map((e) => ({
        _id: e._id,
        nom: e.nom,
        prenom: e.prenom,
        classe: e.classe,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Modifier un cours (Admin ou prof propriétaire)
const updateCours = async (req, res) => {
  const { nom, professeur, classe, description } = req.body;
  try {
    const cours = await Cours.findById(req.params.id).populate("professeur", "_id");
    if (!cours) return res.status(404).json({ message: "Cours non trouvé" });

    const isAdmin = req.user.role === "ADMIN";
    const isProf = cours.professeur && String(cours.professeur._id) === String(req.user._id);
    if (!isAdmin && !isProf) {
      return res.status(403).json({ message: "Vous ne pouvez modifier que vos cours." });
    }

    if (nom !== undefined) cours.nom = nom;
    if (professeur !== undefined) cours.professeur = professeur;
    if (classe !== undefined) cours.classe = classe;
    if (description !== undefined) cours.description = description;
    await cours.save();

    const updated = await Cours.findById(cours._id)
      .populate("professeur", "nom prenom")
      .populate("classe", "nom");
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un cours (Admin ou prof propriétaire)
const deleteCours = async (req, res) => {
  try {
    const cours = await Cours.findById(req.params.id).populate("professeur", "_id");
    if (!cours) return res.status(404).json({ message: "Cours non trouvé" });

    const isAdmin = req.user.role === "ADMIN";
    const isProf = cours.professeur && String(cours.professeur._id) === String(req.user._id);
    if (!isAdmin && !isProf) {
      return res.status(403).json({ message: "Vous ne pouvez supprimer que vos cours." });
    }

    await Cours.findByIdAndDelete(req.params.id);
    res.json({ message: "Cours supprimé." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCours,
  getCours,
  getCoursEleve,
  getElevesByCours,
  updateCours,
  deleteCours,
};

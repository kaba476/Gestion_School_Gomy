const Classe = require("../models/ClasseModel");
const User = require("../models/UserModel");

// Creer une classe 
const createClasse = async (req, res) => {
  const { nom, description } = req.body;
  try {
    const classe = await Classe.create({ nom, description });
    res.status(201).json(classe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lister toutes les classes
const getClasses = async (req, res) => {
  try {
    const classes = await Classe.find().populate("eleves", "-password");
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔗 Affecter un élève à une classe
// Route pensée pour être utilisée depuis Postman ou le back-office admin.
// - Paramètre d'URL : :id = id de la classe
// - Body : { eleveId: "..." }
const addEleveToClasse = async (req, res) => {
  const classeId = req.params.id;
  const { eleveId } = req.body;

  if (!eleveId) {
    return res.status(400).json({ message: "L'id de l'élève (eleveId) est requis." });
  }

  try {
    const classe = await Classe.findById(classeId);
    if (!classe) {
      return res.status(404).json({ message: "Classe non trouvée" });
    }

    const eleve = await User.findById(eleveId);
    if (!eleve) {
      return res.status(404).json({ message: "Élève non trouvé" });
    }
    if (eleve.role !== "ELEVE") {
      return res.status(400).json({ message: "L'utilisateur n'est pas un élève" });
    }

    // Mise à jour de la classe sur l'utilisateur
    eleve.classe = classeId;
    await eleve.save();

    // Ajout dans la liste des élèves de la classe si pas déjà présent
    if (!classe.eleves.includes(eleveId)) {
      classe.eleves.push(eleveId);
      await classe.save();
    }

    const updatedClasse = await Classe.findById(classeId).populate("eleves", "-password");
    res.json(updatedClasse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Modifier une classe (Admin)
const updateClasse = async (req, res) => {
  const { nom, description } = req.body;
  try {
    const classe = await Classe.findById(req.params.id);
    if (!classe) return res.status(404).json({ message: "Classe non trouvée." });
    if (nom !== undefined) classe.nom = nom;
    if (description !== undefined) classe.description = description;
    await classe.save();
    res.json(await Classe.findById(classe._id).populate("eleves", "-password"));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une classe (Admin) — retire la classe des utilisateurs
const deleteClasse = async (req, res) => {
  try {
    const classe = await Classe.findById(req.params.id);
    if (!classe) return res.status(404).json({ message: "Classe non trouvée." });
    await User.updateMany({ classe: req.params.id }, { $set: { classe: null } });
    await Classe.findByIdAndDelete(req.params.id);
    res.json({ message: "Classe supprimée." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createClasse, getClasses, addEleveToClasse, updateClasse, deleteClasse };

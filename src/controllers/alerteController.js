const Alerte = require("../models/AlerteModel");

// 🔹 Créer une alerte (ADMIN) : soit pour un élève (seuil/absence), soit convocation pour un prof
const createAlerte = async (req, res) => {
  const { eleve, prof, cours, seuil, message } = req.body;

  if (!cours || !message || !message.trim()) {
    return res.status(400).json({ message: "Cours et message sont obligatoires." });
  }
  if (prof && eleve) {
    return res.status(400).json({ message: "Indiquez soit un élève soit un professeur, pas les deux." });
  }
  if (!prof && !eleve) {
    return res.status(400).json({ message: "Indiquez un élève ou un professeur (convocation)." });
  }

  try {
    const alerte = await Alerte.create({
      cours,
      message: message.trim(),
      seuil: seuil != null ? seuil : 1,
      ...(eleve && { eleve }),
      ...(prof && { prof }),
    });
    const populated = await Alerte.findById(alerte._id)
      .populate("eleve", "-password")
      .populate("prof", "nom prenom")
      .populate({ path: "cours", populate: { path: "professeur", select: "nom prenom" } });
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Convocation admin → professeur (ADMIN)
const createConvocation = async (req, res) => {
  const { prof, cours, message } = req.body;
  if (!prof || !cours || !message || !message.trim()) {
    return res.status(400).json({ message: "Prof, cours et message sont obligatoires." });
  }
  try {
    const alerte = await Alerte.create({
      prof,
      cours,
      message: message.trim(),
      seuil: 1,
    });
    const populated = await Alerte.findById(alerte._id)
      .populate("prof", "nom prenom")
      .populate({ path: "cours", select: "nom" });
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Lister les alertes destinées aux élèves (vue admin : uniquement "3 absences non justifiées")
// On n'affiche pas les anciennes alertes "Absence enregistrée pour le cours..." ni "Constat de l'administration..."
const getAlertes = async (req, res) => {
  try {
    const alertes = await Alerte.find({
      eleve: { $exists: true, $ne: null },
      message: /3 absences non justifiées/i,
    })
      .populate("eleve", "-password")
      .populate({
        path: "cours",
        populate: { path: "professeur", select: "nom prenom" },
      })
      .sort({ date: -1 });
    res.json(alertes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Lister les alertes de l'élève connecté
const getAlertesEleve = async (req, res) => {
  try {
    const eleveId = req.user._id;

    const alertes = await Alerte.find({ eleve: eleveId })
      .populate("cours")
      .sort({ date: -1 });

    res.json(alertes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Lister les alertes pour le professeur connecté (convocations admin uniquement)
const getAlertesProf = async (req, res) => {
  try {
    const profId = req.user._id;
    const alertes = await Alerte.find({ prof: profId })
      .populate("cours", "nom")
      .sort({ date: -1 });
    res.json(alertes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Marquer une alerte comme lue
const markAlerteLu = async (req, res) => {
  try {
    const alerte = await Alerte.findById(req.params.id);
    if (!alerte) {
      return res.status(404).json({ message: "Alerte non trouvée" });
    }

    if (req.user.role === "ELEVE" && String(alerte.eleve) !== String(req.user._id)) {
      return res.status(403).json({ message: "Vous ne pouvez modifier que vos propres alertes" });
    }
    if (req.user.role === "PROF" && String(alerte.prof) !== String(req.user._id)) {
      return res.status(403).json({ message: "Vous ne pouvez modifier que vos propres alertes" });
    }

    alerte.lu = true;
    await alerte.save();

    res.json(alerte);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAlerte, createConvocation, getAlertes, getAlertesEleve, getAlertesProf, markAlerteLu };

const EvaluationProf = require("../models/EvaluationProfModel");
const Alerte = require("../models/AlerteModel");

// 🔹 Élève : créer une évaluation sur un professeur pour un cours
// Body attendu : { professeur, cours, note, avis }
const createEvaluation = async (req, res) => {
  const eleveId = req.user._id;
  const { professeur, cours, note, avis } = req.body;

  if (!professeur || !cours || !note || !avis) {
    return res
      .status(400)
      .json({ message: "professeur, cours, note et avis sont obligatoires." });
  }

  try {
    const evaluation = await EvaluationProf.create({
      eleve: eleveId,
      professeur,
      cours,
      note,
      avis,
    });

    res.status(201).json(evaluation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Admin : lister toutes les évaluations
const getEvaluations = async (req, res) => {
  try {
    const evaluations = await EvaluationProf.find()
      .populate("eleve", "nom prenom email")
      .populate("professeur", "nom prenom email")
      .populate("cours", "nom");

    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Admin : rédiger un constat et envoyer un message au prof
// POST /api/evaluations/:id/constat
// Body : { message }
// On réutilise le système d'alertes existant pour que le prof voie le message
const createConstatForEvaluation = async (req, res) => {
  const { message } = req.body;
  const evaluationId = req.params.id;

  if (!message || !message.trim()) {
    return res
      .status(400)
      .json({ message: "Le message de constat est obligatoire." });
  }

  try {
    const evaluation = await EvaluationProf.findById(evaluationId)
      .populate("eleve", "nom prenom")
      .populate("professeur", "nom prenom")
      .populate("cours", "nom");

    if (!evaluation) {
      return res.status(404).json({ message: "Évaluation non trouvée" });
    }

    // On crée une alerte rattachée au cours et à l'élève,
    // mais le contenu est un constat de l'Admin destiné au professeur.
    const texteAlerte = `Constat de l'administration pour ${evaluation.professeur.prenom} ${evaluation.professeur.nom} (cours ${evaluation.cours.nom}) suite à l'avis d'un élève (note ${evaluation.note}/5) : ${message}`;

    const alerte = await Alerte.create({
      eleve: evaluation.eleve._id,
      cours: evaluation.cours._id,
      seuil: 1,
      message: texteAlerte,
    });

    res.status(201).json(alerte);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEvaluation,
  getEvaluations,
  createConstatForEvaluation,
};


const Justification = require("../models/JustificationModel");
const Notification = require("../models/NotificationModel");
const Presence = require("../models/PresenceModel");

// Ajouter une justification eleve
// L'élève connecté utilise req.user pour éviter de passer son ID dans le body
const addJustification = async (req, res) => {
  const eleveId = req.user._id;
  const { presence, motif } = req.body;

  if (!presence || !motif) {
    return res.status(400).json({ message: "La présence et le motif sont obligatoires." });
  }

  try {
    const justification = await Justification.create({ 
      eleve: eleveId, 
      presence, 
      motif 
    });
    res.status(201).json(justification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lister toutes les justifications (vue globale Admin/Prof)
// On peuple presence puis presence.cours pour avoir le cours et la date d'absence
const getJustifications = async (req, res) => {
  try {
    const justifications = await Justification.find()
      .populate("eleve", "-password")
      .populate({
        path: "presence",
        populate: { path: "cours", select: "nom" },
      })
      .sort({ date: -1 });
    res.json(justifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Lister les justifications de l'élève connecté
const getJustificationsEleve = async (req, res) => {
  try {
    const eleveId = req.user._id;

    const justifications = await Justification.find({ eleve: eleveId })
      .populate("presence")
      .sort({ date: -1 });

    res.json(justifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour le statut (Admin/Prof) + commentaire optionnel
// Body : { statut, commentaireAdmin? }
const updateJustificationStatus = async (req, res) => {
  const { statut, commentaireAdmin } = req.body;
  if (!statut || !["EN_ATTENTE", "ACCEPTE", "REFUSE"].includes(statut)) {
    return res.status(400).json({ message: "Statut invalide (ACCEPTE ou REFUSE)." });
  }
  try {
    const justification = await Justification.findById(req.params.id)
      .populate("eleve")
      .populate("presence");

    if (!justification) return res.status(404).json({ message: "Justification non trouvée" });

    justification.statut = statut;
    if (commentaireAdmin !== undefined) justification.commentaireAdmin = String(commentaireAdmin).trim();
    await justification.save();

    if (statut === "ACCEPTE" && justification.presence && justification.presence._id) {
      await Presence.findByIdAndUpdate(justification.presence._id, { justifie: true });
    }

    let message = statut === "ACCEPTE" ? "Justification approuvée" : "Justification refusée";
    if (justification.commentaireAdmin) message += " : " + justification.commentaireAdmin;

    await Notification.create({
      eleve: justification.eleve._id,
      justification: justification._id,
      message: message,
      lu: false,
    });

    res.json(justification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ajouter ou modifier le commentaire admin (Admin uniquement)
const updateJustificationComment = async (req, res) => {
  const { commentaireAdmin } = req.body;
  try {
    const justification = await Justification.findById(req.params.id);
    if (!justification) return res.status(404).json({ message: "Justification non trouvée" });
    justification.commentaireAdmin = commentaireAdmin != null ? String(commentaireAdmin).trim() : "";
    await justification.save();
    res.json(justification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addJustification,
  getJustifications,
  getJustificationsEleve,
  updateJustificationStatus,
  updateJustificationComment,
};

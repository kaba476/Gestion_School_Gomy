const Presence = require("../models/PresenceModel");
const Cours = require("../models/CoursModel");
const User = require("../models/UserModel");
const Alerte = require("../models/AlerteModel");

// 🔹 Créer une présence
// On attend côté frontend un champ "etat" (present/absent/retard)
// que l'on enregistre directement sur le modèle Presence.
const createPresence = async (req, res) => {
  const { eleve, cours, etat, date } = req.body;
  try {
    const presence = await Presence.create({ 
      eleve, 
      cours, 
      etat,
      date: date ? new Date(date) : new Date()
    });
    res.status(201).json(presence);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Compter les absences non justifiées d'un élève et créer une alerte si >= 3
async function checkAlerte3Absences(eleveId, coursId) {
  const count = await Presence.countDocuments({
    eleve: eleveId,
    etat: "absent",
    $or: [{ justifie: { $ne: true } }, { justifie: null }],
  });
  if (count < 3) return;
  const existe = await Alerte.findOne({
    eleve: eleveId,
    message: /3 absences non justifiées/i,
  });
  if (existe) return;
  await Alerte.create({
    eleve: eleveId,
    cours: coursId,
    seuil: 3,
    message: "Vous avez 3 absences non justifiées.",
  });
}

// 🔹 Créer plusieurs présences en une fois (appel pour une date)
// Body : { cours: "...", date: "...", presences: [{ eleve: "...", etat: "present|absent|retard" }] }
// Les présences s'ajoutent au fur et à mesure. Si un élève atteint 3 absences non justifiées, il reçoit une alerte.
const createAppel = async (req, res) => {
  const { cours, date, presences } = req.body;
  const profId = req.user._id;

  if (!cours || !date || !presences || !Array.isArray(presences)) {
    return res.status(400).json({
      message: "Les champs cours, date et presences (tableau) sont requis",
    });
  }

  try {
    const coursDoc = await Cours.findById(cours).populate("professeur");
    if (!coursDoc) {
      return res.status(404).json({ message: "Cours non trouvé" });
    }
    if (String(coursDoc.professeur._id) !== String(profId)) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à faire l'appel pour ce cours" });
    }

    const dateAppel = new Date(date);
    const dateDebut = new Date(dateAppel);
    dateDebut.setHours(0, 0, 0, 0);
    const dateFin = new Date(dateAppel);
    dateFin.setHours(23, 59, 59, 999);

    const dejaValidee = await Presence.findOne({
      cours,
      date: { $gte: dateDebut, $lte: dateFin },
      validee: true,
    });
    if (dejaValidee) {
      return res.status(403).json({
        message: "Les présences de ce cours pour cette date ont déjà été validées par l'administration. Aucune modification possible.",
      });
    }

    // Une seule présence par (élève, cours, date) : on met à jour si elle existe, sinon on crée
    const presencesResult = [];
    const elevesAbsents = new Set();

    for (const p of presences) {
      const etat = p.etat || "absent";
      const presence = await Presence.findOneAndUpdate(
        {
          eleve: p.eleve,
          cours,
          date: { $gte: dateDebut, $lte: dateFin },
        },
        { $set: { etat }, $setOnInsert: { eleve: p.eleve, cours, date: dateAppel } },
        { new: true, upsert: true }
      );
      presencesResult.push(presence);
      if (etat === "absent") elevesAbsents.add(p.eleve);
    }

    for (const eleveId of elevesAbsents) {
      await checkAlerte3Absences(eleveId, cours);
    }

    res.status(201).json({
      message: `${presencesResult.length} présence(s) enregistrée(s) pour ce cours et cette date.`,
      presences: presencesResult,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Clé unique (élève + cours + jour) pour dédupliquer
function presenceDayKey(p) {
  const eleveId = (p.eleve && (p.eleve._id || p.eleve)) ? (p.eleve._id || p.eleve).toString() : "";
  const coursId = (p.cours && (p.cours._id || p.cours)) ? (p.cours._id || p.cours).toString() : "";
  const d = p.date ? new Date(p.date) : new Date();
  const dateStr = d.toISOString().split("T")[0];
  return `${eleveId}|${coursId}|${dateStr}`;
}

// 🔹 Lister les présences (optionnel : ?cours=id). Une seule présence par (élève, cours, date).
const getPresences = async (req, res) => {
  try {
    const { cours: coursId } = req.query;
    const filter = coursId ? { cours: coursId } : {};
    const presences = await Presence.find(filter)
      .populate("eleve", "-password")
      .populate({
        path: "cours",
        populate: { path: "professeur", select: "nom prenom" },
      })
      .sort({ date: -1, _id: -1, eleve: 1 });

    // Dédupliquer : ne garder qu'une présence par (élève, cours, jour) — la plus récente (_id max)
    const byKey = new Map();
    for (const p of presences) {
      const key = presenceDayKey(p);
      if (!byKey.has(key)) byKey.set(key, p);
    }
    const deduplicated = Array.from(byKey.values()).sort(
      (a, b) => new Date(b.date) - new Date(a.date) || (a.eleve?.nom || "").localeCompare(b.eleve?.nom || "")
    );

    res.json(deduplicated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Récupérer les présences de l’élève connecté
// On utilise req.user (rempli par le middleware protect)
// pour éviter de passer l'ID élève dans le corps de la requête.
const getPresencesEleve = async (req, res) => {
  try {
    const eleveId = req.user._id;

    const eleve = await User.findById(eleveId);
    if (!eleve) return res.status(404).json({ message: "Élève non trouvé" });

    const presences = await Presence.find({ eleve: eleveId })
      .populate("cours", "nom")
      .sort({ date: -1, _id: -1 });

    const byKey = new Map();
    for (const p of presences) {
      const coursId = (p.cours && (p.cours._id || p.cours)) ? (p.cours._id || p.cours).toString() : "";
      const dateStr = p.date ? new Date(p.date).toISOString().split("T")[0] : "";
      const key = `${coursId}|${dateStr}`;
      if (!byKey.has(key)) byKey.set(key, p);
    }
    const deduplicated = Array.from(byKey.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(deduplicated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🔹 Modifier une présence (état) — Prof du cours ou Admin. Impossible si déjà validée pour la journée.
const updatePresence = async (req, res) => {
  const { etat } = req.body;
  const presenceId = req.params.id;
  const userId = req.user._id;
  const userRole = req.user.role;

  if (!etat || !["present", "absent", "retard"].includes(etat)) {
    return res.status(400).json({ message: "etat requis : present, absent ou retard" });
  }

  try {
    const presence = await Presence.findById(presenceId).populate({
      path: "cours",
      populate: { path: "professeur", select: "_id" },
    });
    if (!presence) {
      return res.status(404).json({ message: "Présence non trouvée" });
    }
    if (presence.validee) {
      return res.status(403).json({ message: "Les présences de cette journée ont été validées. Modification impossible." });
    }

    const isAdmin = userRole === "ADMIN";
    const isProfDuCours =
      presence.cours?.professeur && String(presence.cours.professeur._id) === String(userId);

    if (!isAdmin && !isProfDuCours) {
      return res.status(403).json({ message: "Vous ne pouvez modifier que les présences de vos cours." });
    }

    presence.etat = etat;
    await presence.save();

    res.json(presence);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Valider les présences pour un cours et une date (ADMIN). Après validation, plus de modification.
const validerPresencesJournee = async (req, res) => {
  const { cours, date } = req.body;
  if (!cours || !date) {
    return res.status(400).json({ message: "Cours et date sont obligatoires." });
  }
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Réservé à l'administration." });
  }

  try {
    const dateDebut = new Date(date);
    dateDebut.setHours(0, 0, 0, 0);
    const dateFin = new Date(date);
    dateFin.setHours(23, 59, 59, 999);

    const result = await Presence.updateMany(
      { cours, date: { $gte: dateDebut, $lte: dateFin } },
      { $set: { validee: true } }
    );
    res.json({
      message: "Présences validées pour la journée. Aucune modification possible.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPresence,
  createAppel,
  getPresences,
  getPresencesEleve,
  updatePresence,
  validerPresencesJournee,
};

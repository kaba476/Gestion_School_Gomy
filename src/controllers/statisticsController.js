const Presence = require("../models/PresenceModel");
const Classe = require("../models/ClasseModel");
const Cours = require("../models/CoursModel");
const User = require("../models/UserModel");

// 📊 Résumé dashboard : totaux + taux absence + élève/classe les plus absents
async function getDashboardResume() {
  const [totalEleves, totalProfs, totalClasses, presencesAll, elevePlusAbsent, classePlusAbsente] = await Promise.all([
    User.countDocuments({ role: "ELEVE" }),
    User.countDocuments({ role: "PROF" }),
    Classe.countDocuments(),
    Presence.find().select("etat eleve cours"),
    Presence.aggregate([
      { $match: { etat: "absent" } },
      { $group: { _id: "$eleve", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "eleveDoc" } },
      { $unwind: { path: "$eleveDoc", preserveNullAndEmptyArrays: true } },
      { $project: { prenom: "$eleveDoc.prenom", nom: "$eleveDoc.nom", nbAbsences: "$count" } },
    ]),
    Presence.aggregate([
      { $match: { etat: "absent" } },
      { $lookup: { from: "cours", localField: "cours", foreignField: "_id", as: "coursDoc" } },
      { $unwind: "$coursDoc" },
      { $group: { _id: "$coursDoc.classe", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $lookup: { from: "classes", localField: "_id", foreignField: "_id", as: "classeDoc" } },
      { $unwind: { path: "$classeDoc", preserveNullAndEmptyArrays: true } },
      { $project: { nom: "$classeDoc.nom", nbAbsences: "$count" } },
    ]),
  ]);

  const total = presencesAll.length;
  const absents = presencesAll.filter((p) => p.etat === "absent").length;
  const tauxAbsenceGlobal = total > 0 ? Math.round((absents / total) * 1000) / 10 : 0;

  return {
    totalEleves,
    totalProfs,
    totalClasses,
    tauxAbsenceGlobal,
    eleveLePlusAbsent: elevePlusAbsent[0] ? { prenom: elevePlusAbsent[0].prenom, nom: elevePlusAbsent[0].nom, nbAbsences: elevePlusAbsent[0].nbAbsences } : null,
    classeLaPlusAbsente: classePlusAbsente[0] ? { nom: classePlusAbsente[0].nom, nbAbsences: classePlusAbsente[0].nbAbsences } : null,
  };
}

// 📊 Statistiques de présences avec filtres (classe, cours, période)
// Query params : ?classe=...&cours=...&debut=...&fin=...
const getStatistics = async (req, res) => {
  try {
    const dashboard = await getDashboardResume();
    const { classe, cours, debut, fin } = req.query;

    // Construire le filtre de date
    const dateFilter = {};
    if (debut) dateFilter.$gte = new Date(debut);
    if (fin) {
      const finDate = new Date(fin);
      finDate.setHours(23, 59, 59, 999); // Fin de journée
      dateFilter.$lte = finDate;
    }

    // Construire le filtre général
    const filter = {};
    if (classe) {
      // Trouver tous les cours de cette classe
      const coursDeLaClasse = await Cours.find({ classe }).select("_id");
      filter.cours = { $in: coursDeLaClasse.map(c => c._id) };
    }
    if (cours) filter.cours = cours;
    if (Object.keys(dateFilter).length > 0) filter.date = dateFilter;

    // Récupérer toutes les présences correspondantes
    const presences = await Presence.find(filter)
      .populate("eleve", "nom prenom classe")
      .populate({
        path: "cours",
        select: "nom classe",
        populate: {
          path: "classe",
          select: "nom",
        },
      });

    // Calculer les statistiques
    const total = presences.length;
    const presents = presences.filter(p => p.etat === "present").length;
    const absents = presences.filter(p => p.etat === "absent").length;
    const retards = presences.filter(p => p.etat === "retard").length;

    // Statistiques par classe
    const statsParClasse = {};
    presences.forEach(p => {
      const classeNom = p.cours?.classe?.nom || "Non assigné";
      if (!statsParClasse[classeNom]) {
        statsParClasse[classeNom] = { presents: 0, absents: 0, retards: 0, total: 0 };
      }
      statsParClasse[classeNom].total++;
      if (p.etat === "present") statsParClasse[classeNom].presents++;
      else if (p.etat === "absent") statsParClasse[classeNom].absents++;
      else if (p.etat === "retard") statsParClasse[classeNom].retards++;
    });

    // Statistiques par cours
    const statsParCours = {};
    presences.forEach(p => {
      const coursNom = p.cours?.nom || "Cours inconnu";
      if (!statsParCours[coursNom]) {
        statsParCours[coursNom] = { presents: 0, absents: 0, retards: 0, total: 0 };
      }
      statsParCours[coursNom].total++;
      if (p.etat === "present") statsParCours[coursNom].presents++;
      else if (p.etat === "absent") statsParCours[coursNom].absents++;
      else if (p.etat === "retard") statsParCours[coursNom].retards++;
    });

    // Graphiques : absences par mois, évolution taux de présence par mois
    const moisLabels = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
    const byMonth = {};
    presences.forEach(p => {
      const d = new Date(p.date);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { total: 0, presents: 0, absents: 0, retards: 0 };
      byMonth[key].total++;
      if (p.etat === "present") byMonth[key].presents++;
      else if (p.etat === "absent") byMonth[key].absents++;
      else byMonth[key].retards++;
    });
    const sortedMonths = Object.keys(byMonth).sort();
    const absencesParMois = sortedMonths.map((mois) => {
      const [y, m] = mois.split("-").map(Number);
      const label = `${moisLabels[m - 1]} ${y}`;
      return { mois, label, absences: byMonth[mois].absents };
    });
    const evolutionTauxPresence = sortedMonths.map((mois) => {
      const [y, m] = mois.split("-").map(Number);
      const label = `${moisLabels[m - 1]} ${y}`;
      const t = byMonth[mois].total;
      const taux = t > 0 ? Math.round((byMonth[mois].presents / t) * 1000) / 10 : 0;
      return { mois, label, tauxPresence: taux, total: t };
    });

    // Comparaison entre classes (taux de présence par classe)
    const comparaisonClasses = Object.entries(statsParClasse).map(([nom, s]) => ({
      nom,
      total: s.total,
      presents: s.presents,
      absents: s.absents,
      retards: s.retards,
      tauxPresence: s.total > 0 ? Math.round((s.presents / s.total) * 1000) / 10 : 0,
    })).sort((a, b) => a.nom.localeCompare(b.nom));

    res.json({
      dashboard,
      global: {
        total,
        presents,
        absents,
        retards,
      },
      parClasse: statsParClasse,
      parCours: statsParCours,
      absencesParMois,
      evolutionTauxPresence,
      comparaisonClasses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStatistics };

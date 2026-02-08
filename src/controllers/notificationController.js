const Notification = require("../models/NotificationModel");

// 🔔 Récupérer les notifications de l'élève connecté
const getNotificationsEleve = async (req, res) => {
  try {
    const eleveId = req.user._id;

    const notifications = await Notification.find({ eleve: eleveId })
      .populate("justification")
      .sort({ date: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔔 Marquer une notification comme lue
const markNotificationLu = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée" });
    }

    // Vérifier que l'élève connecté est bien le destinataire
    if (String(notification.eleve) !== String(req.user._id)) {
      return res.status(403).json({ message: "Vous ne pouvez modifier que vos propres notifications" });
    }

    notification.lu = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotificationsEleve, markNotificationLu };

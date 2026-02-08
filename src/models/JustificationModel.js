const mongoose = require("mongoose");

const justificationSchema = new mongoose.Schema({
  eleve: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  presence: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Presence",
    required: true,
  },
  motif: {
    type: String,
    required: true,
  },
  statut: {
    type: String,
    enum: ["EN_ATTENTE", "ACCEPTE", "REFUSE"],
    default: "EN_ATTENTE",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  commentaireAdmin: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("Justification", justificationSchema);

const mongoose = require("mongoose");

const presenceSchema = new mongoose.Schema({
  eleve: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cours: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cours",
    required: true,
  },
  etat: {
    type: String,
    enum: ["present", "absent", "retard"],
    default: "absent",
  },
  justifie: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  // Une fois validée par l'admin pour la journée, plus de modification
  validee: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Presence", presenceSchema);

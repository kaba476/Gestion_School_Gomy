const mongoose = require("mongoose");

const alerteSchema = new mongoose.Schema({
  cours: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cours",
    required: true
  },
  // Alerte pour un élève (ex: 3 absences non justifiées)
  eleve: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  // Convocation admin → professeur
  prof: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  seuil: {
    type: Number,
    default: 1
  },
  message: {
    type: String,
    default: "Alerte d'absence"
  },
  lu: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Alerte", alerteSchema);

const mongoose = require("mongoose");

const evaluationProfSchema = new mongoose.Schema({
  eleve: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  professeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cours: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cours",
    required: true,
  },
  note: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  avis: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("EvaluationProf", evaluationProfSchema);


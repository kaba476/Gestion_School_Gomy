const mongoose = require("mongoose");

const classeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
  },
  // Liste d'élèves 
  eleves: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("Classe", classeSchema);

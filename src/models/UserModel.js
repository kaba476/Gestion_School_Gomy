const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String,
    enum: ["ADMIN", "PROF", "ELEVE"],
    default: "ELEVE"
  },
  classe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Classe"
  },
  actif: {
    type: Boolean,
    default: true
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);

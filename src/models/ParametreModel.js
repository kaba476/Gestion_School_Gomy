const mongoose = require("mongoose");

const ParametreSchema = new mongoose.Schema({
  modeSeuil: { type: String, enum: ["GLOBAL", "MATIERE"], default: "GLOBAL" },
  seuilGlobal: { type: Number, default: 3 },
  emailNotif: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Parametre", ParametreSchema);

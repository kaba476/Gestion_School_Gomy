const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  eleve: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  justification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Justification",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  lu: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);

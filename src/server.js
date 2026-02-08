const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// 🔹 Routes
const userRoutes = require("./routes/userRoutes");
const classeRoutes = require("./routes/classeRoutes");
const coursRoutes = require("./routes/coursRoutes");
const presenceRoutes = require("./routes/presenceRoutes");
const justificationRoutes = require("./routes/justificationRoutes");
const alerteRoutes = require("./routes/alerteRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const statisticsRoutes = require("./routes/statisticsRoutes"); // ✅ import manquant corrigé
const authRoutes = require("./routes/authRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");



// Charger les variables 
dotenv.config();

// Connexion MongoDB
connectDB();

const app = express();

// Sécurité : en-têtes HTTP (XSS, Content-Type, etc.)
app.use(helmet());

// Limitation du nombre de requêtes (anti brute-force / abus)
const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requêtes max par fenêtre
  message: { message: "Trop de requêtes. Réessayez plus tard." },
});
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 tentatives de login par 15 min
  message: { message: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
});

// CORS : en production, autoriser uniquement l’origine du frontend (variable FRONTEND_URL)
const corsOptions = process.env.FRONTEND_URL
  ? { origin: process.env.FRONTEND_URL.split(",").map((o) => o.trim()), optionsSuccessStatus: 200 }
  : { origin: true }; // dev : tout autoriser
app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/", limiterGeneral);
app.use("/api/auth/login", limiterAuth);

// 🔹 Routes
app.use("/api/users", userRoutes);
app.use("/api/classes", classeRoutes);
app.use("/api/cours", coursRoutes);
app.use("/api/presences", presenceRoutes);
app.use("/api/justifications", justificationRoutes);
app.use("/api/alertes", alerteRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/evaluations", evaluationRoutes);








app.get("/", (req, res) => {
  res.send("API Gestion École OK ✅");
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

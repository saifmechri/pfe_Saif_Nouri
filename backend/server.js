require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const { registerRoutes } = require("./routes");
const recommendationRoutes = require("./routes/recommendations");
const { initDatabase, testConnection } = require("./db");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Route racine
app.get("/", (req, res) => {
  res.json({ 
    message: "Bienvenue sur l'API d'authentification",
    routes: {
      register: "POST /api/auth/register",
      login: "POST /api/auth/login",
      profile: "GET /api/auth/profile (protégée - nécessite token JWT)",
      vehicules: "CRUD /api/vehicules (protégé - nécessite token JWT)",
      garages: "CRUD /api/garages",
      interventions: "CRUD /api/vehicules/:vehicleId/interventions (protégé)"
    }
  });
});

registerRoutes(app);
// Removed duplicate/misspelled route mount to keep canonical routes from `registerRoutes`.
// app.use("/api/recommandations", recommendationRoutes);

// Gestion globale des erreurs applicatives (AppError et erreurs inattendues)
app.use(errorHandler);

const startServer = async () => {
  try {
    console.log('Startup step: PostgreSQL connection test');
    await testConnection();
    console.log('Connexion PostgreSQL (Supabase) OK');

    console.log('Startup step: database compatibility bootstrap');
    await initDatabase();
    console.log('Schéma PostgreSQL vérifié');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Erreur de démarrage backend:', error);
    process.exit(1);
  }
};

startServer();


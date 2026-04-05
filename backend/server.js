require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const vehiculeRoutes = require("./routes/vehicules");
const interventionRoutes = require("./routes/interventions");
const pieceRoutes = require("./routes/pieces");
const recommendationsRoutes = require("./routes/recommendations");
const { sequelize, pool } = require("./db");

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
      interventions: "CRUD /api/vehicules/:vehicleId/interventions (protégé)"
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/vehicules", vehiculeRoutes);
app.use("/api/pieces", pieceRoutes);
app.use("/api/recommandations", recommendationsRoutes);
app.use("/api/recommendations", recommendationsRoutes);

// Route pour les interventions d'un véhicule
app.use("/api/vehicules/:vehicleId/interventions", interventionRoutes);

// Initialiser la base de données Sequelize et démarrer le serveur
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Sequelize connecté à la base de données PostgreSQL');
    
    // Synchroniser les modèles (création des tables si nécessaire)
    await sequelize.sync({ alter: true });
    console.log('Modèles Sequelize synchronisés');

    // Compatibilité avec le schéma users existant utilisé par authController en SQL brut
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await pool.query("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL");
    await pool.query("UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL");
    console.log('Schéma users vérifié (password, created_at, updated_at)');

    // Compatibilité avec le schéma vehicules existant utilisé par vehiculeController en SQL brut
    await pool.query("ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await pool.query("ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await pool.query("UPDATE vehicules SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL");
    await pool.query("UPDATE vehicules SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL");
    console.log('Schéma vehicules vérifié (created_at, updated_at)');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Erreur de connexion Sequelize:', error);
    process.exit(1);
  }
};

startServer();
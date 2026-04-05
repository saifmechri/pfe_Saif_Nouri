require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const vehiculeRoutes = require("./routes/vehicules");
const interventionRoutes = require("./routes/interventions");
const pieceRoutes = require("./routes/pieces");
const recommendationRoutes = require("./routes/recommendations");
const { initDatabase, testConnection } = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenue sur l API backend",
    routes: {
      register: "POST /api/auth/register",
      login: "POST /api/auth/login",
      profile: "GET /api/auth/profile",
      vehicules: "CRUD /api/vehicules",
      interventions: "CRUD /api/vehicules/:vehicleId/interventions",
      recommendations: "GET /api/recommendations/classees"
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/vehicules", vehiculeRoutes);
app.use("/api/pieces", pieceRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/vehicules/:vehicleId/interventions", interventionRoutes);

const startServer = async () => {
  try {
    await testConnection();
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Erreur de demarrage backend:", error);
    process.exit(1);
  }
};

startServer();

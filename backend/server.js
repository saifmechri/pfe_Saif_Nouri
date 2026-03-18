const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const vehiculeRoutes = require("./routes/vehicules");

const app = express();

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
      vehicules: "CRUD /api/vehicules (protégé - nécessite token JWT)"
    }
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/vehicules", vehiculeRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
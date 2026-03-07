const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

// Route racine
app.get("/", (req, res) => {
  res.json({ 
    message: "Bienvenue sur l'API d'authentification",
    routes: {
      register: "POST /api/auth/register",
      login: "POST /api/auth/login",
      profile: "GET /api/auth/profile (protégée - nécessite token JWT)"
    }
  });
});

app.use("/api/auth", authRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
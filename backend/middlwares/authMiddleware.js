const jwt = require("jsonwebtoken");
const pool = require("../db");

const SECRET = "jwt_secret_key";

const verifyToken = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Token non fourni" });
    }

    // Le format attendu est: "Bearer TOKEN"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Format de token invalide" });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, SECRET);

    // Vérifier si l'utilisateur existe toujours dans la base de données
    const user = await pool.query("SELECT id, name, email, created_at FROM users WHERE id=$1", [decoded.id]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    // Attacher les informations de l'utilisateur à la requête
    req.user = user.rows[0];
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token invalide" });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expiré" });
    }
    console.log(err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = { verifyToken };

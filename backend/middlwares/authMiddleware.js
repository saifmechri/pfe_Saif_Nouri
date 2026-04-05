const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const SECRET = process.env.JWT_SECRET || "jwt_secret_key";

/**
 * Vérifie le JWT, charge l'utilisateur courant et attache req.user.
 * Bloque la requête avec 401 si le token est absent, expiré ou invalide.
 */
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

    // Vérifier si l'utilisateur existe toujours dans la base de données ET récupérer son rôle
    const user = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at, u.updated_at, r.name as role 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    // Attacher les informations de l'utilisateur à la requête (avec le rôle)
    req.user = user.rows[0];
    next();
  } catch (err) {
    // L'expiration du JWT est un cas attendu en production, on évite un log d'erreur bruyant.
    if (err.name === "TokenExpiredError") {
      console.warn("Token expiré dans verifyToken");
      return res.status(401).json({ message: "Token expiré", code: "TOKEN_EXPIRED" });
    }

    console.error("Erreur dans verifyToken:", err.name, err.message);
    
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token invalide", code: "TOKEN_INVALID" });
    }
    
    // Toute autre erreur JWT doit être traitée comme une erreur 401
    return res.status(401).json({ message: "Erreur d'authentification" });
  }
};

module.exports = { verifyToken };

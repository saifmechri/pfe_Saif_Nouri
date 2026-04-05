const jwt = require("jsonwebtoken");
const { pool } = require("../db");

const SECRET = process.env.JWT_SECRET || "jwt_secret_key";

const isTransientDbError = (error) => {
  const transientCodes = new Set(["ECONNRESET", "ETIMEDOUT", "EPIPE", "57P01", "57P02", "57P03"]);
  return transientCodes.has(error?.code) || /connection terminated unexpectedly/i.test(error?.message || "");
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchUserForToken = async (userId) => {
  const query = `SELECT u.id, u.name, u.email, u.created_at, u.updated_at, r.name as role 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1`;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await pool.query(query, [userId]);
    } catch (error) {
      if (!isTransientDbError(error) || attempt === 2) {
        throw error;
      }

      // Petit retry pour les coupures réseau transitoires (Supabase/PG over TLS).
      await wait(150);
    }
  }

  return { rows: [] };
};

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
    const user = await fetchUserForToken(decoded.id);

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

    if (isTransientDbError(err)) {
      return res.status(503).json({ message: "Service d'authentification temporairement indisponible", code: "AUTH_DB_UNAVAILABLE" });
    }
    
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token invalide", code: "TOKEN_INVALID" });
    }
    
    // Toute autre erreur JWT doit être traitée comme une erreur 401
    return res.status(401).json({ message: "Erreur d'authentification" });
  }
};

module.exports = { verifyToken };

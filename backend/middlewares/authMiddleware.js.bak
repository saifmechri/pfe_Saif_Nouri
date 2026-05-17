const jwt = require("jsonwebtoken");
const { findUserForAuthById } = require("../models/user.model");

const SECRET = process.env.JWT_SECRET || "jwt_secret_key";
const { AppError } = require("../utils/appError");
const { logger } = require("../utils/logger");
const isTransientDbError = (error) => {
  const transientCodes = new Set(["ECONNRESET", "ETIMEDOUT", "EPIPE", "57P01", "57P02", "57P03"]);
  return transientCodes.has(error?.code) || /connection terminated unexpectedly/i.test(error?.message || "");
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchUserForToken = async (userId) => {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const user = await findUserForAuthById(userId);
      return { rows: user ? [user] : [] };
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

/**
 * Vérifie le JWT, charge l'utilisateur courant et attache req.user.
 * Bloque la requÃªte avec 401 si le token est absent, expiré ou invalide.
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('Token non fourni', 401, 'TOKEN_MISSING');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError('Format de token invalide', 401, 'TOKEN_INVALID_FORMAT');
    }

    const decoded = jwt.verify(token, SECRET);

    // Admin token fallback: allow platform access even if no DB user id is embedded.
    if (decoded?.admin === true && (!decoded?.id || Number.isNaN(Number(decoded.id)))) {
      req.user = {
        id: null,
        name: 'Administrateur',
        email: decoded.email || null,
        role: 'admin'
      };
      return next();
    }

    const user = await fetchUserForToken(decoded.id);

    if (user.rows.length === 0) {
      if (decoded?.admin === true) {
        req.user = {
          id: decoded.id || null,
          name: 'Administrateur',
          email: decoded.email || null,
          role: 'admin'
        };
        return next();
      }

      throw new AppError('Utilisateur non trouve', 401, 'USER_NOT_FOUND');
    }

    req.user = user.rows[0];
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      logger.warn('Token expire dans verifyToken');
      return res.status(401).json({
        success: false,
        message: 'Token expire',
        data: null,
        error: { code: 'TOKEN_EXPIRED' }
      });
    }

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        data: null,
        error: { code: err.errorCode || 'AUTH_ERROR' }
      });
    }

    logger.error('Erreur dans verifyToken', { name: err.name, message: err.message });

    if (isTransientDbError(err)) {
      return res.status(503).json({
        success: false,
        message: "Service d'authentification temporairement indisponible",
        data: null,
        error: { code: 'AUTH_DB_UNAVAILABLE' }
      });
    }
    
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
        data: null,
        error: { code: 'TOKEN_INVALID' }
      });
    }

    return res.status(401).json({
      success: false,
      message: "Erreur d'authentification",
      data: null,
      error: { code: 'AUTHENTICATION_ERROR' }
    });
  }
};

module.exports = { verifyToken };



const { pool } = require("../db");
const { AppError } = require("../utils/appError");

/**
 * Middleware de vérification de rôle utilisateur
 * Vérifie si l'utilisateur authentifié possède un des rôles autorisés
 * 
 * @param {...string} allowedRoles - Liste des rôles autorisés
 * @returns {Function} Middleware Express
 * 
 * @example
 * // Autoriser plusieurs rôles
 * router.get('/route', verifyToken, checkRole('admin', 'garage'), handler);
 * 
 * // Autoriser un seul rôle
 * router.post('/admin-only', verifyToken, checkRole('admin'), handler);
 */
const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        throw new AppError('Utilisateur sans role defini', 403, 'ROLE_NOT_DEFINED');
      }

      if (!allowedRoles.includes(userRole)) {
        throw new AppError('Acces refuse : permissions insuffisantes', 403, 'FORBIDDEN_ROLE');
      }

      req.userRole = userRole;
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Middleware pré-configuré : Seuls les administrateurs
 * @type {Function}
 */
const isAdmin = checkRole('admin');

/**
 * Middleware pré-configuré : Professionnels (garages, vendeurs) et admins
 * @type {Function}
 */
const isProfessional = checkRole('garage', 'vendeur', 'admin');

/**
 * Middleware pré-configuré : Seulement les automobilistes
 * @type {Function}
 */
const isAutomobiliste = checkRole('automobiliste');

/**
 * Middleware pré-configuré : Seulement les garages
 * @type {Function}
 */
const isGarage = checkRole('garage');

/**
 * Middleware pré-configuré : Seulement les vendeurs
 * @type {Function}
 */
const isVendeur = checkRole('vendeur');
const isVendeurOrAdmin = checkRole('vendeur', 'admin');

/**
 * Fonction helper pour vérifier si un utilisateur a un rôle spécifique
 * Utile pour des vérifications conditionnelles dans les contrôleurs
 * 
 * @param {number} userId - ID de l'utilisateur
 * @param {string} roleName - Nom du rôle à vérifier
 * @returns {Promise<boolean>} true si l'utilisateur a le rôle
 * 
 * @example
 * const isUserAdmin = await hasRole(req.user.id, 'admin');
 * if (isUserAdmin) {
 *   // Logique spécifique admin
 * }
 */
const hasRole = async (userId, roleName) => {
  try {
    const result = await pool.query(
      `SELECT r.name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = $1 AND r.name = $2`,
      [userId, roleName]
    );
    return result.rows.length > 0;
  } catch (err) {
    console.error("Erreur hasRole:", err);
    return false;
  }
};

module.exports = { 
  checkRole, 
  isAdmin, 
  isProfessional, 
  isAutomobiliste,
  isGarage,
  isVendeur,
  isVendeurOrAdmin,
  hasRole
};
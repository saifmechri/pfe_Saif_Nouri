const { AppError } = require("../utils/appError");
const { hasRole: userHasRole } = require("../models/user.model");

/**
 * Middleware de vÃ©rification de rÃ´le utilisateur
 * VÃ©rifie si l'utilisateur authentifiÃ© possÃ¨de un des rÃ´les autorisÃ©s
 * 
 * @param {...string} allowedRoles - Liste des rÃ´les autorisÃ©s
 * @returns {Function} Middleware Express
 * 
 * @example
 * // Autoriser plusieurs rÃ´les
 * router.get('/route', verifyToken, checkRole('admin', 'garage'), handler);
 * 
 * // Autoriser un seul rÃ´le
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
 * Middleware prÃ©-configurÃ© : Seuls les administrateurs
 * @type {Function}
 */
const isAdmin = checkRole('admin');

/**
 * Middleware prÃ©-configurÃ© : Professionnels (garages, vendeurs) et admins
 * @type {Function}
 */
const isProfessional = checkRole('garage', 'vendeur', 'admin');

/**
 * Middleware prÃ©-configurÃ© : Seulement les automobilistes
 * @type {Function}
 */
const isAutomobiliste = checkRole('automobiliste', 'admin');

/**
 * Middleware prÃ©-configurÃ© : Seulement les garages
 * @type {Function}
 */
const isGarage = checkRole('garage', 'admin');

/**
 * Middleware prÃ©-configurÃ© : Seulement les vendeurs
 * @type {Function}
 */
const isVendeur = checkRole('vendeur');
const isVendeurOrAdmin = checkRole('vendeur', 'admin');

/**
 * Fonction helper pour vérifier si un utilisateur a un rÃ´le spÃ©cifique
 * Utile pour des vÃ©rifications conditionnelles dans les contrÃ´leurs
 * 
 * @param {number} userId - ID de l'utilisateur
 * @param {string} roleName - Nom du rÃ´le Ã  vérifier
 * @returns {Promise<boolean>} true si l'utilisateur a le rÃ´le
 * 
 * @example
 * const isUserAdmin = await hasRole(req.user.id, 'admin');
 * if (isUserAdmin) {
 *   // Logique spÃ©cifique admin
 * }
 */
const hasRole = async (userId, roleName) => {
  try {
    return await userHasRole(userId, roleName);
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



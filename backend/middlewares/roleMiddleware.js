const { AppError } = require("../utils/appError");
const { hasRole: userHasRole } = require("../models/user.model");

/**
 * Middleware de vérification de rôle utilisateur.
 * Vérifie si l'utilisateur authentifié possède un des rôles autorisés.
 *
 * @param {...string} allowedRoles - Liste des rôles autorisés
 * @returns {Function} Middleware Express
 *
 * @example
 * router.get('/route', verifyToken, authorizeRoles('admin', 'garage'), handler);
 */
const authorizeRoles = (...allowedRoles) => {
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

// Alias conservé pour compatibilité avec l'existant.
const checkRole = (...allowedRoles) => authorizeRoles(...allowedRoles);

/**
 * Middleware pré-configuré : Seuls les administrateurs
 * @type {Function}
 */
const isAdmin = authorizeRoles('admin');

/**
 * Middleware pré-configuré : Professionnels (garages, vendeurs) et admins
 * @type {Function}
 */
const isProfessional = authorizeRoles('garage', 'vendeur', 'admin');

/**
 * Middleware pré-configuré : Seulement les automobilistes
 * @type {Function}
 */
const isAutomobiliste = authorizeRoles('automobiliste', 'admin');

/**
 * Middleware pré-configuré : Seulement les garages
 * @type {Function}
 */
const isGarage = authorizeRoles('garage', 'admin');

/**
 * Middleware pré-configuré : Seulement les vendeurs
 * @type {Function}
 */
const isVendeur = authorizeRoles('vendeur', 'admin');
const isVendeurOrAdmin = authorizeRoles('vendeur', 'admin');

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
    return await userHasRole(userId, roleName);
  } catch (err) {
    console.error("Erreur hasRole:", err);
    return false;
  }
};

module.exports = { 
  authorizeRoles,
  checkRole, 
  isAdmin, 
  isProfessional, 
  isAutomobiliste,
  isGarage,
  isVendeur,
  isVendeurOrAdmin,
  hasRole
};



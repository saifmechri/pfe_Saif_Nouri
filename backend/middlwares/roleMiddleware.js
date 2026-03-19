const { pool } = require("../db");

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
      // req.user.id est défini par le middleware verifyToken
      const userId = req.user.id;
      
      // Log de la tentative d'accès (en mode développement)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[ROLE CHECK] User ${userId} - Rôles requis: [${allowedRoles.join(', ')}]`);
      }
      
      // Récupérer le rôle de l'utilisateur depuis la BDD
      const result = await pool.query(
        `SELECT r.name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = $1`,
        [userId]
      );
      
      // Si l'utilisateur n'existe pas ou n'a pas de rôle
      if (result.rows.length === 0) {
        console.warn(`[ROLE CHECK] ⚠️ User ${userId} sans rôle défini`);
        return res.status(403).json({ 
          message: "Utilisateur sans rôle défini" 
        });
      }
      
      const userRole = result.rows[0].name;
      
      // Vérifier si le rôle de l'utilisateur est dans la liste autorisée
      if (!allowedRoles.includes(userRole)) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[ROLE CHECK] ❌ ACCÈS REFUSÉ - Rôle actuel: ${userRole}`);
        }
        return res.status(403).json({ 
          message: "Accès refusé : permissions insuffisantes",
          required: allowedRoles,
          current: userRole
        });
      }
      
      // Log de succès (en mode développement)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[ROLE CHECK] ✅ ACCÈS AUTORISÉ - Rôle: ${userRole}`);
      }
      
      // Ajouter le rôle à l'objet req pour l'utiliser dans les routes
      req.userRole = userRole;
      next();
      
    } catch (err) {
      console.error("[ROLE CHECK] Erreur vérification rôle:", err);
      res.status(500).json({ message: "Erreur serveur" });
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
  hasRole
};
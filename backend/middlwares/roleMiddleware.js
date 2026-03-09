const pool = require("../db");

/**
 * Middleware pour vérifier si l'utilisateur a un rôle autorisé
 * Usage: checkRole('admin') ou checkRole('garage', 'vendeur')
 */
const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // req.user.id est défini par le middleware verifyToken
      const userId = req.user.id;
      
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
        return res.status(403).json({ 
          message: "Utilisateur sans rôle défini" 
        });
      }
      
      const userRole = result.rows[0].name;
      
      // Vérifier si le rôle de l'utilisateur est dans la liste autorisée
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          message: "Accès refusé : permissions insuffisantes",
          required: allowedRoles,
          current: userRole
        });
      }
      
      // Ajouter le rôle à l'objet req pour l'utiliser dans les routes
      req.userRole = userRole;
      next();
      
    } catch (err) {
      console.error("Erreur vérification rôle:", err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  };
};

/**
 * Middleware pré-configuré : Seuls les admins
 */
const isAdmin = checkRole('admin');

/**
 * Middleware pré-configuré : Garages, Vendeurs et Admins
 */
const isProfessional = checkRole('garage', 'vendeur', 'admin');

/**
 * Middleware pré-configuré : Seulement les automobilistes
 */
const isAutomobiliste = checkRole('automobiliste');

module.exports = { 
  checkRole, 
  isAdmin, 
  isProfessional, 
  isAutomobiliste 
};
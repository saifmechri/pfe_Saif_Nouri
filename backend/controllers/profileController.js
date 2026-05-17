const { pool } = require("../db");
const bcrypt = require("bcrypt");
const { sendApiResponse } = require("../utils/apiResponse");

const isValidBcryptHash = (value) => {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
};

/**
 * Met à jour le profil de l'utilisateur connecté.
 * Champs supportés: name, email, phone, password, store_name, store_address, store_description, store_hours, store_specialties, store_services.
 */
// ============================================
// UPDATE PROFILE - Modifier le profil
// ============================================
const updateProfile = async (req, res) => {
  const userId = req.user.id; // ID de l'utilisateur connecté (vient du middleware verifyToken)
  const { name, email, phone, password, store_name, store_address, store_description, store_hours, store_specialties, store_services } = req.body || {};

  try {
    // Validation : au moins un champ doit être fourni
    if (!name && !email && !phone && !password && store_name === undefined && store_address === undefined && store_description === undefined && store_hours === undefined && store_specialties === undefined && store_services === undefined) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "Veuillez fournir au moins un champ à modifier",
        error: { code: 'VALIDATION_ERROR' }
      });
    }

    // Récupérer les informations actuelles de l'utilisateur
    const currentUser = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );

    if (currentUser.rows.length === 0) {
      return sendApiResponse(res, {
        statusCode: 404,
        success: false,
        message: "Utilisateur non trouvé",
        error: { code: 'USER_NOT_FOUND' }
      });
    }

    const user = currentUser.rows[0];

    // Préparer les valeurs à mettre à jour
    let updateName = name || user.name;
    let updateEmail = email || user.email;
    let updatePhone = phone || user.phone;
    let updateStoreName = store_name !== undefined ? store_name : user.store_name;
    let updateStoreAddress = store_address !== undefined ? store_address : user.store_address;
    let updateStoreDescription = store_description !== undefined ? store_description : user.store_description;
    let updateStoreHours = store_hours !== undefined ? store_hours : user.store_hours;
    let updateStoreSpecialties = store_specialties !== undefined ? store_specialties : user.store_specialties;
    let updateStoreServices = store_services !== undefined ? store_services : user.store_services;
    let updatePassword = null; // Null => ne pas modifier le mot de passe existant

    // Si un nouvel email est fourni, vérifier qu'il n'existe pas déjà
    if (email && email !== user.email) {
      const emailCheck = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND id != $2",
        [email, userId]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }
    }

    // Validation du format email
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendApiResponse(res, {
          statusCode: 400,
          success: false,
          message: "Format d'email invalide",
          error: { code: 'INVALID_EMAIL' }
        });
      }
    }

    // Validation du téléphone (si fourni)
    if (phone) {
      const phoneRegex = /^[0-9]{8,15}$/;
      if (!phoneRegex.test(phone)) {
        return sendApiResponse(res, {
          statusCode: 400,
          success: false,
          message: "Le téléphone doit contenir entre 8 et 15 chiffres",
          error: { code: 'INVALID_PHONE' }
        });
      }
    }

    // Si un nouveau mot de passe est fourni, le hasher
    if (password) {
      if (password.length < 6) {
        return sendApiResponse(res, {
          statusCode: 400,
          success: false,
          message: "Le mot de passe doit contenir au moins 6 caractères",
          error: { code: 'INVALID_PASSWORD' }
        });
      }
      const saltRounds = 10;
      updatePassword = await bcrypt.hash(password, saltRounds);
    }

    // Mettre à jour dans la base de données
    await pool.query(
      `UPDATE users 
       SET name = $1,
           email = $2,
           phone = $3,
           store_name = $4,
           store_address = $5,
           store_description = $6,
           store_hours = $7,
           store_specialties = $8,
           store_services = $9,
           password = COALESCE($10, password),
           updated_at = NOW()
       WHERE id = $11 
       RETURNING id, name, email, phone, store_name, store_address, store_description, store_hours, store_specialties, store_services, created_at, updated_at`,
      [updateName, updateEmail, updatePhone, updateStoreName, updateStoreAddress, updateStoreDescription, updateStoreHours, updateStoreSpecialties, updateStoreServices, updatePassword, userId]
    );

    // Récupérer aussi le rôle pour la réponse
    const userWithRole = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.store_name, u.store_address, u.store_description, u.store_hours, u.store_specialties, u.store_services, r.name as role, u.created_at, u.updated_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    return sendApiResponse(res, {
      message: "Profil mis à jour avec succès",
      data: { user: userWithRole.rows[0] },
      extra: { user: userWithRole.rows[0] }
    });

  } catch (err) {
    console.error("Erreur lors de la mise à jour du profil:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Supprime le compte de l'utilisateur connecté après confirmation du mot de passe.
 */
// ============================================
// DELETE PROFILE - Supprimer le compte
// ============================================
const deleteProfile = async (req, res) => {
  const userId = req.user.id; // ID de l'utilisateur connecté
  const { confirmPassword } = req.body || {}; // Mot de passe de confirmation

  try {
    // Validation : le mot de passe de confirmation est obligatoire
    if (!confirmPassword) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "Veuillez confirmer votre mot de passe pour supprimer votre compte",
        error: { code: 'VALIDATION_ERROR' }
      });
    }

    // Récupérer l'utilisateur
    const user = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      return sendApiResponse(res, {
        statusCode: 404,
        success: false,
        message: "Utilisateur non trouvé",
        error: { code: 'USER_NOT_FOUND' }
      });
    }

    // Vérifier le mot de passe
    if (!user.rows[0].password || !isValidBcryptHash(user.rows[0].password)) {
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
      return sendApiResponse(res, {
        message: "Votre compte a été supprimé avec succès"
      });
    }

    const isPasswordValid = await bcrypt.compare(
      confirmPassword,
      user.rows[0].password
    );

    if (!isPasswordValid) {
      return sendApiResponse(res, {
        statusCode: 401,
        success: false,
        message: "Mot de passe incorrect. Suppression annulée.",
        error: { code: 'INVALID_PASSWORD' }
      });
    }

    // Supprimer l'utilisateur de la base de données
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    return sendApiResponse(res, {
      message: "Votre compte a été supprimé avec succès"
    });

  } catch (err) {
    console.error("Erreur lors de la suppression du profil:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * Change uniquement le mot de passe de l'utilisateur connecté.
 */
// ============================================
// CHANGE PASSWORD - Changer le mot de passe uniquement
// ============================================
const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body || {};

  try {
    // Validation minimale
    if (!newPassword) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "Le nouveau mot de passe est requis",
        error: { code: 'VALIDATION_ERROR' }
      });
    }

    // Validation du nouveau mot de passe
    if (newPassword.length < 6) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        error: { code: 'INVALID_PASSWORD' }
      });
    }

    // Récupérer l'utilisateur
    const user = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      return sendApiResponse(res, {
        statusCode: 404,
        success: false,
        message: "Utilisateur non trouvé",
        error: { code: 'USER_NOT_FOUND' }
      });
    }

    // Cas legacy: utilisateur sans hash de mot de passe en base
    if (!user.rows[0].password || !isValidBcryptHash(user.rows[0].password)) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      await pool.query(
        "UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2",
        [hashedPassword, userId]
      );

      return res.json({
        success: true,
        message: "Mot de passe défini avec succès",
        data: null,
        error: null
      });
    }

    if (!oldPassword) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "L'ancien mot de passe est requis",
        error: { code: 'VALIDATION_ERROR' }
      });
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      user.rows[0].password
    );

    if (!isPasswordValid) {
      return sendApiResponse(res, {
        statusCode: 401,
        success: false,
        message: "L'ancien mot de passe est incorrect",
        error: { code: 'INVALID_PASSWORD' }
      });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe
    await pool.query(
      "UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2",
      [hashedPassword, userId]
    );

    return sendApiResponse(res, {
      message: "Mot de passe modifié avec succès"
    });

  } catch (err) {
    console.error("Erreur lors du changement de mot de passe:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = { 
  updateProfile, 
  deleteProfile,
  changePassword 
};



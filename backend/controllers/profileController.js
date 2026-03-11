const pool = require("../db");
const bcrypt = require("bcrypt");

// ============================================
// UPDATE PROFILE - Modifier le profil
// ============================================
const updateProfile = async (req, res) => {
  const userId = req.user.id; // ID de l'utilisateur connecté (vient du middleware verifyToken)
  const { name, email, phone, password } = req.body;

  try {
    // Validation : au moins un champ doit être fourni
    if (!name && !email && !phone && !password) {
      return res.status(400).json({ 
        message: "Veuillez fournir au moins un champ à modifier" 
      });
    }

    // Récupérer les informations actuelles de l'utilisateur
    const currentUser = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );

    if (currentUser.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const user = currentUser.rows[0];

    // Préparer les valeurs à mettre à jour
    let updateName = name || user.name;
    let updateEmail = email || user.email;
    let updatePhone = phone || user.phone;
    let updatePassword = user.password; // Par défaut, garder l'ancien

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
        return res.status(400).json({ message: "Format d'email invalide" });
      }
    }

    // Validation du téléphone (si fourni)
    if (phone) {
      const phoneRegex = /^[0-9]{8,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ 
          message: "Le téléphone doit contenir entre 8 et 15 chiffres" 
        });
      }
    }

    // Si un nouveau mot de passe est fourni, le hasher
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ 
          message: "Le mot de passe doit contenir au moins 6 caractères" 
        });
      }
      const saltRounds = 10;
      updatePassword = await bcrypt.hash(password, saltRounds);
    }

    // Mettre à jour dans la base de données
    const updatedUser = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2, phone = $3, password = $4, updated_at = NOW()
       WHERE id = $5 
       RETURNING id, name, email, phone, created_at, updated_at`,
      [updateName, updateEmail, updatePhone, updatePassword, userId]
    );

    // Récupérer aussi le rôle pour la réponse
    const userWithRole = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, r.name as role, u.created_at, u.updated_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    res.json({
      message: "Profil mis à jour avec succès",
      user: userWithRole.rows[0]
    });

  } catch (err) {
    console.error("Erreur lors de la mise à jour du profil:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ============================================
// DELETE PROFILE - Supprimer le compte
// ============================================
const deleteProfile = async (req, res) => {
  const userId = req.user.id; // ID de l'utilisateur connecté
  const { confirmPassword } = req.body; // Mot de passe de confirmation

  try {
    // Validation : le mot de passe de confirmation est obligatoire
    if (!confirmPassword) {
      return res.status(400).json({ 
        message: "Veuillez confirmer votre mot de passe pour supprimer votre compte" 
      });
    }

    // Récupérer l'utilisateur
    const user = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(
      confirmPassword, 
      user.rows[0].password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "Mot de passe incorrect. Suppression annulée." 
      });
    }

    // Supprimer l'utilisateur de la base de données
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);

    res.json({ 
      message: "Votre compte a été supprimé avec succès" 
    });

  } catch (err) {
    console.error("Erreur lors de la suppression du profil:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ============================================
// CHANGE PASSWORD - Changer le mot de passe uniquement
// ============================================
const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  try {
    // Validation des champs
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        message: "L'ancien et le nouveau mot de passe sont requis" 
      });
    }

    // Validation du nouveau mot de passe
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "Le nouveau mot de passe doit contenir au moins 6 caractères" 
      });
    }

    // Récupérer l'utilisateur
    const user = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(
      oldPassword, 
      user.rows[0].password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: "L'ancien mot de passe est incorrect" 
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

    res.json({ 
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

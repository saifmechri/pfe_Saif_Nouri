/**
 * AUTHENTICATION CONTROLLER
 * Handles user registration, login, and account management
 * Supports 3 roles: automobiliste, garage, admin
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { sendApiResponse } = require("../utils/apiResponse");
const { createUser, emailExists, findUserByEmail } = require("../models/user.model");
const { pool } = require("../db");

const SECRET = process.env.JWT_SECRET || "jwt_secret_key";

const isValidBcryptHash = (value) => {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
};

/**
 * Crée un nouvel utilisateur avec validation métier minimale et hash du mot de passe.
 */
// REGISTER
const register = async (req, res) => {
  const { nom, prenom, email, telephone, password, role } = req.body || {};

  try {
    // Validation des champs obligatoires
    if (!nom || !prenom || !email || !telephone || !password || !role) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "Tous les champs sont requis",
        error: { code: 'VALIDATION_ERROR' }
      });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "Le mot de passe doit contenir au moins 6 caractères",
        error: { code: 'VALIDATION_ERROR' }
      });
    }

    // Vérifier si l'email existe déjà
    const emailAlreadyUsed = await emailExists(email);
    if (emailAlreadyUsed) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "Cet email existe déjà",
        error: { code: 'EMAIL_ALREADY_EXISTS' }
      });
    }

    // Mapper le rôle vers role_id
    const roleMap = {
      automobiliste: 1,
      garage: 2,
      vendeur: 3,
      admin: 4
    };
    const roleId = roleMap[role];
    
    if (!roleId) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "Rôle invalide",
        error: { code: 'INVALID_ROLE' }
      });
    }

    // Combiner nom et prénom
    const fullName = `${prenom} ${nom}`;

    // Hasher le mot de passe avec bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insérer le nouvel utilisateur
    const newUser = await createUser({
      name: fullName,
      email,
      password: hashedPassword,
      phone: telephone,
      roleId
    });

    return sendApiResponse(res, {
      statusCode: 201,
      message: "Utilisateur créé avec succès",
      data: { user: newUser },
      extra: { user: newUser }
    });
  } catch (err) {
    console.error("Erreur lors de l'inscription:", err);
    return sendApiResponse(res, {
      statusCode: 500,
      success: false,
      message: "Erreur serveur",
      error: { code: 'INTERNAL_SERVER_ERROR' }
    });
  }
};

/**
 * Authentifie un utilisateur et retourne un token JWT + profil simplifié.
 */
// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body || {};

  try {
    // Validation des champs
    if (!email || !password) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "Email et mot de passe requis",
        error: { code: 'VALIDATION_ERROR' }
      });
    }

    console.log('[LOGIN ATTEMPT] Email:', email);

    // Récupérer l'utilisateur ET son rôle
    const user = await findUserByEmail(email);
    
    if (!user) {
      console.log('[LOGIN FAIL] Utilisateur non trouvé:', email);
      return sendApiResponse(res, {
        statusCode: 401,
        success: false,
        message: "Email ou mot de passe incorrect",
        error: { code: 'INVALID_PASSWORD' }
      });
    }

    console.log('[LOGIN] Utilisateur trouvé:', user.id, 'Email:', user.email);

    if (!user.password || !isValidBcryptHash(user.password)) {
      console.log('[LOGIN FAIL] Mot de passe invalide/absent:', user.id);
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "Compte incomplet: mot de passe non défini",
        error: { code: 'ACCOUNT_INCOMPLETE' }
      });
    }

    // Comparer le mot de passe avec bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    console.log('[LOGIN] Comparaison password:', isPasswordValid ? 'VALID' : 'INVALID');
    
    if (!isPasswordValid) {
      console.log('[LOGIN FAIL] Mot de passe incorrect pour ID:', user.id);
      return sendApiResponse(res, {
        statusCode: 401,
        success: false,
        message: "Email ou mot de passe incorrect",
        error: { code: 'INVALID_PASSWORD' }
      });
    }

    // Vérifier que le compte n'est pas bloqué
    if (!user.is_validated) {
      console.log('[LOGIN FAIL] Compte bloqué pour ID:', user.id);
      return sendApiResponse(res, {
        statusCode: 403,
        success: false,
        message: "Ce compte a été bloqué par l'administrateur. Veuillez contacter le support.",
        error: { code: 'ACCOUNT_BLOCKED' }
      });
    }

    // Vérifier l'état du garage si l'utilisateur est garage
    if (user.role_name === 'garage') {
      const { findGarageIdentityByUserId } = require('../models/garage.model');
      const garage = await findGarageIdentityByUserId(user.id);
      
      if (garage) {
        const garageDetail = await pool.query('SELECT is_open FROM garages WHERE id = $1', [garage.id]);
        const garageData = garageDetail.rows[0];
        
        if (garageData && !garageData.is_open) {
          console.log('[LOGIN FAIL] Garage bloqué pour user ID:', user.id);
          return sendApiResponse(res, {
            statusCode: 403,
            success: false,
            message: "Votre garage a été bloqué par l'administrateur. Veuillez contacter le support.",
            error: { code: 'GARAGE_BLOCKED' }
          });
        }
      }
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email 
      }, 
      SECRET, 
      { expiresIn: "7d" }
    );

    return sendApiResponse(res, {
      message: "Login success", 
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role_name,
          store_name: user.store_name || null,
          store_address: user.store_address || null,
          store_description: user.store_description || null,
          store_hours: user.store_hours || null,
          store_specialties: user.store_specialties || null,
          store_services: user.store_services || null
        }
      },
      extra: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role_name,
          store_name: user.store_name || null,
          store_address: user.store_address || null,
          store_description: user.store_description || null,
          store_hours: user.store_hours || null,
          store_specialties: user.store_specialties || null,
          store_services: user.store_services || null
        }
      }
    });
  } catch (err) {
    console.log(err);
    return sendApiResponse(res, {
      statusCode: 500,
      success: false,
      message: "Server error",
      error: { code: 'INTERNAL_SERVER_ERROR' }
    });
  }
};

module.exports = { register, login };


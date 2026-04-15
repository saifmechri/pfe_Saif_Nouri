const { pool } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { sendApiResponse } = require("../utils/apiResponse");

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
    const userCheck = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (userCheck.rows.length > 0) {
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
    const newUser = await pool.query(
      "INSERT INTO users(name, email, password, phone, role_id) VALUES($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role_id, created_at",
      [fullName, email, hashedPassword, telephone, roleId]
    );

    return sendApiResponse(res, {
      statusCode: 201,
      message: "Utilisateur créé avec succès",
      data: { user: newUser.rows[0] },
      extra: { user: newUser.rows[0] }
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

    // Récupérer l'utilisateur ET son rôle
    const user = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1`,
      [email]
    );
    
    if (user.rows.length === 0) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "User not found",
        error: { code: 'USER_NOT_FOUND' }
      });
    }

    if (!user.rows[0].password || !isValidBcryptHash(user.rows[0].password)) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "Compte incomplet: mot de passe non défini",
        error: { code: 'ACCOUNT_INCOMPLETE' }
      });
    }

    // Comparer le mot de passe avec bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
    
    if (!isPasswordValid) {
      return sendApiResponse(res, {
        statusCode: 400,
        success: false,
        message: "Wrong password",
        error: { code: 'INVALID_PASSWORD' }
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: user.rows[0].id,
        email: user.rows[0].email 
      }, 
      SECRET, 
      { expiresIn: "7d" }
    );

    return sendApiResponse(res, {
      message: "Login success", 
      data: {
        token,
        user: {
          id: user.rows[0].id,
          name: user.rows[0].name,
          email: user.rows[0].email,
          phone: user.rows[0].phone,
          role: user.rows[0].role_name,
          store_name: user.rows[0].store_name || null,
          store_address: user.rows[0].store_address || null,
          store_description: user.rows[0].store_description || null,
          store_hours: user.rows[0].store_hours || null,
          store_specialties: user.rows[0].store_specialties || null,
          store_services: user.rows[0].store_services || null
        }
      },
      extra: {
        token,
        user: {
          id: user.rows[0].id,
          name: user.rows[0].name,
          email: user.rows[0].email,
          phone: user.rows[0].phone,
          role: user.rows[0].role_name,
          store_name: user.rows[0].store_name || null,
          store_address: user.rows[0].store_address || null,
          store_description: user.rows[0].store_description || null,
          store_hours: user.rows[0].store_hours || null,
          store_specialties: user.rows[0].store_specialties || null,
          store_services: user.rows[0].store_services || null
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
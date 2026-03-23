const { pool } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const SECRET = "adszerAKIODtyu565e5re6r6r5r4ZIZIDJKEEEfdvmgf56gt6ythfd5fd54fd5ff@fgrfrf#fdfvdf";

const isValidBcryptHash = (value) => {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
};

// REGISTER
const register = async (req, res) => {
  const { nom, prenom, email, telephone, password, role } = req.body || {};

  try {
    // Validation des champs obligatoires
    if (!nom || !prenom || !email || !telephone || !password || !role) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    // Vérifier si l'email existe déjà
    const userCheck = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: "Cet email existe déjà" });
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
      return res.status(400).json({ message: "Rôle invalide" });
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

    res.status(201).json({ 
      message: "Utilisateur créé avec succès", 
      user: newUser.rows[0] 
    });
  } catch (err) {
    console.error("Erreur lors de l'inscription:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body || {};

  try {
    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
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
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.rows[0].password || !isValidBcryptHash(user.rows[0].password)) {
      return res.status(400).json({ message: "Compte incomplet: mot de passe non défini" });
    }

    // Comparer le mot de passe avec bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Wrong password" });
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

    res.json({ 
      message: "Login success", 
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role_name
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login };
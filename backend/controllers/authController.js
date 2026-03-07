const pool = require("../db");
const jwt = require("jsonwebtoken");

const SECRET = "jwt_secret_key";

// REGISTER
const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validation des champs
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const userCheck = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (userCheck.rows.length > 0)
      return res.status(400).json({ message: "Email already exists" });

    const newUser = await pool.query(
      "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING id, name, email, created_at",
      [name, email, password]
    );

    res.status(201).json({ message: "User created", user: newUser.rows[0] });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis" });
    }

    const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    if (password !== user.rows[0].password) {
      return res.status(400).json({ message: "Wrong password" });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: user.rows[0].id,
        email: user.rows[0].email 
      }, 
      SECRET, 
      { expiresIn: "24h" }
    );

    res.json({ 
      message: "Login success", 
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login };
const pool = require("./db");

pool.connect()
  .then(client => {
    console.log("✅ Connexion à la DB réussie!");
    client.release(); // libérer la connexion
  })
  .catch(err => {
    console.error("❌ Erreur de connexion:", err.message);
  });
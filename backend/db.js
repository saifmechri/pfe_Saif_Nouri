const { Sequelize } = require('sequelize');
const { Pool } = require("pg");

const DB_USER = process.env.DB_USER || "postgres";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_NAME = process.env.DB_NAME || "autodb";
const DB_PASSWORD = process.env.DB_PASSWORD || "saif12345";
const DB_PORT = Number(process.env.DB_PORT || 5432);

// Pool PostgreSQL pour les requêtes existantes (auth, vehicles)
const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_NAME,
  password: DB_PASSWORD,
  port: DB_PORT
});

// Sequelize pour les modèles ORM (interventions, pieces)
const sequelize = new Sequelize({
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: false
});

const db = {
  Sequelize,
  sequelize,
  pool,
  models: {}
};

// Import des modèles Sequelize
const User = require('./models/User')(sequelize, Sequelize.DataTypes);
const Vehicle = require('./models/Vehicle')(sequelize, Sequelize.DataTypes);
const Intervention = require('./models/Intervention')(sequelize, Sequelize.DataTypes);
const Piece = require('./models/Piece')(sequelize, Sequelize.DataTypes);
const InterventionPiece = require('./models/InterventionPiece')(sequelize, Sequelize.DataTypes);
const Garage = require('./models/Garage')(sequelize, Sequelize.DataTypes);

db.User = User;
db.Vehicle = Vehicle;
db.Intervention = Intervention;
db.Piece = Piece;
db.InterventionPiece = InterventionPiece;
db.Garage = Garage;

// Associations
Object.keys(db).forEach(modelName => {
  if (db[modelName] && db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
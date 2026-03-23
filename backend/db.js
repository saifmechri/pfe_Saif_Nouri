const { Sequelize } = require('sequelize');
const { Pool } = require("pg");

// Pool PostgreSQL pour les requêtes existantes (auth, vehicles)
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "autodb",
  password: "saif12345",
  port: 5432
});

// Sequelize pour les modèles ORM (interventions, pieces)
const sequelize = new Sequelize({
  database: 'autodb',
  username: 'postgres',
  password: 'saif12345',
  host: 'localhost',
  port: 5432,
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

db.User = User;
db.Vehicle = Vehicle;
db.Intervention = Intervention;
db.Piece = Piece;
db.InterventionPiece = InterventionPiece;

// Associations
Object.keys(db).forEach(modelName => {
  if (db[modelName] && db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
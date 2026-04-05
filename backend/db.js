const { Sequelize } = require('sequelize');
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;
const DB_USER = process.env.DB_USER || "postgres";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_NAME = process.env.DB_NAME || "autodb";
const DB_PASSWORD = process.env.DB_PASSWORD || "saif12345";
const DB_PORT = Number(process.env.DB_PORT || 5432);
const USE_SSL = String(process.env.DB_SSL || "true").toLowerCase() === "true";
const DB_POOL_MAX = Number(process.env.DB_POOL_MAX || 10);
const DB_POOL_IDLE_TIMEOUT_MS = Number(process.env.DB_POOL_IDLE_TIMEOUT_MS || 10000);
const DB_POOL_CONNECTION_TIMEOUT_MS = Number(process.env.DB_POOL_CONNECTION_TIMEOUT_MS || 10000);

const sslConfig = USE_SSL ? { rejectUnauthorized: false } : false;

const poolOptions = {
  ssl: sslConfig,
  max: DB_POOL_MAX,
  idleTimeoutMillis: DB_POOL_IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: DB_POOL_CONNECTION_TIMEOUT_MS,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

// Pool PostgreSQL pour les requêtes existantes (auth, vehicles)
const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ...poolOptions
    })
  : new Pool({
      user: DB_USER,
      host: DB_HOST,
      database: DB_NAME,
      password: DB_PASSWORD,
      port: DB_PORT,
      ...poolOptions
    });

// Sequelize pour les modèles ORM (interventions, pieces)
const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: sslConfig
      }
    })
  : new Sequelize({
      database: DB_NAME,
      username: DB_USER,
      password: DB_PASSWORD,
      host: DB_HOST,
      port: DB_PORT,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: sslConfig
      }
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
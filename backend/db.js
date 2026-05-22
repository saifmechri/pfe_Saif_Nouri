const { Pool } = require('pg');
const { URL } = require('url');

const isRunningInDocker =
  process.env.RUNNING_IN_DOCKER === 'true' ||
  process.env.DOCKER_CONTAINER === 'true' ||
  process.env.CONTAINER === 'true';

const rawDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim();

const normalizeDatabaseUrl = (databaseUrl) => {
  if (!databaseUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(databaseUrl);

    if (isRunningInDocker && ['localhost', '127.0.0.1'].includes(parsedUrl.hostname)) {
      parsedUrl.hostname = 'host.docker.internal';
    }

    return parsedUrl.toString();
  } catch (error) {
    return databaseUrl;
  }
};

const DATABASE_URL = normalizeDatabaseUrl(rawDatabaseUrl);
const DB_USER = process.env.DB_USER || 'postgres';
const DB_HOST = process.env.DB_HOST || (isRunningInDocker ? 'host.docker.internal' : 'localhost');
const DB_NAME = process.env.DB_NAME || 'autodb';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_PORT = Number(process.env.DB_PORT || 5432);
const RAW_DB_SSL = process.env.DB_SSL;

const isDatabaseUrlLocal = DATABASE_URL
  ? /localhost|127\.0\.0\.1/i.test(DATABASE_URL)
  : false;

const USE_SSL = RAW_DB_SSL
  ? ['true', '1', 'yes', 'on'].includes(String(RAW_DB_SSL).toLowerCase())
  : Boolean(DATABASE_URL && !isDatabaseUrlLocal);
const DB_POOL_MAX = Number(process.env.DB_POOL_MAX || 10);
const DB_POOL_IDLE_TIMEOUT_MS = Number(process.env.DB_POOL_IDLE_TIMEOUT_MS || 10000);
const DB_POOL_CONNECTION_TIMEOUT_MS = Number(process.env.DB_POOL_CONNECTION_TIMEOUT_MS || 10000);

const sslConfig = USE_SSL ? { rejectUnauthorized: false } : false;

const buildPoolConfig = () => {
  if (DATABASE_URL) {
    try {
      const parsedUrl = new URL(DATABASE_URL);

      return {
        user: parsedUrl.username || DB_USER,
        host: parsedUrl.hostname,
        database: parsedUrl.pathname ? parsedUrl.pathname.replace(/^\//, '') || DB_NAME : DB_NAME,
        password: process.env.DB_PASSWORD || decodeURIComponent(parsedUrl.password || ''),
        port: parsedUrl.port ? Number(parsedUrl.port) : DB_PORT,
        ssl: sslConfig,
        max: DB_POOL_MAX,
        idleTimeoutMillis: DB_POOL_IDLE_TIMEOUT_MS,
        connectionTimeoutMillis: DB_POOL_CONNECTION_TIMEOUT_MS,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000
      };
    } catch (error) {
      return {
        connectionString: DATABASE_URL,
        ssl: sslConfig,
        max: DB_POOL_MAX,
        idleTimeoutMillis: DB_POOL_IDLE_TIMEOUT_MS,
        connectionTimeoutMillis: DB_POOL_CONNECTION_TIMEOUT_MS,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000
      };
    }
  }

  return {
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: String(DB_PASSWORD || ''),
    port: DB_PORT,
    ssl: sslConfig,
    max: DB_POOL_MAX,
    idleTimeoutMillis: DB_POOL_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: DB_POOL_CONNECTION_TIMEOUT_MS,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
  };
};

const pool = new Pool(buildPoolConfig());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runWithRetries = async (operation, { retries = 5, delayMs = 2000 } = {}) => {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === retries) {
        throw lastError;
      }

      await sleep(delayMs);
    }
  }

  throw lastError;
};

const testConnection = async () => {
  await runWithRetries(() => pool.query('SELECT 1'));
};

const initDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL
    )
  `);

  await pool.query(`
    INSERT INTO roles (id, name)
    VALUES
      (1, 'automobiliste'),
      (2, 'garage'),
      (3, 'vendeur'),
      (4, 'admin')
    ON CONFLICT (id) DO NOTHING
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255),
      phone VARCHAR(30),
      role_id INTEGER REFERENCES roles(id),
      store_name VARCHAR(255),
      store_address TEXT,
      store_description TEXT,
      store_hours TEXT,
      store_specialties TEXT,
      store_services TEXT,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicules (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      modele_voiture VARCHAR(255) NOT NULL,
      matricule_voiture VARCHAR(255) UNIQUE NOT NULL,
      type_vehicule VARCHAR(50) DEFAULT 'Essence',
      kilometrage_voiture INTEGER,
      photo_voiture TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pieces (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      nom VARCHAR(255) NOT NULL,
      reference VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      photo_url TEXT,
      prix_unitaire NUMERIC(10, 2) NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS interventions (
      id BIGSERIAL PRIMARY KEY,
      vehicle_id BIGINT REFERENCES vehicules(id) ON DELETE CASCADE,
      date_intervention DATE NOT NULL DEFAULT CURRENT_DATE,
      type VARCHAR(50) NOT NULL,
      description TEXT,
      garage_nom VARCHAR(255),
      garage_adresse VARCHAR(255),
      kilometrage INTEGER,
      cout_total NUMERIC(10, 2) DEFAULT 0,
      km_recommande INTEGER DEFAULT 15000,
      jours_recommandes INTEGER DEFAULT 365,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS maintenance_schedule (
      id BIGSERIAL PRIMARY KEY,
      vehicle_id BIGINT NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
      intervention_type VARCHAR(80) NOT NULL,
      scheduled_date DATE,
      scheduled_km INTEGER,
      status VARCHAR(30) DEFAULT 'planned',
      notes TEXT,
      source_intervention_id BIGINT REFERENCES interventions(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS intervention_pieces (
      id BIGSERIAL PRIMARY KEY,
      intervention_id BIGINT NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
      piece_id BIGINT NOT NULL REFERENCES pieces(id),
      quantite INTEGER NOT NULL DEFAULT 1,
      prix_unitaire_applique NUMERIC(10, 2) NOT NULL,
      UNIQUE (intervention_id, piece_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS piece_stock_movements (
      id BIGSERIAL PRIMARY KEY,
      piece_id BIGINT NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
      user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      movement_type VARCHAR(30) NOT NULL,
      quantity_change INTEGER NOT NULL,
      stock_before INTEGER NOT NULL,
      stock_after INTEGER NOT NULL,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_piece_stock_movements_non_zero_change CHECK (quantity_change <> 0),
      CONSTRAINT chk_piece_stock_movements_non_negative_after CHECK (stock_after >= 0)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS garages (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      adresse VARCHAR(255),
      telephone VARCHAR(50),
      email VARCHAR(255),
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      rating NUMERIC(3, 2) DEFAULT 3.5,
      is_open BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS store_name VARCHAR(255)');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS store_address TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS store_description TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS store_hours TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS store_specialties TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS store_services TEXT');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION');

  await pool.query('ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await pool.query('ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await pool.query('ALTER TABLE interventions ADD COLUMN IF NOT EXISTS vehicle_id BIGINT');
  await pool.query('ALTER TABLE interventions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await pool.query('ALTER TABLE interventions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await pool.query('ALTER TABLE interventions ADD COLUMN IF NOT EXISTS km_recommande INTEGER DEFAULT 15000');
  await pool.query('ALTER TABLE interventions ADD COLUMN IF NOT EXISTS jours_recommandes INTEGER DEFAULT 365');
  await pool.query('ALTER TABLE interventions ADD COLUMN IF NOT EXISTS cout_total NUMERIC(10, 2) DEFAULT 0');

  await pool.query('ALTER TABLE maintenance_schedule ADD COLUMN IF NOT EXISTS intervention_type VARCHAR(80)');
  await pool.query('ALTER TABLE maintenance_schedule ADD COLUMN IF NOT EXISTS scheduled_date DATE');
  await pool.query('ALTER TABLE maintenance_schedule ADD COLUMN IF NOT EXISTS scheduled_km INTEGER');
  await pool.query('ALTER TABLE maintenance_schedule ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT \'planned\'');
  await pool.query('ALTER TABLE maintenance_schedule ADD COLUMN IF NOT EXISTS notes TEXT');
  await pool.query('ALTER TABLE maintenance_schedule ADD COLUMN IF NOT EXISTS source_intervention_id BIGINT REFERENCES interventions(id) ON DELETE SET NULL');
  await pool.query('ALTER TABLE maintenance_schedule ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await pool.query('ALTER TABLE maintenance_schedule ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await pool.query('ALTER TABLE pieces ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await pool.query('ALTER TABLE pieces ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await pool.query('ALTER TABLE pieces ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP');
  await pool.query('ALTER TABLE pieces ADD COLUMN IF NOT EXISTS photo_url TEXT');
  await pool.query('ALTER TABLE pieces ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE SET NULL');
  await pool.query('ALTER TABLE pieces ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT \'Neuf\'');
  await pool.query('ALTER TABLE pieces ADD COLUMN IF NOT EXISTS zone_geographique VARCHAR(100)');
    await pool.query('ALTER TABLE pieces ADD COLUMN IF NOT EXISTS marque VARCHAR(100)');
    await pool.query('ALTER TABLE pieces ADD COLUMN IF NOT EXISTS modele VARCHAR(150)');
    await pool.query('ALTER TABLE pieces ADD COLUMN IF NOT EXISTS categorie VARCHAR(150)');

  await pool.query('ALTER TABLE intervention_pieces ADD COLUMN IF NOT EXISTS intervention_id BIGINT');
  await pool.query('ALTER TABLE intervention_pieces ADD COLUMN IF NOT EXISTS piece_id BIGINT');

  await pool.query('ALTER TABLE garages ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true');
  await pool.query('ALTER TABLE garages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  await pool.query('ALTER TABLE garages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  await pool.query('UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL');
  await pool.query('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL');
  await pool.query('UPDATE vehicules SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL');
  await pool.query('UPDATE vehicules SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL');
  await pool.query('UPDATE pieces SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL');
  await pool.query('UPDATE pieces SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL');
  await pool.query('UPDATE pieces SET deleted_at = NULL WHERE deleted_at IS NULL');

  await pool.query('UPDATE garages SET is_open = COALESCE(is_open, true) WHERE is_open IS NULL');

  await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'interventions' AND column_name = 'createdAt'
      ) THEN
        EXECUTE 'ALTER TABLE interventions ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP';
        EXECUTE 'UPDATE interventions SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'interventions' AND column_name = 'updatedAt'
      ) THEN
        EXECUTE 'ALTER TABLE interventions ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP';
        EXECUTE 'UPDATE interventions SET "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'interventions' AND column_name = 'vehicleId'
      ) THEN
        EXECUTE 'UPDATE interventions SET vehicle_id = COALESCE(vehicle_id, "vehicleId")';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'interventions' AND column_name = 'created_at'
      ) THEN
        EXECUTE 'ALTER TABLE interventions ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP';
        EXECUTE 'UPDATE interventions SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP)';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'interventions' AND column_name = 'updated_at'
      ) THEN
        EXECUTE 'ALTER TABLE interventions ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP';
        EXECUTE 'UPDATE interventions SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'intervention_pieces' AND column_name = 'interventionId'
      ) THEN
        EXECUTE 'UPDATE intervention_pieces SET intervention_id = COALESCE(intervention_id, "interventionId")';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'intervention_pieces' AND column_name = 'pieceId'
      ) THEN
        EXECUTE 'UPDATE intervention_pieces SET piece_id = COALESCE(piece_id, "pieceId")';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'garages' AND column_name = 'isOpen'
      ) THEN
        EXECUTE 'UPDATE garages SET is_open = COALESCE(is_open, "isOpen")';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pieces' AND column_name = 'createdAt'
      ) THEN
        EXECUTE 'UPDATE pieces SET created_at = COALESCE(created_at, "createdAt")';
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pieces' AND column_name = 'updatedAt'
      ) THEN
        EXECUTE 'UPDATE pieces SET updated_at = COALESCE(updated_at, "updatedAt")';
      END IF;
    END $$;
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_pieces_deleted_at ON pieces (deleted_at)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_pieces_created_at ON pieces (created_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_pieces_updated_at ON pieces (updated_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_pieces_user_id ON pieces (user_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_pieces_nom_trgm ON pieces USING GIN (nom gin_trgm_ops)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_pieces_reference_trgm ON pieces USING GIN (reference gin_trgm_ops)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_intervention_pieces_piece_id ON intervention_pieces (piece_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_intervention_pieces_intervention_id ON intervention_pieces (intervention_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_piece_stock_movements_piece_id ON piece_stock_movements (piece_id, created_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_piece_stock_movements_user_id ON piece_stock_movements (user_id, created_at DESC)');
};

module.exports = {
  pool,
  testConnection,
  initDatabase
};

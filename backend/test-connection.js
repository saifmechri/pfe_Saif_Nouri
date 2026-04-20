require('dotenv').config();

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const DB_USER = process.env.DB_USER || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_NAME = process.env.DB_NAME || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_SSL = ['true', '1', 'yes', 'on'].includes(String(process.env.DB_SSL || '').toLowerCase());

console.log('🔍 DATABASE_URL from .env:');
console.log(DATABASE_URL);
console.log('');

const poolConfig = DATABASE_URL
  ? {
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      user: DB_USER,
      host: DB_HOST,
      database: DB_NAME,
      password: DB_PASSWORD,
      port: DB_PORT,
      ssl: DB_SSL ? { rejectUnauthorized: false } : false
    };

if (!DATABASE_URL) {
  console.log('ℹ️ DATABASE_URL absent: test avec DB_HOST/DB_USER/DB_PASSWORD/DB_NAME/DB_PORT');
  console.log(`ℹ️ Host: ${DB_HOST}, Port: ${DB_PORT}, Database: ${DB_NAME}, User: ${DB_USER}`);
  console.log('');
}

const pool = new Pool(poolConfig);

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Connection Error:');
    console.error(err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to PostgreSQL/postgresql successfully!');
    console.log('Server time:', res.rows[0]);
    pool.end();
    process.exit(0);
  }
});

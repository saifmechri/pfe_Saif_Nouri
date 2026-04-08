require('dotenv').config();

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔍 DATABASE_URL from .env:');
console.log(DATABASE_URL);
console.log('');

if (DATABASE_URL) {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Connection Error:');
      console.error(err.message);
      process.exit(1);
    } else {
      console.log('✅ Connected to Supabase successfully!');
      console.log('Server time:', res.rows[0]);
      pool.end();
      process.exit(0);
    }
  });
} else {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

require('dotenv').config();
const { pool } = require('./db');

(async () => {
  try {
    const res = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='vehicules' 
      ORDER BY ordinal_position
    `);
    console.log(res.rows.map(r => r.column_name).join(', '));
    pool.end();
  } catch (e) {
    console.error(e.message);
    pool.end();
  }
})();



const { pool } = require('./db');

(async () => {
  const sql = "SELECT id, name, travel_hours FROM garages WHERE travel_hours IS NOT NULL AND travel_hours <> '' LIMIT 15";
  const r = await pool.query(sql);
  console.log(JSON.stringify(r.rows, null, 2));
  await pool.end();
})().catch(async (e) => {
  console.error(e);
  try { await pool.end(); } catch {}
  process.exit(1);
});

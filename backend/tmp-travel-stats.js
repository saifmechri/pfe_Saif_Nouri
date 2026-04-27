const { pool } = require('./db');

(async () => {
  const stats = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(travel_hours)::int AS non_null,
      COUNT(CASE WHEN COALESCE(TRIM(travel_hours), '') <> '' THEN 1 END)::int AS non_empty
    FROM garages
  `);
  const sample = await pool.query("SELECT id, name, travel_hours FROM garages ORDER BY id DESC LIMIT 10");
  console.log('stats=', JSON.stringify(stats.rows[0], null, 2));
  console.log('sample=', JSON.stringify(sample.rows, null, 2));
  await pool.end();
})().catch(async (e) => {
  console.error(e);
  try { await pool.end(); } catch {}
  process.exit(1);
});

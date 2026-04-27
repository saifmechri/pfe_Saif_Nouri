const { pool } = require('./db');

(async () => {
  const stats = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(CASE WHEN COALESCE(TRIM(vehicle_brands), '') <> '' THEN 1 END)::int AS brands_filled,
      COUNT(CASE WHEN COALESCE(TRIM(specialties), '') <> '' THEN 1 END)::int AS specialties_filled,
      COUNT(CASE WHEN COALESCE(TRIM(services_catalog), '') <> '' THEN 1 END)::int AS services_catalog_filled,
      COUNT(CASE WHEN EXISTS (SELECT 1 FROM garage_services gs WHERE gs.garage_id = g.id AND gs.is_active = true) THEN 1 END)::int AS garage_services_filled
    FROM garages g
  `);
  console.log(JSON.stringify(stats.rows[0], null, 2));
  await pool.end();
})().catch(async (e) => {
  console.error(e);
  try { await pool.end(); } catch {}
  process.exit(1);
});

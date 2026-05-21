const { pool } = require('../db');
const maintenanceService = require('../services/maintenanceService');

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const run = async () => {
  const vehiclesResult = await pool.query(
    `SELECT id
     FROM vehicules
     ORDER BY id ASC`
  );

  const summary = {
    vehiclesProcessed: 0,
    interventionsUpdated: 0,
    interventionsDeleted: 0,
    vehiclesResynced: 0
  };

  for (const vehicle of vehiclesResult.rows) {
    const vehicleId = Number(vehicle.id);
    const interventionsResult = await pool.query(
      `SELECT id, date_intervention, type, kilometrage, created_at, updated_at
       FROM interventions
       WHERE vehicle_id = $1
       ORDER BY COALESCE(date_intervention, created_at), created_at, id`,
      [vehicleId]
    );

    if (interventionsResult.rows.length === 0) {
      continue;
    }

    summary.vehiclesProcessed += 1;

    const seenByDateKm = new Map();
    const orderedRows = interventionsResult.rows.map((row) => ({
      ...row,
      dateValue: toDate(row.date_intervention || row.created_at),
      kilometrageValue: row.kilometrage === null || row.kilometrage === undefined ? null : Number(row.kilometrage)
    }));

    let runningMax = 0;

    for (const row of orderedRows) {
      if (!Number.isFinite(row.kilometrageValue)) {
        await pool.query('DELETE FROM interventions WHERE id = $1', [row.id]);
        summary.interventionsDeleted += 1;
        continue;
      }

      const correctedKm = Math.max(runningMax, row.kilometrageValue);
      if (correctedKm !== row.kilometrageValue) {
        await pool.query(
          'UPDATE interventions SET kilometrage = $2, updated_at = NOW() WHERE id = $1',
          [row.id, correctedKm]
        );
        summary.interventionsUpdated += 1;
      }

      row.kilometrageValue = correctedKm;
      runningMax = correctedKm;

      const duplicateKey = `${row.dateValue ? row.dateValue.toISOString().slice(0, 10) : 'no-date'}|${row.kilometrageValue}`;
      const previous = seenByDateKm.get(duplicateKey);
      if (previous) {
        const keepCurrent = (row.dateValue?.getTime() || 0) > (previous.dateValue?.getTime() || 0)
          || ((row.dateValue?.getTime() || 0) === (previous.dateValue?.getTime() || 0) && Number(row.updated_at ? new Date(row.updated_at).getTime() : row.created_at ? new Date(row.created_at).getTime() : 0) >= Number(previous.updated_at ? new Date(previous.updated_at).getTime() : previous.created_at ? new Date(previous.created_at).getTime() : 0))
          || Number(row.id) > Number(previous.id);

        if (keepCurrent) {
          await pool.query('DELETE FROM interventions WHERE id = $1', [previous.id]);
          seenByDateKm.set(duplicateKey, row);
          summary.interventionsDeleted += 1;
        } else {
          await pool.query('DELETE FROM interventions WHERE id = $1', [row.id]);
          summary.interventionsDeleted += 1;
        }
        continue;
      }

      seenByDateKm.set(duplicateKey, row);
    }

    await maintenanceService.syncMaintenanceState(vehicleId);
    summary.vehiclesResynced += 1;
  }

  console.log(JSON.stringify(summary, null, 2));
};

run()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error(error);
    try {
      await pool.end();
    } catch {}
    process.exit(1);
  });


const { pool } = require('../db');
const { sendApiResponse } = require('../utils/apiResponse');

const parseWorkHours = (workHours) => {
  // Expect simple format like "09:00-17:00". Otherwise ignore.
  if (!workHours || typeof workHours !== 'string') return null;
  const m = workHours.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
  if (!m) return null;
  return { start: m[1], end: m[2] };
};

const timeToMinutes = (t) => {
  const [hh, mm] = String(t).split(':').map(Number);
  return hh * 60 + mm;
};

const minutesToTime = (m) => {
  const hh = Math.floor(m / 60).toString().padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

const getAvailability = async (req, res) => {
  try {
    const garageId = Number.parseInt(req.params.id, 10);
    const date = req.query.date; // YYYY-MM-DD
    const slotMinutes = Number.parseInt(req.query.slotMinutes || '60', 10);

    if (!date) {
      return res.status(400).json({ success: false, message: 'Parametre date requis (YYYY-MM-DD)', data: null });
    }

    if (!Number.isInteger(slotMinutes) || slotMinutes <= 0) {
      return res.status(400).json({ success: false, message: 'slotMinutes invalide', data: null });
    }

    const garageRes = await pool.query('SELECT work_hours FROM garages WHERE id = $1', [garageId]);
    if (garageRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Garage non trouve', data: null });
    }

    const workHours = parseWorkHours(garageRes.rows[0].work_hours) || { start: '09:00', end: '17:00' };

    const startMin = timeToMinutes(workHours.start);
    const endMin = timeToMinutes(workHours.end);

    if (endMin <= startMin) {
      return res.status(400).json({ success: false, message: 'work_hours invalide pour ce garage', data: null });
    }

    // fetch appointments for that garage and date (exclude cancelled)
    const apptRes = await pool.query(
      `SELECT appointment_time, status FROM appointments WHERE garage_id = $1 AND appointment_date = $2 AND status != 'cancelled'`,
      [garageId, date]
    );

    const bookedTimes = new Set();
    let hasAllDay = false;
    for (const r of apptRes.rows) {
      if (!r.appointment_time) {
        hasAllDay = true;
        continue;
      }
      const t = r.appointment_time instanceof String ? String(r.appointment_time) : r.appointment_time.toString();
      // appointment_time may be "HH:MM:SS" -> take HH:MM
      const hhmm = t.split(':').slice(0, 2).join(':');
      bookedTimes.add(hhmm);
    }

    const slots = [];
    for (let m = startMin; m + slotMinutes <= endMin; m += slotMinutes) {
      const s = minutesToTime(m);
      const e = minutesToTime(m + slotMinutes);
      const available = !hasAllDay && !bookedTimes.has(s);
      slots.push({ start: s, end: e, available });
    }

    return sendApiResponse(res, {
      message: 'Disponibilites recuperees',
      data: {
        date,
        slotMinutes,
        workHours,
        hasAllDayBooking: hasAllDay,
        slots
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

module.exports = {
  getAvailability
};

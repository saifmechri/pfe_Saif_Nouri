const { pool } = require('../db');

const createNotification = async ({ userId, actorUserId = null, type, referenceId = null, title = null, body = null, metadata = null }) => {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, actor_user_id, type, reference_id, title, body, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [userId, actorUserId, type, referenceId, title, body, metadata]
  );
  return result.rows[0];
};

const getNotificationsForUser = async (userId, { limit = 50, offset = 0, onlyUnread = false } = {}) => {
  const params = [userId, limit, offset];
  let q = `SELECT * FROM notifications WHERE user_id = $1`;
  if (onlyUnread) q += ` AND is_read = false`;
  q += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
  const result = await pool.query(q, params);
  return result.rows;
};

const markNotificationAsRead = async (notificationId) => {
  const result = await pool.query(`UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *`, [notificationId]);
  return result.rows[0];
};

const markAllNotificationsRead = async (userId) => {
  await pool.query(`UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`, [userId]);
  return true;
};

const deleteNotification = async (notificationId) => {
  await pool.query(`DELETE FROM notifications WHERE id = $1`, [notificationId]);
  return true;
};

module.exports = {
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsRead,
  deleteNotification
};

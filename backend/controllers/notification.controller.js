const notificationService = require('../services/notificationService');

const listNotifications = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const limit = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);
    const onlyUnread = req.query.onlyUnread === 'true' || false;

    const items = await notificationService.listForUser(userId, { limit, offset, onlyUnread });

    return res.json({ success: true, message: 'Notifications', data: { items } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const createNotification = async (req, res) => {
  try {
    const payload = req.body;
    const created = await notificationService.createForUser(payload);
    return res.status(201).json({ success: true, message: 'Notification creee', data: { notification: created } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const markAsRead = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await notificationService.markRead(id);
    return res.json({ success: true, message: 'Notification lue', data: { notification: updated } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const markAll = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    await notificationService.markAllRead(userId);
    return res.json({ success: true, message: 'Toutes les notifications marquees comme lues', data: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const removeNotification = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await notificationService.remove(id);
    return res.json({ success: true, message: 'Notification supprimee', data: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

module.exports = {
  listNotifications,
  createNotification,
  markAsRead,
  markAll,
  removeNotification
};



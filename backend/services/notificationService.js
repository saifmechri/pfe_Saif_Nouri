const notificationModel = require('../models/notification.model');

const createForUser = async (payload) => {
  return notificationModel.createNotification(payload);
};

const listForUser = async (userId, opts) => {
  return notificationModel.getNotificationsForUser(userId, opts);
};

const markRead = async (notificationId) => {
  return notificationModel.markNotificationAsRead(notificationId);
};

const markAllRead = async (userId) => {
  return notificationModel.markAllNotificationsRead(userId);
};

const remove = async (notificationId) => {
  return notificationModel.deleteNotification(notificationId);
};

module.exports = {
  createForUser,
  listForUser,
  markRead,
  markAllRead,
  remove
};

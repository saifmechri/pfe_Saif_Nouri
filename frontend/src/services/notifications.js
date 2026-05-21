import API from "./api";

export const fetchNotifications = (params = {}) => {
  return API.get("/notifications", { params });
};

export const markNotificationAsRead = (notificationId) => {
  return API.patch(`/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsRead = () => {
  return API.patch("/notifications/read-all");
};

export const deleteNotification = (notificationId) => {
  return API.delete(`/notifications/${notificationId}`);
};



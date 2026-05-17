import { useEffect, useState, useCallback } from "react";
import { fetchNotifications, markNotificationAsRead, deleteNotification } from "../services/notifications";

/**
 * Hook personnalisé pour gérer les notifications
 * Récupère les notifications Ã  intervalle régulier
 */
export const useNotifications = (pollingInterval = 10000) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchNotifications({ limit: 100, offset: 0 });
      const items = res.data?.data?.items || res.data?.data || [];
      setNotifications(Array.isArray(items) ? items : []);
      setError(null);
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications:", err);
      setError(err?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial
  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  // Polling
  useEffect(() => {
    const interval = setInterval(fetchNotifs, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchNotifs, pollingInterval]);

  const handleMarkAsRead = useCallback(
    async (id) => {
      try {
        await markNotificationAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error("Erreur lors du marquage de la notification:", err);
      }
    },
    []
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await deleteNotification(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } catch (err) {
        console.error("Erreur lors de la suppression de la notification:", err);
      }
    },
    []
  );

  return {
    notifications,
    loading,
    error,
    refetch: fetchNotifs,
    markAsRead: handleMarkAsRead,
    delete: handleDelete,
  };
};

export default useNotifications;



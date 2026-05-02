import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from "../services/notifications";

const REFRESH_INTERVAL_MS = 30000;

const getErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }
  return fallback;
};

const getNotificationItems = (response) => {
  const data = response?.data;
  if (Array.isArray(data?.data?.items)) {
    return data.data.items;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
};

const formatNotificationDate = (rawDate) => {
  if (!rawDate) return "";

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const chatRouteByRole = {
  automobiliste: "/automobiliste/messages",
  garage: "/garage/messages",
  vendeur: "/vendeur/messages"
};

const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const rootRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item?.is_read).length,
    [notifications]
  );

  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetchNotifications({ limit: 20, offset: 0 });
      setNotifications(getNotificationItems(response));
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les notifications."));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    setProcessingId(notificationId);

    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(notificationId) ? { ...item, is_read: true } : item
        )
      );
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de marquer cette notification comme lue."));
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkAllLoading(true);

    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de marquer toutes les notifications comme lues."));
    } finally {
      setMarkAllLoading(false);
    }
  };

  const handleDelete = async (notificationId) => {
    setProcessingId(notificationId);

    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((item) => Number(item.id) !== Number(notificationId)));
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de supprimer cette notification."));
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotificationOpen = (item) => {
    const conversationId = Number(item?.metadata?.conversationId || item?.reference_id);

    if (item?.type === "message" && Number.isInteger(conversationId) && conversationId > 0) {
      void handleMarkAsRead(item.id);

      const targetPath = chatRouteByRole[user?.role];
      if (targetPath) {
        navigate(`${targetPath}?conversationId=${conversationId}`);
      }
    }

    setIsOpen(false);
  };

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications(true);
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const togglePanel = () => {
    const next = !isOpen;
    setIsOpen(next);

    if (next) {
      loadNotifications(true);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={togglePanel}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-600 hover:shadow-md"
        aria-label="Ouvrir les notifications"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[0.65rem] font-bold leading-4 text-white shadow-md">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[min(92vw,24rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_48px_rgba(15,23,42,0.2)]">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              <p className="text-xs text-slate-500">{unreadCount} non lue(s)</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadNotifications()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                title="Rafraichir"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={markAllLoading || notifications.length === 0 || unreadCount === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {markAllLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                Tout lire
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-4 mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
          )}

          <div className="max-h-[24rem] overflow-y-auto px-2 py-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-slate-500">Aucune notification pour le moment.</div>
            ) : (
              <ul className="space-y-2">
                {notifications.map((item) => {
                  const isProcessing = Number(processingId) === Number(item.id);
                  const createdAt = formatNotificationDate(item.created_at);

                  return (
                    <li
                      key={item.id}
                      role={item.type === "message" ? "button" : undefined}
                      tabIndex={item.type === "message" ? 0 : undefined}
                      onClick={() => handleNotificationOpen(item)}
                      onKeyDown={(event) => {
                        if (item.type !== "message") {
                          return;
                        }

                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleNotificationOpen(item);
                        }
                      }}
                      className={`rounded-xl border px-3 py-3 transition ${
                        item.is_read
                          ? "border-slate-200 bg-white"
                          : "border-blue-200 bg-blue-50/55 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]"
                      } ${item.type === "message" ? "cursor-pointer hover:border-blue-300 hover:bg-blue-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {!item.is_read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                            <p className="truncate text-sm font-semibold text-slate-900">{item.title || "Nouvelle notification"}</p>
                          </div>
                          <p className="mt-1 line-clamp-3 text-xs text-slate-600">{item.body || "Mise a jour disponible."}</p>
                          <div className="mt-2 flex items-center gap-2 text-[0.68rem] uppercase tracking-wide text-slate-500">
                            {item.type && <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">{item.type}</span>}
                            {createdAt && <span>{createdAt}</span>}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          {!item.is_read && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleMarkAsRead(item.id);
                              }}
                              disabled={isProcessing}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Marquer comme lue"
                            >
                              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDelete(item.id);
                            }}
                            disabled={isProcessing}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

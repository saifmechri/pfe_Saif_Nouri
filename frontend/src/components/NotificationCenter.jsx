import { useState, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/fr";

dayjs.extend(relativeTime);
dayjs.locale("fr");

const NotificationCenter = ({ notifications = [], onMarkAsRead, onDelete, isLoading = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "appointment":
        return "📅";
      case "message":
        return "💬";
      case "alert":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  const getStatusColor = (type) => {
    switch (type?.toLowerCase()) {
      case "appointment":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "message":
        return "bg-purple-50 border-purple-200 text-purple-700";
      case "alert":
        return "bg-amber-50 border-amber-200 text-amber-700";
      default:
        return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 transition rounded-lg hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Notifications</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-200">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-slate-500">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="h-12 w-12 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isExpanded = expandedId === notif.id;
                const colors = getStatusColor(notif.type);

                return (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-slate-50 transition cursor-pointer border-l-4 ${
                      !notif.is_read ? "border-blue-500 bg-blue-50/30" : "border-slate-300"
                    }`}
                  >
                    {/* Main Content */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : notif.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">{getNotificationIcon(notif.type)}</span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm leading-tight">
                                {notif.title}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {dayjs(notif.created_at).fromNow()}
                              </p>
                            </div>
                            {!notif.is_read && (
                              <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                            )}
                          </div>

                          {/* Preview */}
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{notif.body}</p>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{notif.body}</p>

                        {notif.metadata && Object.keys(notif.metadata).length > 0 && (
                          <div className="bg-slate-100 rounded p-2 text-xs text-slate-600 space-y-1">
                            {Object.entries(notif.metadata).map(([key, value]) => (
                              <div key={key}>
                                <strong>{key}:</strong> {String(value)}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          {!notif.is_read && (
                            <button
                              onClick={() => onMarkAsRead?.(notif.id)}
                              className="flex-1 flex items-center justify-center gap-1 rounded px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition"
                            >
                              <Check className="h-3 w-3" />
                              Marquer comme lue
                            </button>
                          )}
                          <button
                            onClick={() => onDelete?.(notif.id)}
                            className="flex-1 flex items-center justify-center gap-1 rounded px-2 py-1 bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition"
                          >
                            <X className="h-3 w-3" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;



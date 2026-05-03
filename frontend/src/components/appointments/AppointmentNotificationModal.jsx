import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/fr";

dayjs.extend(localizedFormat);
dayjs.locale("fr");

const AppointmentNotificationModal = ({ isOpen, onClose, notification, appointment }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen && notification?.type === "appointment") {
      const timer = setTimeout(() => {
        handleAutoClose();
      }, 8000); // Auto-close after 8 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, notification]);

  const handleAutoClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 300);
  };

  if (!isOpen || !notification) return null;

  const { title, body, metadata = {} } = notification;
  const status = notification.title?.toLowerCase();
  const isConfirmed = title?.includes("confirmé") || title?.includes("confirmed");
  const isCancelled = title?.includes("annulé") || title?.includes("cancelled");
  const isPending = title?.includes("nouveau");

  let iconColor = "text-blue-500";
  let bgColor = "bg-blue-50";
  let borderColor = "border-blue-200";
  let icon = Info;

  if (isConfirmed) {
    iconColor = "text-emerald-500";
    bgColor = "bg-emerald-50";
    borderColor = "border-emerald-200";
    icon = CheckCircle;
  } else if (isCancelled) {
    iconColor = "text-rose-500";
    bgColor = "bg-rose-50";
    borderColor = "border-rose-200";
    icon = AlertCircle;
  }

  const Icon = icon;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleAutoClose}
    >
      <div
        className={`relative w-full max-w-md transform rounded-2xl border ${borderColor} ${bgColor} p-8 shadow-2xl transition-all duration-300 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleAutoClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-white/50 hover:text-slate-600 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon & Title */}
        <div className="mb-4 flex items-start gap-4">
          <div className={`rounded-full ${bgColor} p-3`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">{title || "Notification Rendez-vous"}</h2>
            <p className="mt-1 text-sm text-slate-600">{body}</p>
          </div>
        </div>

        {/* Details Section */}
        {appointment && (
          <div className="space-y-3 border-t border-opacity-30 border-current pt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-semibold text-slate-700">Date</p>
                <p className="text-slate-600">{dayjs(appointment.appointment_date).format("D MMMM YYYY")}</p>
              </div>
              {appointment.appointment_time && (
                <div>
                  <p className="font-semibold text-slate-700">Heure</p>
                  <p className="text-slate-600">{appointment.appointment_time}</p>
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-700">Statut</p>
                <p className={`font-bold ${
                  appointment.status === "confirmed" ? "text-emerald-600" :
                  appointment.status === "cancelled" ? "text-rose-600" :
                  "text-amber-600"
                }`}>
                  {appointment.status === "confirmed" ? "✓ Confirmé" :
                   appointment.status === "cancelled" ? "✕ Annulé" :
                   "⏳ En attente"}
                </p>
              </div>
              {metadata.garageId && (
                <div>
                  <p className="font-semibold text-slate-700">Garage ID</p>
                  <p className="text-slate-600">{metadata.garageId}</p>
                </div>
              )}
            </div>

            {appointment.description && (
              <div className="rounded-lg bg-white/50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Description</p>
                <p className="mt-1 text-sm text-slate-700">{appointment.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Auto-close indicator */}
        <div className="mt-6 flex items-center gap-2">
          <div className="flex-1 rounded-full bg-white/30 h-1">
            <div
              className="h-full rounded-full bg-current bg-opacity-30 animate-pulse"
              style={{
                animation: isClosing ? "none" : "progress 8s linear forwards",
              }}
            />
          </div>
          <p className="text-xs text-slate-600">Se ferme automatiquement...</p>
        </div>

        <style>{`
          @keyframes progress {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AppointmentNotificationModal;

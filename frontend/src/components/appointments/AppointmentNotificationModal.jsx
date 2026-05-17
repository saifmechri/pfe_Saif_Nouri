import { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, Calendar } from "lucide-react";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/fr";
import { updateAppointment } from "../../services/appointments";
import { formatAppointmentDate } from "../../utils/appointmentConstants";

dayjs.extend(localizedFormat);
dayjs.locale("fr");

const AppointmentNotificationModal = ({ isOpen, onClose, notification, appointment, onAction, userRole }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [proposalDate, setProposalDate] = useState(dayjs().add(3, "day").format("YYYY-MM-DD"));
  const [proposalTime, setProposalTime] = useState("14:00");
  const [proposalNote, setProposalNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-close only if not a pending appointment request for garage user
  useEffect(() => {
    if (isOpen && notification?.type === "appointment") {
      const isPending = notification.title?.includes("Nouveau rendez-vous");
      const shouldAutoClose = !isPending || userRole !== "garage";
      
      if (shouldAutoClose) {
        const timer = setTimeout(() => {
          handleAutoClose();
        }, 8000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, notification, userRole]);

  const handleAutoClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShowProposal(false);
      onClose?.();
    }, 300);
  };

  const handleDecision = async (decision) => {
    try {
      setLoading(true);
      const status = decision === "accept" ? "confirmed" : "cancelled";
      await updateAppointment(appointment.id, { status });
      
      onAction?.(decision, appointment.id);
      
      setTimeout(() => {
        handleAutoClose();
      }, 500);
    } catch (err) {
      console.error("Erreur lors de la dÃ©cision:", err);
      alert("Erreur lors du traitement de votre réponse");
    } finally {
      setLoading(false);
    }
  };

  const handleProposalSubmit = async () => {
    try {
      setLoading(true);
      
      // Update with proposed status and suggested date
      await updateAppointment(appointment.id, {
        status: "proposed",
        proposed_date: proposalDate,
        proposed_time: proposalTime,
        proposed_note: proposalNote
      });
      
      onAction?.("propose", appointment.id, { proposalDate, proposalTime, proposalNote });
      
      setTimeout(() => {
        handleAutoClose();
      }, 500);
    } catch (err) {
      console.error("Erreur lors de la proposition:", err);
      alert("Erreur lors de l'envoi de la proposition");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !notification) return null;

  const { title, body, metadata = {} } = notification;
  const status = notification.title?.toLowerCase();
  const isConfirmed = title?.includes("confirmé") || title?.includes("confirmed");
  const isCancelled = title?.includes("annulé") || title?.includes("cancelled");
  const isPending = title?.includes("Nouveau rendez-vous");

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
  const isGarageUser = userRole === "garage";
  const canRespond = isPending && isGarageUser && appointment;

  // If showing proposal form
  if (showProposal) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleAutoClose}
      >
        <div
          className={`relative w-full max-w-md transform rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-2xl transition-all duration-300 ${
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

          {/* Header */}
          <div className="mb-6 flex items-start gap-4">
            <div className="rounded-full bg-amber-100 p-3">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">Proposer une autre date</h2>
              <p className="mt-1 text-sm text-slate-600">La date proposée n'est pas disponible?</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleProposalSubmit(); }} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Nouvelle date</label>
              <input
                type="date"
                value={proposalDate}
                onChange={(e) => setProposalDate(e.target.value)}
                min={dayjs().format("YYYY-MM-DD")}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Heure proposée</label>
              <input
                type="time"
                value={proposalTime}
                onChange={(e) => setProposalTime(e.target.value)}
                min="08:00"
                max="18:00"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Note ou justification (optionnel)</label>
              <textarea
                value={proposalNote}
                onChange={(e) => setProposalNote(e.target.value)}
                placeholder="Ex: Pas disponible ce jour, mais nous pouvons vous accueillir le..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowProposal(false)}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 font-semibold text-white shadow transition hover:from-amber-600 hover:to-orange-600 disabled:opacity-50"
              >
                {loading ? "Envoi..." : "Envoyer la proposition"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
                <p className="text-slate-600">{formatAppointmentDate(appointment.appointment_date)}</p>
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
                  {appointment.status === "confirmed" ? "âœ“ Confirmé" :
                   appointment.status === "cancelled" ? "âœ• Annulé" :
                   appointment.status === "proposed" ? "ðŸ“… Proposition" :
                   "â³ En attente"}
                </p>
              </div>
            </div>

            {appointment.description && (
              <div className="rounded-lg bg-white/50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Description</p>
                <p className="mt-1 text-sm text-slate-700">{appointment.description}</p>
              </div>
            )}

            {/* Action Buttons for Garage User on Pending Appointment */}
            {canRespond && (
              <div className="flex flex-col gap-2 pt-4 border-t border-opacity-30 border-current">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecision("accept")}
                    disabled={loading}
                    className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                  >
                    âœ“ Accepter
                  </button>
                  <button
                    onClick={() => handleDecision("reject")}
                    disabled={loading}
                    className="flex-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    âœ• Refuser
                  </button>
                </div>
                <button
                  onClick={() => setShowProposal(true)}
                  disabled={loading}
                  className="w-full rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-200 disabled:opacity-50"
                >
                  ðŸ“… Proposer une autre date
                </button>
              </div>
            )}
          </div>
        )}

        {/* Auto-close indicator - only show if not actionable */}
        {!canRespond && (
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
        )}

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



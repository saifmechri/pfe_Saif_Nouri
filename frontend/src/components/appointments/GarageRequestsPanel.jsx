import { Clock, User, Phone, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/fr";

dayjs.extend(localizedFormat);
dayjs.locale("fr");

const GarageRequestsPanel = ({
  requests = [],
  onAccept,
  onReject,
  isLoading = false,
  filter = "all"
}) => {
  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    confirmed: requests.filter((r) => r.status === "confirmed").length,
    cancelled: requests.filter((r) => r.status === "cancelled").length,
  };

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return {
          icon: CheckCircle,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          badge: "bg-emerald-100 text-emerald-700",
          label: "Confirmé",
        };
      case "cancelled":
        return {
          icon: XCircle,
          color: "text-rose-600",
          bg: "bg-rose-50",
          badge: "bg-rose-100 text-rose-700",
          label: "Annulé",
        };
      case "pending":
      default:
        return {
          icon: AlertCircle,
          color: "text-amber-600",
          bg: "bg-amber-50",
          badge: "bg-amber-100 text-amber-700",
          label: "En attente",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">En attente</p>
              <p className="mt-2 text-2xl font-black text-amber-900">{stats.pending}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-400" />
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Confirmés</p>
              <p className="mt-2 text-2xl font-black text-emerald-900">{stats.confirmed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Annulés</p>
              <p className="mt-2 text-2xl font-black text-rose-900">{stats.cancelled}</p>
            </div>
            <XCircle className="h-8 w-8 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-12">
            <p className="text-sm text-slate-600">Chargement des demandes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-12">
            <AlertCircle className="h-12 w-12 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">Aucune demande</p>
            <p className="text-xs text-slate-500">
              {filter === "all" ? "Vous n'avez pas de demande de rendez-vous" : `Aucune demande ${filter}`}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const statusInfo = getStatusInfo(request.status);
            const StatusIcon = statusInfo.icon;
            const appointmentDateTime = dayjs(
              `${request.appointment_date}T${request.appointment_time || "12:00"}`
            );
            const isUpcoming = appointmentDateTime.isAfter(dayjs());
            const isPending = request.status === "pending";

            return (
              <div
                key={request.id}
                className={`overflow-hidden rounded-2xl border transition ${
                  isPending
                    ? "border-amber-200 bg-gradient-to-r from-amber-50 to-white shadow-sm hover:shadow-md"
                    : "border-slate-200 bg-white hover:shadow-sm"
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex flex-1 items-start gap-4">
                      {/* Avatar */}
                      <div className={`flex-shrink-0 rounded-full ${statusInfo.bg} p-3`}>
                        <StatusIcon className={`h-6 w-6 ${statusInfo.color}`} />
                      </div>

                      {/* Title & Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-lg">
                            {request.automobiliste_name || `Automobiliste #${request.automobiliste_user_id}`}
                          </h3>
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${statusInfo.badge}`}>
                            {statusInfo.label}
                          </span>
                          {isUpcoming && isPending && (
                            <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                              À répondre
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          Demande #{request.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">ðŸ“… Date</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {appointmentDateTime.format("D MMMM YYYY")}
                      </p>
                    </div>
                    {request.appointment_time && (
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">â° Heure</p>
                        <p className="mt-1 font-medium text-slate-900">{request.appointment_time}</p>
                      </div>
                    )}
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">ðŸ“ Type</p>
                      <p className="mt-1 font-medium text-slate-900 truncate">
                        {request.description || "Consultation"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">ðŸ• Créée</p>
                      <p className="mt-1 font-medium text-slate-900 text-sm">
                        {dayjs(request.created_at).fromNow()}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {request.description && (
                    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Description
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                        {request.description}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {request.notes && (
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700 flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Notes
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-blue-900">
                        {request.notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {isPending && (
                    <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                      <button
                        onClick={() => onAccept?.(request.id)}
                        className="flex-1 sm:flex-none rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Valider le RDV
                      </button>
                      <button
                        onClick={() => onReject?.(request.id)}
                        className="flex-1 sm:flex-none rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 font-semibold text-rose-700 transition hover:bg-rose-100 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Refuser
                      </button>
                    </div>
                  )}

                  {/* Status message for non-pending */}
                  {!isPending && (
                    <div className={`border-t ${statusInfo.bg} pt-4`}>
                      <p className={`text-sm font-medium ${statusInfo.color}`}>
                        {request.status === "confirmed"
                          ? "âœ“ Rendez-vous confirmé"
                          : "âœ• Rendez-vous annulé"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GarageRequestsPanel;



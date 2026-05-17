import { useState } from "react";
import { ChevronDown, Trash2, Clock, MapPin, User, Calendar } from "lucide-react";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/fr";
import { formatAppointmentDate, parseAppointmentNotes } from "../../utils/appointmentConstants";

dayjs.extend(localizedFormat);
dayjs.locale("fr");

const AppointmentTable = ({ items = [], onDelete, onUpdate, isLoading = false }) => {
  const [sortBy, setSortBy] = useState("date-asc");
  const [expandedId, setExpandedId] = useState(null);

  const sortedItems = [...items].sort((a, b) => {
    const dateA = new Date(`${a.appointment_date}T${a.appointment_time || "00:00"}`);
    const dateB = new Date(`${b.appointment_date}T${b.appointment_time || "00:00"}`);

    if (sortBy === "date-asc") return dateA - dateB;
    if (sortBy === "date-desc") return dateB - dateA;
    if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
    return dateA - dateB;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100" };
      case "cancelled":
        return { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-100" };
      case "pending":
      default:
        return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100" };
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed": return "Confirmé";
      case "cancelled": return "Annulé";
      case "pending": return "En attente";
      default: return status || "Non dÃ©fini";
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{items.length} rendez-vous</p>
          <p className="text-xs text-slate-600">TriÃ©s par : {sortBy === "date-asc" ? "Date (plus proche)" : sortBy === "date-desc" ? "Date (plus loin)" : "Statut"}</p>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date-asc">ðŸ“… Date (plus proche)</option>
          <option value="date-desc">ðŸ“… Date (plus loin)</option>
          <option value="status">ðŸ·ï¸ Statut</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-slate-500">Chargement des rendez-vous...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-600">Aucun rendez-vous</p>
              <p className="text-xs text-slate-500">Commencez par réserver un rendez-vous</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {sortedItems.map((item) => {
              const colors = getStatusColor(item.status);
              const isExpanded = expandedId === item.id;
              const appointmentDateTime = dayjs(`${item.appointment_date}T${item.appointment_time || "12:00"}`);
              const isUpcoming = appointmentDateTime.isValid() && appointmentDateTime.isAfter(dayjs());
              const parsedNotes = parseAppointmentNotes(item.notes);
              const servicesLabel = parsedNotes.services.length > 0 ? parsedNotes.services.join(", ") : "Aucun service renseignÃ©";
              const createdAtLabel = dayjs(item.created_at).isValid()
                ? dayjs(item.created_at).format("D MMMM YYYY [Ã ] HH:mm")
                : "â€”";

              return (
                <div key={item.id} className="hover:bg-slate-50 transition">
                  {/* Main Row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full px-6 py-4 text-left focus:outline-none"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-1 items-center gap-4">
                        {/* Date/Time */}
                        <div className="flex flex-col gap-1 min-w-[140px]">
                          <p className="font-semibold text-slate-900">
                            {formatAppointmentDate(item.appointment_date)}
                          </p>
                          {item.appointment_time && (
                            <p className="flex items-center gap-1 text-sm text-slate-600">
                              <Clock className="h-3 w-3" />
                              {item.appointment_time}
                            </p>
                          )}
                        </div>

                        {/* Garage/Description */}
                        <div className="flex-1 min-w-[200px]">
                          <p className="font-medium text-slate-900">{item.garage_name || item.garage_id || "Garage"}</p>
                          <p className="text-sm text-slate-600 line-clamp-1">{item.description || "Aucune description"}</p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${colors.badge}`}>
                            {getStatusLabel(item.status)}
                          </span>
                          {isUpcoming && item.status?.toLowerCase() === "pending" && (
                            <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">À rÃ©pondre</span>
                          )}
                        </div>
                      </div>

                      {/* Expand Icon */}
                      <ChevronDown
                        className={`h-5 w-5 text-slate-400 transition ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className={`border-t ${colors.border} bg-opacity-50 ${colors.bg} px-6 py-4`}>
                      <div className="space-y-3">
                        {/* Details Grid */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Garage</p>
                            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
                              <MapPin className="h-4 w-4" />
                              {item.garage_name || item.garage_id}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Date & Heure</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">
                              {formatAppointmentDate(item.appointment_date)}
                              {item.appointment_time && ` Ã  ${item.appointment_time}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Statut</p>
                            <p className={`mt-1 text-sm font-medium ${colors.text}`}>
                              {getStatusLabel(item.status)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Créé le</p>
                            <p className="mt-1 text-sm text-slate-700">
                              {createdAtLabel}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Description</p>
                            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white bg-opacity-50 p-2 text-sm text-slate-700">
                              {item.description}
                            </p>
                          </div>
                        )}

                        {/* Notes */}
                        {item.notes && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Notes</p>
                            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white bg-opacity-50 p-2 text-sm text-slate-700">
                              {parsedNotes.remark || item.notes}
                            </p>
                          </div>
                        )}

                        {parsedNotes.services.length > 0 && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Services optionnels</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {parsedNotes.services.map((service) => (
                                <span key={service} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                  {service}
                                </span>
                              ))}
                            </div>
                            <p className="mt-2 text-xs text-slate-500">{servicesLabel}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {item.status?.toLowerCase() === "pending" && (
                            <>
                              <button
                                onClick={() => onUpdate?.(item.id, "confirmed")}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                              >
                                âœ“ Confirmer
                              </button>
                              <button
                                onClick={() => onUpdate?.(item.id, "cancelled")}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                              >
                                âœ• Annuler
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => onDelete?.(item.id)}
                            className="ml-auto rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 flex items-center gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentTable;



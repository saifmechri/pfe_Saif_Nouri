import { useEffect, useState, useMemo } from "react";
import { Calendar, Clock, Plus, ChevronRight, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { listAppointments, deleteAppointment } from "../../services/appointments";
dayjs.locale("fr");

const AutomobilisteDashboardAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await listAppointments({ limit: 50 });
      const items = res.data?.data?.items || res.data?.data || res.data || [];
      const nextItems = Array.isArray(items) ? items : [];
      setAppointments(nextItems);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr ?")) return;
    try {
      await deleteAppointment(id);
      await fetchAppointments();
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "confirmed" || a.status === "pending")
        .sort(
          (a, b) =>
            new Date(a.appointment_date) - new Date(b.appointment_date)
        )
        .slice(0, 5),
    [appointments]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">
              Automobiliste
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              Mes rendez-vous
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Consultez et gérez vos rendez-vous prochains.
            </p>
          </div>
          <button
            onClick={() => window.open("/automobiliste/appointments", "_blank")}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Réserver
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-3 md:gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs font-bold text-slate-600">TOTAL</p>
            <p className="mt-1 text-3xl font-black text-slate-900">
              {appointments.length}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-xs font-bold text-emerald-700">CONFIRMÉS</p>
            <p className="mt-1 text-3xl font-black text-emerald-900">
              {appointments.filter((a) => a.status === "confirmed").length}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-xs font-bold text-amber-700">EN ATTENTE</p>
            <p className="mt-1 text-3xl font-black text-amber-900">
              {appointments.filter((a) => a.status === "pending").length}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <h3 className="text-lg font-black text-slate-900 mb-4">
            ðŸ“… À venir ({upcomingAppointments.length})
          </h3>
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className={`rounded-xl border-l-4 p-4 ${
                  apt.status === "confirmed"
                    ? "border-l-emerald-500 border border-emerald-200 bg-emerald-50"
                    : "border-l-amber-500 border border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">
                        {apt.garage_name || "Garage"}
                      </p>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold whitespace-nowrap ${
                          apt.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {apt.status === "confirmed"
                          ? "âœ“ Confirmé"
                          : "â³ En attente"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-col gap-1 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {dayjs(apt.appointment_date).format("dddd D MMMM YYYY")}
                      </div>
                      {apt.appointment_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {apt.appointment_time}
                        </div>
                      )}
                    </div>
                    {apt.description && (
                      <p className="mt-2 text-xs text-slate-600">
                        <strong>Service:</strong> {apt.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Appointments */}
      <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
        <h3 className="text-lg font-black text-slate-900 mb-4">
          ðŸ“‹ Tous mes rendez-vous ({appointments.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-600">Chargement...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <p className="text-sm text-slate-600">Aucun rendez-vous.</p>
            <button
              onClick={() => window.open("/automobiliste/appointments", "_blank")}
              className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              Réserver votre premier rendez-vous
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className={`rounded-xl border-l-4 p-4 flex items-start justify-between gap-4 ${
                  apt.status === "confirmed"
                    ? "border-l-emerald-500 border border-emerald-200 bg-emerald-50"
                    : apt.status === "cancelled"
                    ? "border-l-rose-500 border border-rose-200 bg-rose-50"
                    : "border-l-amber-500 border border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-900">
                      {apt.garage_name || "Garage"}
                    </p>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold whitespace-nowrap ${
                        apt.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-700"
                          : apt.status === "cancelled"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {apt.status === "confirmed"
                        ? "âœ“ Confirmé"
                        : apt.status === "cancelled"
                        ? "âœ• Annulé"
                        : "â³ En attente"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col gap-1 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {dayjs(apt.appointment_date).format("dddd D MMMM YYYY")}
                    </div>
                    {apt.appointment_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {apt.appointment_time}
                      </div>
                    )}
                  </div>
                  {apt.description && (
                    <p className="mt-2 text-xs text-slate-600">
                      <strong>Service:</strong> {apt.description}
                    </p>
                  )}
                </div>
                {apt.status === "pending" && (
                  <button
                    onClick={() => handleDelete(apt.id)}
                    className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
        <h3 className="text-lg font-black text-slate-900 mb-4">Actions rapides</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={() => fetchAppointments()}
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            ðŸ”„ Actualiser
          </button>
          <button
            onClick={() => window.open("/automobiliste/appointments", "_blank")}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Gérer mes rendez-vous
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutomobilisteDashboardAppointments;



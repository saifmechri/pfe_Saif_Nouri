import { useEffect, useState, useMemo } from "react";
import { Calendar, Clock, CheckCircle2, XCircle, Clock3, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { Link } from "react-router-dom";
import { listAppointments, updateAppointment } from "../../services/appointments";
import { getCompleteProfileById } from "../../services/user";
import { formatAppointmentDate } from "../../utils/appointmentConstants";
dayjs.locale("fr");

const GarageDashboardAppointments = ({ garageId }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, cancelled: 0 });

  const fetchAppointments = async () => {
    if (!garageId) return;
    setLoading(true);
    try {
      const res = await listAppointments({ garageId, limit: 50 });
      const items = res.data?.data?.items || res.data?.data || res.data || [];
      const nextItems = Array.isArray(items) ? items : [];

      // Enrich with automobiliste_name
      const userIds = Array.from(
        new Set(nextItems.map((it) => Number(it.automobiliste_user_id)).filter(Boolean))
      );
      const usersMap = {};
      await Promise.all(
        userIds.map(async (uid) => {
          try {
            const r = await getCompleteProfileById(uid);
            const payload = r.data?.data || r.data || {};
            usersMap[uid] = payload?.name || payload?.nom || payload?.prenom || `${uid}`;
          } catch (err) {
            usersMap[uid] = `${uid}`;
          }
        })
      );

      const enriched = nextItems.map((a) => ({
        ...a,
        automobiliste_name:
          usersMap[Number(a.automobiliste_user_id)] || undefined,
      }));
      setAppointments(enriched);

      // Calculate stats
      const statsPending = enriched.filter((a) => a.status === "pending").length;
      const statsConfirmed = enriched.filter((a) => a.status === "confirmed")
        .length;
      const statsCancelled = enriched.filter((a) => a.status === "cancelled")
        .length;
      setStats({
        pending: statsPending,
        confirmed: statsConfirmed,
        cancelled: statsCancelled,
      });
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await updateAppointment(id, { status: "confirmed" });
      await fetchAppointments();
    } catch (err) {
      alert("Erreur lors de la confirmation");
    }
  };

  const handleCancel = async (id) => {
    try {
      await updateAppointment(id, { status: "cancelled" });
      await fetchAppointments();
    } catch (err) {
      alert("Erreur lors de l'annulation");
    }
  };

  useEffect(() => {
    if (garageId) fetchAppointments();
  }, [garageId]);

  const pendingAppointments = useMemo(
    () => appointments.filter((a) => a.status === "pending"),
    [appointments]
  );

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">
              Garage
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              Demandes de rendez-vous
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Gérez les demandes entrantes et validez les rendez-vous.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-3 gap-3 md:gap-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-xs font-bold text-amber-700">EN ATTENTE</p>
            <p className="mt-1 text-3xl font-black text-amber-900">{stats.pending}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-xs font-bold text-emerald-700">CONFIRMÃ‰</p>
            <p className="mt-1 text-3xl font-black text-emerald-900">
              {stats.confirmed}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
            <p className="text-xs font-bold text-rose-700">ANNULÃ‰</p>
            <p className="mt-1 text-3xl font-black text-rose-900">{stats.cancelled}</p>
          </div>
        </div>
      </div>

      {/* Pending Requests (Priority) */}
      {pendingAppointments.length > 0 && (
        <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <h3 className="text-lg font-black text-slate-900 mb-4">
            ðŸ”” Demandes en attente ({pendingAppointments.length})
          </h3>
          <div className="space-y-3">
            {pendingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <p className="font-bold text-slate-900">
                    {apt.automobiliste_name || "Automobiliste"}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                    <Calendar className="h-4 w-4" />
                    {formatAppointmentDate(apt.appointment_date)}
                  </div>
                  {apt.appointment_time && (
                    <div className="flex items-center gap-2 text-sm text-slate-700 mt-1">
                      <Clock className="h-4 w-4" />
                      {apt.appointment_time}
                    </div>
                  )}
                  {apt.description && (
                    <p className="mt-2 text-xs text-slate-600">
                      <strong>Service:</strong> {apt.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleConfirm(apt.id)}
                    className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Valider
                  </button>
                  <button
                    onClick={() => handleCancel(apt.id)}
                    className="flex items-center gap-2 rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                  >
                    <XCircle className="h-4 w-4" />
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Appointments */}
      <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
        <h3 className="text-lg font-black text-slate-900 mb-4">
          ðŸ“‹ Tous les rendez-vous ({appointments.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-600">Chargement...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <p className="text-sm text-slate-600">
              Aucune demande de rendez-vous pour le moment.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className={`rounded-xl border-l-4 p-4 transition ${
                  apt.status === "confirmed"
                    ? "border-l-emerald-500 border border-emerald-200 bg-emerald-50"
                    : apt.status === "cancelled"
                    ? "border-l-rose-500 border border-rose-200 bg-rose-50"
                    : "border-l-amber-500 border border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900">
                        {apt.automobiliste_name || `Automobiliste #${apt.automobiliste_user_id}`}
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
                        {formatAppointmentDate(apt.appointment_date)}
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
                    {apt.notes && (
                      <p className="mt-1 text-xs text-slate-600">
                        <strong>Notes:</strong> {apt.notes}
                      </p>
                    )}
                  </div>
                </div>
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
            ðŸ”„ Actualiser les demandes
          </button>
          <Link
            to="/garage/appointments"
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Recevoir RDV
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GarageDashboardAppointments;



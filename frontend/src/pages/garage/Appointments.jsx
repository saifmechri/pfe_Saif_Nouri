import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import PlatformLayout from "../../components/PlatformLayout";
import TopBar from "../../components/TopBar";
import { listAppointments, updateAppointment } from "../../services/appointments";
import { getCompleteProfileById } from "../../services/user";
import { getMyGarage } from "../../services/garage";
import AppointmentCalendar from "../../components/appointments/AppointmentCalendar";
import GarageRequestsPanel from "../../components/appointments/GarageRequestsPanel";
import AppointmentNotificationModal from "../../components/appointments/AppointmentNotificationModal";
import { Calendar, ListChecks } from "lucide-react";

const normalizeAppointmentDate = (item) => item.appointment_date || item.appointmentDate || item.date || "";

const formatAppointmentDate = (value) => {
  if (!value) return "Date inconnue";

  const parsed = dayjs(value);
  if (parsed.isValid()) return parsed.format("dddd D MMMM YYYY");

  const fallback = dayjs(String(value).split(" ")[0]);
  return fallback.isValid() ? fallback.format("dddd D MMMM YYYY") : String(value);
};

const GarageAppointments = () => {
  const navigate = useNavigate();
  const [garageId, setGarageId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const appointmentStats = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter((item) => item.status === "pending").length,
    confirmed: appointments.filter((item) => item.status === "confirmed").length,
    cancelled: appointments.filter((item) => item.status === "cancelled").length
  }), [appointments]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("panel"); // "panel", "calendar"
  const [notification, setNotification] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

        const fetchMyGarage = async () => {
          try {
            const res = await getMyGarage();
            const data = res.data?.data || res.data || {};
            const id = data?.id || data?.garage_id || data?.garageId || null;
            if (id) setGarageId(id);
          } catch (err) {
            console.warn("Impossible de récupérer garage courant", err?.message || err);
          }
        };

        const fetchAppointments = async (id, nextStatusFilter = statusFilter) => {
          if (!id) return;

          setLoading(true);
          try {
            const params = { garageId: id };
            if (nextStatusFilter && nextStatusFilter !== "all") params.status = nextStatusFilter;

            const res = await listAppointments(params);
            const items = res.data?.data?.items || res.data?.data || res.data || [];
            const nextItems = Array.isArray(items) ? items : [];

            const userIds = Array.from(new Set(nextItems.map((item) => Number(item.automobiliste_user_id)).filter(Boolean)));
            const usersMap = {};

            await Promise.all(
              userIds.map(async (uid) => {
                try {
                  const result = await getCompleteProfileById(uid);
                  const payload = result.data?.data || result.data || {};
                  usersMap[uid] = payload?.name || payload?.nom || payload?.prenom || `${uid}`;
                } catch (err) {
                  usersMap[uid] = `${uid}`;
                }
              })
            );

            const enriched = nextItems.map((item) => ({
              ...item,
              automobiliste_name: usersMap[Number(item.automobiliste_user_id)] || undefined
            }));

            setAppointments(enriched);

            if (!selectedDate && enriched.length > 0) {
              setSelectedDate(normalizeAppointmentDate(enriched[0]) || dayjs().format("YYYY-MM-DD"));
            }
          } catch (err) {
            console.error(err);
          } finally {
            setLoading(false);
          }
        };

        const filteredAppointments = useMemo(() => {
          let items = appointments;

          if (selectedDate) {
            items = items.filter((item) => item.appointment_date === selectedDate);
          }

          if (searchQuery && searchQuery.trim()) {
            const q = String(searchQuery).toLowerCase();
            items = items.filter((item) => {
              return (
                String(item.automobiliste_name || item.automobiliste_user_id || "").toLowerCase().includes(q) ||
                String(item.description || "").toLowerCase().includes(q)
              );
            });
          }

          return items;
        }, [appointments, selectedDate, searchQuery]);

        useEffect(() => {
          fetchMyGarage();
        }, []);

        useEffect(() => {
          if (garageId) fetchAppointments(garageId);
        }, [garageId]);

        const handleDecision = async (id, decision) => {
          const status = decision === "accept" ? "confirmed" : "cancelled";

          try {
            const apt = appointments.find((item) => item.id === id);
            await updateAppointment(id, { status });

            setNotification({
              type: "appointment",
              title: status === "confirmed" ? "✅ Rendez-vous confirmé" : "❌ Rendez-vous annulé",
              body: `La demande de ${apt?.automobiliste_name || "l'automobiliste"} a été ${status === "confirmed" ? "confirmée" : "annulée"}.`
            });
            setSelectedAppointment(apt);

            fetchAppointments(garageId);
          } catch (err) {
            console.error(err);
          }
        };

        const handleProposalAction = async (decision, appointmentId, proposalData) => {
          try {
            const apt = appointments.find((item) => item.id === appointmentId);

            if (decision === "propose" && proposalData) {
              setNotification({
                type: "appointment",
                title: "📅 Proposition de date envoyée",
                body: `Une alternative pour ${proposalData.proposalDate} à ${proposalData.proposalTime} a été proposée à l'automobiliste.`
              });
            } else if (decision === "accept") {
              setNotification({
                type: "appointment",
                title: "✅ Rendez-vous confirmé",
                body: `Confirmé pour ${apt?.appointment_date} à ${apt?.appointment_time || "sans heure spécifiée"}`
              });
            } else if (decision === "reject") {
              setNotification({
                type: "appointment",
                title: "❌ Rendez-vous refusé",
                body: `Refusé pour ${apt?.appointment_date}`
              });
            }

            setSelectedAppointment(apt);
            fetchAppointments(garageId);
          } catch (err) {
            console.error(err);
          }
        };

        const selectedDayLabel = selectedDate ? formatAppointmentDate(selectedDate) : "Aucune date sélectionnée";

        return (
          <PlatformLayout>
            <TopBar onLogout={() => navigate("/login", { replace: true })} />
            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(180deg,_#fffaf2_0%,_#f7f0e4_100%)] py-8">
              <div className="mx-auto max-w-7xl space-y-6 px-4">
                <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                  <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">Réservation</p>
                      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Demandes de rendez-vous</h1>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Recevez, validez et gérez les demandes de rendez-vous des automobilistes dans un tableau clair et rapide.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Total</div>
                        <div className="mt-1 text-2xl font-black text-slate-900">{appointmentStats.total}</div>
                      </div>
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">En attente</div>
                        <div className="mt-1 text-2xl font-black text-amber-800">{appointmentStats.pending}</div>
                      </div>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Confirmés</div>
                        <div className="mt-1 text-2xl font-black text-emerald-800">{appointmentStats.confirmed}</div>
                      </div>
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-rose-700">Annulés</div>
                        <div className="mt-1 text-2xl font-black text-rose-800">{appointmentStats.cancelled}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 rounded-[22px] border border-slate-200 bg-white/85 p-2 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur">
                  <button
                    onClick={() => setActiveTab("panel")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 font-semibold transition ${
                      activeTab === "panel"
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <ListChecks className="h-5 w-5" />
                    Vue Liste
                  </button>
                  <button
                    onClick={() => setActiveTab("calendar")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 font-semibold transition ${
                      activeTab === "calendar"
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Calendar className="h-5 w-5" />
                    Vue Calendrier
                  </button>
                </div>

                {activeTab === "panel" ? (
                  <>
                    <div className="rounded-[28px] border border-amber-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <select
                            value={statusFilter}
                            onChange={(event) => {
                              const nextStatusFilter = event.target.value;
                              setStatusFilter(nextStatusFilter);
                              if (garageId) fetchAppointments(garageId, nextStatusFilter);
                            }}
                            className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                          >
                            <option value="all">Tous statuts</option>
                            <option value="pending">En attente</option>
                            <option value="confirmed">Confirmé</option>
                            <option value="cancelled">Annulé</option>
                          </select>
                          <input
                            placeholder="Rechercher (automobiliste / description)"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            className="min-w-[260px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                          />
                        </div>
                        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{selectedDayLabel}</div>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                      {!garageId ? (
                        <div className="flex items-center justify-center py-12">
                          <p className="text-sm text-slate-600">Chargement de votre garage...</p>
                        </div>
                      ) : (
                        <GarageRequestsPanel
                          requests={filteredAppointments}
                          onAccept={(id) => handleDecision(id, "accept")}
                          onReject={(id) => handleDecision(id, "reject")}
                          isLoading={loading}
                          filter={statusFilter === "all" ? undefined : statusFilter}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-[28px] border border-amber-100 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <select
                            value={statusFilter}
                            onChange={(event) => {
                              const nextStatusFilter = event.target.value;
                              setStatusFilter(nextStatusFilter);
                              if (garageId) fetchAppointments(garageId, nextStatusFilter);
                            }}
                            className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                          >
                            <option value="all">Tous statuts</option>
                            <option value="pending">En attente</option>
                            <option value="confirmed">Confirmé</option>
                            <option value="cancelled">Annulé</option>
                          </select>
                          <input
                            placeholder="Rechercher (automobiliste / description)"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            className="min-w-[260px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                          />
                        </div>
                        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{selectedDayLabel}</div>
                      </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
                      <AppointmentCalendar
                        title="Demandes reçues"
                        items={appointments}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        getItemDate={(item) => normalizeAppointmentDate(item)}
                        getItemStatus={(item) => item.status}
                        getItemLabel={(item) => `${item.appointment_time ? `${item.appointment_time} · ` : ""}${item.description || "Demande"}`}
                      />

                      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <h2 className="text-xl font-black text-slate-900">Demandes du jour</h2>
                            <p className="text-sm text-slate-600">Filtrées sur la date sélectionnée.</p>
                          </div>
                          <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">{filteredAppointments.length}</div>
                        </div>

                        {!garageId && <p className="text-sm text-slate-600">Chargement de votre garage...</p>}
                        {loading && <p className="text-sm text-slate-500">Chargement des demandes...</p>}
                        {!loading && filteredAppointments.length === 0 && <p className="text-sm text-slate-500">Aucune demande pour cette date.</p>}

                        <ul className="mt-4 space-y-3">
                          {filteredAppointments.map((item) => (
                            <li
                              key={item.id}
                              className={`rounded-2xl border p-4 transition ${
                                item.status === "pending" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="font-bold text-slate-900">
                                    {formatAppointmentDate(item.appointment_date)}
                                    {item.appointment_time && ` à ${item.appointment_time}`}
                                  </div>
                                  <div className="mt-1 text-sm font-medium text-slate-700">
                                    {item.automobiliste_name || `Automobiliste #${item.automobiliste_user_id}`}
                                  </div>
                                  {item.description && <div className="mt-2 text-sm text-slate-600">{item.description}</div>}
                                </div>
                                <span
                                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${
                                    item.status === "confirmed"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : item.status === "cancelled"
                                      ? "bg-rose-50 text-rose-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {item.status === "confirmed" ? "✅ Confirmé" : item.status === "cancelled" ? "❌ Annulé" : "⏳ Attente"}
                                </span>
                              </div>

                              {item.status === "pending" && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                    onClick={() => handleDecision(item.id, "accept")}
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                  >
                                    ✅ Valider
                                  </button>
                                  <button
                                    onClick={() => handleDecision(item.id, "reject")}
                                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                                  >
                                    ❌ Refuser
                                  </button>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <AppointmentNotificationModal
              isOpen={!!notification}
              onClose={() => setNotification(null)}
              notification={notification}
              appointment={selectedAppointment}
              userRole="garage"
              onAction={handleProposalAction}
            />
          </PlatformLayout>
        );
};

export default GarageAppointments;





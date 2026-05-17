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
      console.warn('Impossible de récupérer garage courant', err?.message || err);
    }
  };

  const fetchAppointments = async (id, nextStatusFilter = statusFilter) => {
    if (!id) return;
    setLoading(true);
    try {
      const params = { garageId: id };
      if (nextStatusFilter && nextStatusFilter !== 'all') params.status = nextStatusFilter;
      const res = await listAppointments(params);
      const items = res.data?.data?.items || res.data?.data || res.data || [];
      const nextItems = Array.isArray(items) ? items : [];

      // enrich with automobiliste_name by fetching profiles
      const userIds = Array.from(new Set(nextItems.map((it) => Number(it.automobiliste_user_id)).filter(Boolean)));
      const usersMap = {};
      await Promise.all(userIds.map(async (uid) => {
        try {
          const r = await getCompleteProfileById(uid);
          const payload = r.data?.data || r.data || {};
          usersMap[uid] = payload?.name || payload?.nom || payload?.prenom || `${uid}`;
        } catch (err) {
          usersMap[uid] = `${uid}`;
        }
      }));

      const enriched = nextItems.map((a) => ({ ...a, automobiliste_name: usersMap[Number(a.automobiliste_user_id)] || undefined }));
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
    if (selectedDate) items = items.filter((item) => item.appointment_date === selectedDate);
    if (searchQuery && searchQuery.trim()) {
      const q = String(searchQuery).toLowerCase();
      items = items.filter((it) => {
        return (String(it.automobiliste_name || it.automobiliste_user_id || "").toLowerCase().includes(q) || String(it.description || "").toLowerCase().includes(q));
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
    const status = decision === 'accept' ? 'confirmed' : 'cancelled';
    try {
      const apt = appointments.find((a) => a.id === id);
      await updateAppointment(id, { status });

      // Show notification
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
      const apt = appointments.find((a) => a.id === appointmentId);
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
          body: `Confirmé pour ${apt?.appointment_date} à ${apt?.appointment_time || 'sans heure spécifiée'}`
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

  const handleSelectDate = (dateKey) => {
    setSelectedDate(dateKey);
  };


  const selectedDayLabel = selectedDate
    ? formatAppointmentDate(selectedDate)
    : "Aucune date sélectionnée";

  return (
    <PlatformLayout>
      <TopBar onLogout={() => navigate("/login", { replace: true })} />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4">
          {/* Header */}
          <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-700">Garage</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Demandes de rendez-vous</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Recevez, validez et gérez les demandes de rendez-vous des automobilistes.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                {selectedDayLabel}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("panel")}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition border-b-2 ${
                activeTab === "panel"
                  ? "border-sky-500 text-sky-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <ListChecks className="h-5 w-5" />
              Vue Liste
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition border-b-2 ${
                activeTab === "calendar"
                  ? "border-sky-500 text-sky-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="h-5 w-5" />
              Vue Calendrier
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "panel" ? (
            <>
              {/* Filters */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      const nextStatusFilter = e.target.value;
                      setStatusFilter(nextStatusFilter);
                      if (garageId) fetchAppointments(garageId, nextStatusFilter);
                    }}
                    className="vb-input px-3 py-2"
                  >
                    <option value="all">Tous statuts</option>
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                  <input
                    placeholder="Rechercher (automobiliste / description)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="vb-input px-3 py-2"
                  />
                </div>
              </div>

              {/* Requests Panel */}
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
              {/* Filters */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      const nextStatusFilter = e.target.value;
                      setStatusFilter(nextStatusFilter);
                      if (garageId) fetchAppointments(garageId, nextStatusFilter);
                    }}
                    className="vb-input px-3 py-2"
                  >
                    <option value="all">Tous statuts</option>
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                  <input
                    placeholder="Rechercher (automobiliste / description)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="vb-input px-3 py-2"
                  />
                </div>
              </div>

              {/* Calendar View */}
              <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
                <AppointmentCalendar
                  title="Demandes reçues"
                  items={appointments}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  getItemDate={(item) => normalizeAppointmentDate(item)}
                  getItemStatus={(item) => item.status}
                  getItemLabel={(item) =>
                    `${item.appointment_time ? `${item.appointment_time} · ` : ""}${item.description || "Demande"}`
                  }
                />

                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Demandes du jour</h2>
                      <p className="text-sm text-slate-600">Filtrées sur la date sélectionnée.</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                      {filteredAppointments.length}
                    </div>
                  </div>

                  {!garageId && (
                    <p className="text-sm text-slate-600">Chargement de votre garage...</p>
                  )}
                  {loading && (
                    <p className="text-sm text-slate-500">Chargement des demandes...</p>
                  )}
                  {!loading && filteredAppointments.length === 0 && (
                    <p className="text-sm text-slate-500">Aucune demande pour cette date.</p>
                  )}

                  <ul className="mt-4 space-y-3">
                    {filteredAppointments.map((a) => (
                      <li
                        key={a.id}
                        className={`rounded-2xl border p-4 transition ${
                          a.status === "pending"
                            ? "border-amber-200 bg-amber-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-bold text-slate-900">
                              {formatAppointmentDate(a.appointment_date)}
                              {a.appointment_time && ` à ${a.appointment_time}`}
                            </div>
                            <div className="mt-1 text-sm font-medium text-slate-700">
                              {a.automobiliste_name || `Automobiliste #${a.automobiliste_user_id}`}
                            </div>
                            {a.description && (
                              <div className="mt-2 text-sm text-slate-600">{a.description}</div>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${
                              a.status === "confirmed"
                                ? "bg-emerald-50 text-emerald-700"
                                : a.status === "cancelled"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {a.status === "confirmed"
                              ? "✅ Confirmé"
                              : a.status === "cancelled"
                              ? "❌ Annulé"
                              : "⏳ Attente"}
                          </span>
                        </div>

                        {a.status === "pending" && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => handleDecision(a.id, "accept")}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                            >
                              ✅ Valider
                            </button>
                            <button
                              onClick={() => handleDecision(a.id, "reject")}
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

      {/* Notification Modal */}
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



import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import PlatformLayout from "../../components/PlatformLayout";
import TopBar from "../../components/TopBar";
import { listAppointments, createAppointment, updateAppointment, deleteAppointment } from "../../services/appointments";
import { listGarages } from "../../services/garage";
import AppointmentCalendar from "../../components/appointments/AppointmentCalendar";
import AppointmentAgenda from "../../components/appointments/AppointmentAgenda";
import AppointmentTable from "../../components/appointments/AppointmentTable";
import AppointmentNotificationModal from "../../components/appointments/AppointmentNotificationModal";
import { Calendar, Plus } from "lucide-react";

const AutomobilisteAppointments = () => {
  const navigate = useNavigate();
  const [garages, setGarages] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("calendar"); // "calendar", "table"
  const [form, setForm] = useState({
    garageId: "",
    appointmentDate: dayjs().format("YYYY-MM-DD"),
    appointmentTime: "",
    description: ""
  });
  const [message, setMessage] = useState("");
  const [notification, setNotification] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const fetchGarages = async () => {
    try {
      const res = await listGarages({ limit: 100 });
      const items = res.data?.data?.items || res.data?.data || res.data || [];
      setGarages(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      const res = await listAppointments(params);
      const items = res.data?.data?.items || res.data?.data || res.data || [];
      const nextItems = Array.isArray(items) ? items : [];
      setAppointments(nextItems);
      if (!selectedDate && nextItems.length > 0) {
        setSelectedDate(nextItems[0].appointment_date || dayjs().format("YYYY-MM-DD"));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGarages();
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (statusFilter) {
      fetchAppointments();
    }
  }, [statusFilter]);

  // enrich appointments with garage name when garages are available
  useEffect(() => {
    if (!garages || garages.length === 0 || appointments.length === 0) return;
    const byId = garages.reduce((acc, g) => {
      acc[Number(g.id)] = g;
      return acc;
    }, {});

    setAppointments((prev) => prev.map((a) => ({ ...a, garage_name: byId[Number(a.garage_id)] ? (byId[Number(a.garage_id)].name || byId[Number(a.garage_id)].nom) : undefined })));
  }, [garages]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const newAppointment = await createAppointment({
        garageId: Number(form.garageId),
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        description: form.description
      });

      // Show notification
      const selectedGarage = garages.find((g) => Number(g.id) === Number(form.garageId));
      setNotification({
        type: "appointment",
        title: "✓ Rendez-vous réservé",
        body: `Votre demande a été envoyée à ${selectedGarage?.name || "votre garage"}.`
      });
      setSelectedAppointment(newAppointment.data?.appointment || null);

      setMessage("Rendez-vous créé avec succès");
      setTimeout(() => setMessage(""), 3000);

      setSelectedDate(form.appointmentDate);
      setForm({
        garageId: "",
        appointmentDate: form.appointmentDate,
        appointmentTime: "",
        description: ""
      });
      fetchAppointments();
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur lors de la création du RDV");
    }
  };

  const handleSelectDate = (dateKey) => {
    setSelectedDate(dateKey);
    setForm((previous) => ({ ...previous, appointmentDate: dateKey }));
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateAppointment(id, { status });
      const apt = appointments.find((a) => a.id === id);
      
      const statusLabel = status === "confirmed" ? "confirmé" : "annulé";
      setNotification({
        type: "appointment",
        title: status === "confirmed" ? "✓ Rendez-vous confirmé" : "✕ Rendez-vous annulé",
        body: `Votre rendez-vous a été ${statusLabel}.`
      });
      setSelectedAppointment(apt);

      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce rendez-vous ?")) return;
    try {
      await deleteAppointment(id);
      fetchAppointments();
      setMessage("Rendez-vous supprimé");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de la suppression");
    }
  };

  const filteredAppointments = useMemo(() => {
    let items = appointments;
    if (selectedDate) items = items.filter((item) => item.appointment_date === selectedDate);
    if (searchQuery && searchQuery.trim()) {
      const q = String(searchQuery).toLowerCase();
      items = items.filter((it) => {
        return (String(it.garage_name || it.garage_id || "").toLowerCase().includes(q) || String(it.description || "").toLowerCase().includes(q));
      });
    }
    return items;
  }, [appointments, selectedDate, searchQuery]);

  const selectedDayLabel = selectedDate
    ? dayjs(selectedDate).format("dddd D MMMM YYYY")
    : "Sélectionnez un jour dans le calendrier";

  return (
    <PlatformLayout>
      <TopBar onLogout={() => navigate("/login", { replace: true })} />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4">
          {/* Header */}
          <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">Automobiliste</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Mes rendez-vous</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Réservez, consultez et gérez vos rendez-vous avec les garages partenaires.
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
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition border-b-2 ${
                activeTab === "calendar"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="h-5 w-5" />
              Vue Calendrier
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition border-b-2 ${
                activeTab === "table"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Plus className="h-5 w-5" />
              Tous les RDV
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "calendar" ? (
            <>
              {/* Filters */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                    }}
                    className="vb-input px-3 py-2"
                  >
                    <option value="all">Tous statuts</option>
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                  <input
                    placeholder="Rechercher (garage / description)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="vb-input px-3 py-2"
                  />
                </div>
                <div className="text-sm text-slate-500">
                  Mois: {selectedDate ? new Date(selectedDate).toLocaleString("fr-FR", { month: "long", year: "numeric" }) : ""}
                </div>
              </div>

              {/* Calendar View */}
              <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
                <AppointmentCalendar
                  title="Vos rendez-vous"
                  items={appointments}
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                  getItemDate={(item) => item.appointment_date}
                  getItemStatus={(item) => item.status}
                  getItemLabel={(item) =>
                    `${item.appointment_time ? `${item.appointment_time} · ` : ""}${
                      item.description || "Rendez-vous"
                    }`
                  }
                />

                <div className="space-y-6">
                  {/* Booking Form */}
                  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                    <h2 className="text-xl font-black text-slate-900">Réserver un rendez-vous</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      La date du calendrier est reprise automatiquement dans le formulaire.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Garage *</label>
                        <select
                          name="garageId"
                          value={form.garageId}
                          onChange={handleChange}
                          required
                          className="vb-input w-full px-3 py-3"
                        >
                          <option value="">Sélectionnez un garage</option>
                          {garages.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name || g.nom || `Garage ${g.id}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Date *</label>
                          <input
                            name="appointmentDate"
                            value={form.appointmentDate}
                            onChange={handleChange}
                            type="date"
                            required
                            className="vb-input w-full px-3 py-3"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">Heure</label>
                          <input
                            name="appointmentTime"
                            value={form.appointmentTime}
                            onChange={handleChange}
                            type="time"
                            className="vb-input w-full px-3 py-3"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">Description</label>
                        <textarea
                          name="description"
                          value={form.description}
                          onChange={handleChange}
                          rows={3}
                          placeholder="Ex: Révision, réparation moteur, etc."
                          className="vb-input w-full px-3 py-3"
                        />
                      </div>

                      {message && (
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                          {message}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="vb-btn-primary w-full px-4 py-3 font-semibold flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Réserver sur cette date
                      </button>
                    </form>
                  </div>

                  {/* Agenda */}
                  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                    <AppointmentAgenda
                      date={selectedDate}
                      items={filteredAppointments}
                      onConfirm={async (id) => {
                        await handleUpdateStatus(id, "confirmed");
                      }}
                      onCancel={async (id) => {
                        await handleUpdateStatus(id, "cancelled");
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Table View
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <h2 className="mb-4 text-xl font-black text-slate-900">Tous vos rendez-vous</h2>
              <AppointmentTable
                items={appointments}
                isLoading={loading}
                onDelete={handleDelete}
                onUpdate={handleUpdateStatus}
              />
            </div>
          )}
        </div>
      </div>

      {/* Notification Modal */}
      <AppointmentNotificationModal
        isOpen={!!notification}
        onClose={() => setNotification(null)}
        notification={notification}
        appointment={selectedAppointment}
      />
    </PlatformLayout>
  );
};

export default AutomobilisteAppointments;

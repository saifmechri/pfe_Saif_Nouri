import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import PlatformLayout from "../../components/PlatformLayout";
import TopBar from "../../components/TopBar";
import { listAppointments, updateAppointment, deleteAppointment, createAppointment } from "../../services/appointments";
import { listGarages, getServicesByGarage } from "../../services/garage";
import { getVehicules } from "../../services/vehicule";
import AppointmentTable from "../../components/appointments/AppointmentTable";
import AppointmentNotificationModal from "../../components/appointments/AppointmentNotificationModal";
import { ArrowLeft, Plus, AlertCircle, CheckCircle } from "lucide-react";
import { getMinAppointmentDate, isDateValid, isTimeValid, WORKING_HOURS } from "../../utils/appointmentConstants";

const AutomobilisteAppointments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [garages, setGarages] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedServiceChoice, setSelectedServiceChoice] = useState("");
  const [form, setForm] = useState({
    garageId: "",
    vehicleId: "",
    appointmentDate: dayjs().format("YYYY-MM-DD"),
    appointmentTime: "",
    description: "",
    remark: ""
  });

  const fetchGarages = async () => {
    try {
      const res = await listGarages({ limit: 100 });
      const items = res.data?.data?.items || res.data?.data || res.data || [];
      setGarages(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVehicules = async () => {
    try {
      const res = await getVehicules();
      const list = res.data?.vehicules || res.data || [];
      setVehicules(Array.isArray(list) ? list : []);
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
      setAppointments(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicules();
    fetchGarages();
    fetchAppointments();
  }, []);

  useEffect(() => {
    if (statusFilter) {
      fetchAppointments();
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!form.garageId) {
      setAvailableServices([]);
      setSelectedServiceChoice("");
      return;
    }

    (async () => {
      try {
        const res = await getServicesByGarage(form.garageId);
        const items = res.data?.data?.items || res.data?.data || res.data || [];
        setAvailableServices(Array.isArray(items) ? items : []);
        setSelectedServiceChoice("");
      } catch (err) {
        console.error(err);
        setAvailableServices([]);
        setSelectedServiceChoice("");
      }
    })();
  }, [form.garageId]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const garageId = params.get("garageId");
      if (garageId) {
        setForm((current) => ({ ...current, garageId: String(garageId) }));
      }
    } catch (err) {
      // ignore
    }
  }, [location.search]);

  useEffect(() => {
    if (!garages || garages.length === 0 || appointments.length === 0) return;
    const byId = garages.reduce((acc, g) => {
      acc[Number(g.id)] = g;
      return acc;
    }, {});

    setAppointments((prev) =>
      prev.map((a) => ({
        ...a,
        garage_name: byId[Number(a.garage_id)] ? byId[Number(a.garage_id)].name || byId[Number(a.garage_id)].nom : undefined
      }))
    );
  }, [garages]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateAppointment(id, { status });
      const apt = appointments.find((a) => a.id === id);

      const statusLabel = status === "confirmed" ? "confirmé" : "annulé";
      setNotification({
        type: "appointment",
        title: status === "confirmed" ? "✅ Rendez-vous confirmé" : "❌ Rendez-vous annulé",
        body: `Votre rendez-vous a été ${statusLabel}.`
      });
      setSelectedAppointment(apt);

      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) return;
    try {
      await deleteAppointment(id);
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const getServiceLabel = (service) => service?.name || service?.title || service?.label || String(service);

  const addSelectedService = () => {
    if (!selectedServiceChoice) return;

    setSelectedServices((current) => (current.includes(selectedServiceChoice) ? current : [...current, selectedServiceChoice]));
    setSelectedServiceChoice("");
  };

  const removeSelectedService = (serviceLabel) => {
    setSelectedServices((current) => current.filter((value) => value !== serviceLabel));
  };

  const toggleService = (service) => {
    const serviceLabel = getServiceLabel(service);
    setSelectedServices((current) => {
      return current.includes(serviceLabel)
        ? current.filter((value) => value !== serviceLabel)
        : [...current, serviceLabel];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    try {
      // Validate required fields
      if (!form.garageId) {
        throw new Error("Veuillez sélectionner un garage");
      }
      if (!form.appointmentDate) {
        throw new Error("Veuillez sélectionner une date");
      }
      if (!form.description?.trim()) {
        throw new Error("Veuillez entrer une description du service");
      }

      // Validate date
      if (!isDateValid(form.appointmentDate)) {
        throw new Error("Veuillez sélectionner une date valide (au moins 2 heures à l'avance)");
      }

      // Validate time if provided
      if (form.appointmentTime && !isTimeValid(form.appointmentTime)) {
        throw new Error(`L'heure doit être entre ${WORKING_HOURS.START} et ${WORKING_HOURS.END}`);
      }

      const notesPayload = {
        vehicleId: form.vehicleId || null,
        services: selectedServices,
        remark: form.remark || ""
      };

      await createAppointment({
        garageId: Number(form.garageId),
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        description: form.description,
        notes: JSON.stringify(notesPayload)
      });

      const selectedGarage = garages.find((garage) => Number(garage.id) === Number(form.garageId));
      setNotification({
        type: "appointment",
        title: "✅ Rendez-vous réservé",
        body: `Votre demande a été envoyée à ${selectedGarage?.name || selectedGarage?.nom || "votre garage"}.`
      });

      setMessageType("success");
      setMessage("✅ Rendez-vous créé avec succès! Le garage répondra dans les 24 heures.");
      setForm({
        garageId: "",
        vehicleId: "",
        appointmentDate: dayjs().format("YYYY-MM-DD"),
        appointmentTime: "",
        description: "",
        remark: ""
      });
      setSelectedServices([]);
      setSelectedServiceChoice("");
      fetchAppointments();
    } catch (err) {
      setMessageType("error");
      setMessage(
        err.response?.data?.data?.errors 
          ? Object.values(err.response.data.data.errors).join(" • ")
          : err.response?.data?.message 
          ? err.response.data.message
          : err.message 
          ? err.message
          : "Erreur lors de la création du rendez-vous"
      );
    }
  };

  const filteredAppointments = useMemo(() => {
    let items = appointments;
    if (searchQuery && searchQuery.trim()) {
      const q = String(searchQuery).toLowerCase();
      items = items.filter((it) => {
        return (
          String(it.garage_name || it.garage_id || "").toLowerCase().includes(q) ||
          String(it.description || "").toLowerCase().includes(q)
        );
      });
    }
    return items;
  }, [appointments, searchQuery]);

  return (
    <PlatformLayout>
      <TopBar onLogout={() => navigate("/login", { replace: true })} />
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] py-8">
        <div className="mx-auto max-w-7xl space-y-6 px-4">
          <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-blue-600 transition hover:text-blue-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">Automobiliste</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Mes rendez-vous</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Consultez et gérez vos rendez-vous avec les garages partenaires.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">Réservation</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Prendre un rendez-vous</h2>
                <p className="mt-2 text-sm text-slate-600">Choisissez un garage, un véhicule et les services souhaités.</p>
              </div>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Automobiliste</div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Garage *</label>
                <select
                  name="garageId"
                  value={form.garageId}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">Sélectionnez un garage</option>
                  {garages.map((garage) => (
                    <option key={garage.id} value={garage.id}>
                      {garage.name || garage.nom || `Garage ${garage.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Votre véhicule</label>
                <select
                  name="vehicleId"
                  value={form.vehicleId}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">Sélectionnez un véhicule</option>
                  {vehicules.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.modele_voiture || vehicle.modele || `Véhicule ${vehicle.id}`}{" "}
                      {vehicle.matricule_voiture ? `· ${vehicle.matricule_voiture}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Date *</label>
                <input
                  name="appointmentDate"
                  value={form.appointmentDate}
                  onChange={handleFormChange}
                  type="date"
                  min={getMinAppointmentDate()}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
                <p className="mt-1 text-xs text-slate-500">Minimum 2 heures à l'avance</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Heure (optionnel)</label>
                <input
                  name="appointmentTime"
                  value={form.appointmentTime}
                  onChange={handleFormChange}
                  type="time"
                  min={WORKING_HOURS.START}
                  max={WORKING_HOURS.END}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
                <p className="mt-1 text-xs text-slate-500">Entre {WORKING_HOURS.START} et {WORKING_HOURS.END}</p>
              </div>

              <div className="lg:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">Services (optionnel)</label>
                {availableServices.length > 0 ? (
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <select
                        value={selectedServiceChoice}
                        onChange={(event) => setSelectedServiceChoice(event.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                      >
                        <option value="">Choisissez un service</option>
                        {availableServices.map((service) => {
                          const serviceLabel = getServiceLabel(service);
                          return (
                            <option key={service.id || serviceLabel} value={serviceLabel}>
                              {serviceLabel}
                            </option>
                          );
                        })}
                      </select>

                      <button
                        type="button"
                        onClick={addSelectedService}
                        disabled={!selectedServiceChoice}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Ajouter
                      </button>
                    </div>

                    {selectedServices.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedServices.map((serviceLabel) => (
                          <button
                            key={serviceLabel}
                            type="button"
                            onClick={() => removeSelectedService(serviceLabel)}
                            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                            title="Cliquer pour retirer"
                          >
                            {serviceLabel} ×
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-slate-500">
                      Les services sélectionnés seront enregistrés dans le rendez-vous. Cliquez sur un service pour le retirer.
                    </p>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                    Sélectionnez un garage pour charger ses services.
                  </p>
                )}
              </div>

              <div className="lg:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  required
                  rows={3}
                  placeholder="Ex: Révision, réparation moteur, etc."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">Remarques (optionnel)</label>
                <input
                  name="remark"
                  value={form.remark}
                  onChange={handleFormChange}
                  placeholder="Précisez des détails pour le garage"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {message && (
                <div className={`lg:col-span-2 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
                  messageType === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : messageType === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-slate-200 bg-slate-50 text-slate-700"
                }`}>
                  {messageType === "success" && <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
                  {messageType === "error" && <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
                  <p>{message}</p>
                </div>
              )}

              <div className="lg:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 font-semibold text-white shadow transition hover:from-amber-600 hover:to-orange-600"
                >
                  <Plus className="h-4 w-4" />
                  Réserver
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="text-sm font-semibold text-slate-600">
              {appointments.length} rendez-vous
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <AppointmentTable
              items={filteredAppointments}
              isLoading={loading}
              onDelete={handleDelete}
              onUpdate={handleUpdateStatus}
            />
          </div>
        </div>
      </div>

      <AppointmentNotificationModal
        isOpen={!!notification}
        onClose={() => setNotification(null)}
        notification={notification}
        appointment={selectedAppointment}
        userRole="automobiliste"
      />
    </PlatformLayout>
  );
};

export default AutomobilisteAppointments;



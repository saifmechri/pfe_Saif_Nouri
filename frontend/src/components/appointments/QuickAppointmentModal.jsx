import { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { X, Plus, Loader, CheckCircle, AlertCircle } from "lucide-react";
import { createAppointment } from "../../services/appointments";
import { getServicesByGarage } from "../../services/garage";
import { getMinAppointmentDate, isDateValid, isTimeValid, WORKING_HOURS } from "../../utils/appointmentConstants";

dayjs.locale("fr");

const QuickAppointmentModal = ({ isOpen, onClose, garage, vehicules = [], onAppointmentCreated = null }) => {
  const [form, setForm] = useState({
    vehicleId: "",
    appointmentDate: dayjs().format("YYYY-MM-DD"),
    appointmentTime: "",
    description: "",
    remark: ""
  });
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success", "error", or ""
  const minDate = getMinAppointmentDate();

  const getServiceLabel = (service) => service?.name || service?.title || service?.label || String(service);

  useEffect(() => {
    if (isOpen && garage) {
      // Reset form when opening for new garage
      setForm({
        vehicleId: "",
        appointmentDate: dayjs().format("YYYY-MM-DD"),
        appointmentTime: "",
        description: "",
        remark: ""
      });
      setSelectedServices([]);
      setMessage("");
      
      // Fetch services for garage
      (async () => {
        try {
          const res = await getServicesByGarage(garage.id);
          const items = res.data?.data?.items || res.data?.data || res.data || [];
          setAvailableServices(Array.isArray(items) ? items : []);
        } catch (err) {
          console.error("Error fetching services:", err);
          setAvailableServices([]);
        }
      })();
    }
  }, [isOpen, garage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setMessage("");
  };

  const toggleService = (service) => {
    const serviceLabel = getServiceLabel(service);
    setSelectedServices((prev) => {
      if (prev.includes(serviceLabel)) return prev.filter((s) => s !== serviceLabel);
      return [...prev, serviceLabel];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    setMessageType("");

    try {
      // Validate required fields
      if (!form.description?.trim()) {
        throw new Error("Veuillez entrer une description du service");
      }

      // Validate date
      if (!isDateValid(form.appointmentDate)) {
        throw new Error("Veuillez sélectionner une date valide");
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
        garageId: Number(garage.id),
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        description: form.description,
        notes: JSON.stringify(notesPayload)
      });

      setMessageType("success");
      setMessage("âœ“ Rendez-vous réservé avec succès! Le garage rÃ©pondra dans les 24 heures.");
      
      // Reset form and close after delay
      setTimeout(() => {
        setForm({
          vehicleId: "",
          appointmentDate: dayjs().format("YYYY-MM-DD"),
          appointmentTime: "",
          description: "",
          remark: ""
        });
        setSelectedServices([]);
        if (onAppointmentCreated) onAppointmentCreated();
        onClose();
      }, 2500);
    } catch (err) {
      setMessageType("error");
      setMessage(err.response?.data?.data?.errors 
        ? Object.values(err.response.data.data.errors).join(" â€¢ ")
        : err.response?.data?.message 
        ? err.response.data.message
        : err.message 
        ? err.message
        : "Erreur lors de la création du rendez-vous"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !garage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.15)] md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-600">Réservation rapide</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Prendre rendez-vous Â· {garage.name}</h2>
            <p className="mt-1 text-sm text-slate-600">ComplÃ©tez le formulaire pour demander un rendez-vous</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Vehicle Selection */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Votre véhicule</label>
            <select
              name="vehicleId"
              value={form.vehicleId}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            >
              <option value="">SÃ©lectionnez un véhicule (optionnel)</option>
              {vehicules.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.modele_voiture || v.modele || `Véhicule ${v.id}`} {v.matricule_voiture ? `Â· ${v.matricule_voiture}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Services */}
          {availableServices && availableServices.length > 0 && (
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-700">Services disponibles</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {availableServices.slice(0, 9).map((s) => (
                  <button
                    key={s.id || s.name}
                    type="button"
                    onClick={() => toggleService(s)}
                    className={`rounded-lg border p-3 text-center text-xs font-medium transition ${
                      selectedServices.includes(getServiceLabel(s))
                        ? "border-amber-400 bg-amber-50 text-amber-700 ring-2 ring-amber-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-base">âš™ï¸</span>
                      <span className="line-clamp-1 text-xs">{s.name || s.title || s}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Date *</label>
              <input
                name="appointmentDate"
                value={form.appointmentDate}
                onChange={handleChange}
                type="date"
                min={minDate}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
              <p className="mt-1 text-xs text-slate-500">Minimum 2 heures Ã  l'avance</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Heure (optionnel)</label>
              <input
                name="appointmentTime"
                value={form.appointmentTime}
                onChange={handleChange}
                type="time"
                min={WORKING_HOURS.START}
                max={WORKING_HOURS.END}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
              <p className="mt-1 text-xs text-slate-500">Entre {WORKING_HOURS.START} et {WORKING_HOURS.END}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Description du service *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={3}
              maxLength={500}
              placeholder="DÃ©crivez le problÃ¨me ou le service souhaitÃ©..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 resize-none"
            />
            <p className="mt-1 text-xs text-slate-500">{form.description.length}/500 caractÃ¨res</p>
          </div>

          {/* Remark */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Remarques (optionnel)</label>
            <input
              name="remark"
              value={form.remark}
              onChange={handleChange}
              type="text"
              maxLength={250}
              placeholder="PrÃ©cisez des détails supplÃ©mentaires..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition hover:border-slate-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
            />
          </div>

          {/* Message */}
          {message && (
            <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
              messageType === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {messageType === "success" ? (
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              )}
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 font-semibold text-white shadow transition hover:from-amber-600 hover:to-orange-600 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Réservation...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Réserver maintenant
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAppointmentModal;



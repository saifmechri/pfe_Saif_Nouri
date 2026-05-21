import { useState, useEffect } from "react";
import {
  getVehicules,
  createVehicule,
  updateVehicule,
  deleteVehicule,
  getInterventionsByVehicle,
  createIntervention,
} from "../../services/vehicule";
import interventionsApi from "../../services/interventions";
import { useNavigate, useLocation } from "react-router-dom";
import PlatformLayout from "../../components/PlatformLayout";
import { listAppointments, deleteAppointment } from "../../services/appointments";
import { Calendar, Clock, MapPin, Trash2, Plus, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import { formatAppointmentDate, parseAppointmentNotes } from "../../utils/appointmentConstants";
dayjs.locale("fr");

const AutomobilisteDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("vehicules");

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    const allowedTabs = ["vehicules", "historique", "rendezvous"];
    if (tab && allowedTabs.includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const backendBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "");

  const getVehiclePhotoUrl = (photoVoiture) => {
    if (!photoVoiture) return "";

    if (/^https?:\/\//i.test(photoVoiture)) {
      return photoVoiture;
    }

    return `${backendBaseUrl}${photoVoiture}`;
  };

  // États pour les véhicules
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // États pour l'historique des interventions
  const [historiqueLoading, setHistoriqueLoading] = useState(false);
  const [historiqueError, setHistoriqueError] = useState("");
  const [historiqueLoaded, setHistoriqueLoaded] = useState(false);
  const [historiqueByVehicule, setHistoriqueByVehicule] = useState([]);
  const [interventionDeletingId, setInterventionDeletingId] = useState(null);

  // États pour la création d'intervention
  const [showInterventionForm, setShowInterventionForm] = useState(false);
  const [interventionLoading, setInterventionLoading] = useState(false);
  const [interventionError, setInterventionError] = useState("");
  const [interventionFormData, setInterventionFormData] = useState({
    vehicleId: "",
    date_intervention: "",
    type: "vidange",
    description: "",
    garage_nom: "",
    garage_adresse: "",
    kilometrage: "",
    cout_total: "",
    pieces_libres: "",
  });

  // États pour le formulaire
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState("");
  const [formData, setFormData] = useState({
    modele_voiture: "",
    matricule_voiture: "",
    kilometrage_voiture: "",
    photo_voiture: ""
  });

  // Fetch appointments
  const fetchAppointments = async () => {
    setAppointmentsLoading(true);
    setAppointmentsError("");
    try {
      const res = await listAppointments({ limit: 50 });
      const items = res.data?.data?.items || res.data?.data || res.data || [];
      const nextItems = Array.isArray(items) ? items : [];
      setAppointments(nextItems);
    } catch (err) {
      setAppointmentsError(err.response?.data?.message || "Erreur lors du chargement des rendez-vous");
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) return;
    try {
      await deleteAppointment(id);
      await fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  // Charger les véhicules au montage
  useEffect(() => {
    fetchVehicules();
  }, []);

  useEffect(() => {
    if (activeTab === "rendezvous") {
      fetchAppointments();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "historique" && !historiqueLoaded) {
      fetchHistorique();
    }
  }, [activeTab, historiqueLoaded]);

  const fetchVehicules = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getVehicules();
      setVehicules(res.data.vehicules);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorique = async () => {
    setHistoriqueLoading(true);
    setHistoriqueError("");
    // Clear previous snapshot to avoid duplicates while reloading
    setHistoriqueByVehicule([]);
    setHistoriqueLoaded(false);

    try {
      let vehiculesList = vehicules;

      // On récupère les véhicules si la liste locale est vide.
      if (!vehiculesList || vehiculesList.length === 0) {
        const vehiculesRes = await getVehicules();
        vehiculesList = vehiculesRes.data?.vehicules || [];
        setVehicules(vehiculesList);
      }

      if (vehiculesList.length === 0) {
        setHistoriqueByVehicule([]);
        setHistoriqueLoaded(true);
        return;
      }

      const historiquePromises = vehiculesList.map(async (vehicule) => {
        try {
          const interventions = await getInterventionsByVehicle(vehicule.id);
          return {
            vehicule,
            interventions: Array.isArray(interventions) ? interventions : [],
            error: ""
          };
        } catch (err) {
          return {
            vehicule,
            interventions: [],
            error: err.response?.data?.message || "Erreur lors du chargement des interventions"
          };
        }
      });

      const historique = await Promise.all(historiquePromises);
      setHistoriqueByVehicule(historique);
      setHistoriqueLoaded(true);
    } catch (err) {
      setHistoriqueError(err.response?.data?.message || "Erreur lors du chargement de l'historique");
    } finally {
      setHistoriqueLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setSelectedPhotoFile(null);
    setSelectedPhotoPreview("");
    setFormData({
      modele_voiture: "",
      matricule_voiture: "",
      kilometrage_voiture: "",
      photo_voiture: ""
    });
  };

  const handleAddVehicleClick = () => {
    setError("");
    setEditingId(null);
    setSelectedPhotoFile(null);
    setSelectedPhotoPreview("");
    setFormData({
      modele_voiture: "",
      matricule_voiture: "",
      kilometrage_voiture: "",
      photo_voiture: ""
    });
    setShowForm(true);
  };

  const handleEditClick = (vehicule) => {
    setError("");
    setEditingId(vehicule.id);
    setSelectedPhotoFile(null);
    setSelectedPhotoPreview(vehicule.photo_voiture ? getVehiclePhotoUrl(vehicule.photo_voiture) : "");
    setFormData({
      modele_voiture: vehicule.modele_voiture || "",
      matricule_voiture: vehicule.matricule_voiture || "",
      kilometrage_voiture: vehicule.kilometrage_voiture ?? "",
      photo_voiture: vehicule.photo_voiture || ""
    });
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const multipartData = new FormData();
      multipartData.append("modele_voiture", formData.modele_voiture);
      multipartData.append("matricule_voiture", formData.matricule_voiture);
      multipartData.append("kilometrage_voiture", formData.kilometrage_voiture || "");
      if (selectedPhotoFile) {
        multipartData.append("photo", selectedPhotoFile);
      }

      if (editingId) {
        await updateVehicule(editingId, multipartData);
        setSuccessMessage("Véhicule modifié avec succès");
      } else {
        await createVehicule(multipartData);
        setSuccessMessage("Véhicule ajouté avec succès");
      }
      await fetchVehicules();
      resetForm();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const openInterventionForm = async () => {
    setInterventionError("");

    let vehiculesList = vehicules;
    if (!vehiculesList || vehiculesList.length === 0) {
      try {
        const res = await getVehicules();
        vehiculesList = res.data?.vehicules || [];
        setVehicules(vehiculesList);
      } catch (err) {
        setInterventionError(err.response?.data?.message || "Impossible de charger vos véhicules");
        return;
      }
    }

    if (vehiculesList.length === 0) {
      setInterventionError("Ajoutez d'abord un véhicule avant de créer une intervention.");
      return;
    }

    setInterventionFormData({
      vehicleId: String(vehiculesList[0].id),
      date_intervention: new Date().toISOString().slice(0, 10),
      type: "vidange",
      description: "",
      garage_nom: "",
      garage_adresse: "",
      kilometrage: "",
      cout_total: "",
      pieces_libres: "",
    });

    setShowInterventionForm(true);
  };

  const handleInterventionFieldChange = (e) => {
    const { name, value } = e.target;
    setInterventionFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetInterventionForm = () => {
    setShowInterventionForm(false);
    setInterventionError("");
    setInterventionFormData({
      vehicleId: "",
      date_intervention: "",
      type: "vidange",
      description: "",
      garage_nom: "",
      garage_adresse: "",
      kilometrage: "",
      cout_total: "",
      pieces_libres: "",
    });
  };

  /**
   * INTERVENTION FORM SUBMISSION HANDLER
   * 
   * Processes the new intervention (maintenance record) form and saves to backend.
   * 
   * FORM FIELDS:
   * - date_intervention: Date of maintenance work
   * - type: vidange, revision, reparation, etc.
   * - garage_nom: Garage name
   * - garage_adresse: Garage location
   * - kilometrage: Vehicle mileage when maintenance done
   * - description: Detailed notes about work performed
  * - cout_total: Total cost of the intervention
  * - pieces_libres: Manual free-text parts used
   * PROCESS:
   * 1. Validate all required fields
  * 2. Append pieces_libres to the description when provided
  * 3. Send to backend API
  * 4. Update vehicle intervention history
  * 5. Show success/error message to user
   * 
   * USAGE:
   * User fills form and clicks "Enregistrer".
   * Intervention appears in vehicle history and contributes to maintenance timeline.
   */
  const handleInterventionSubmit = async (e) => {
    e.preventDefault();
    setInterventionLoading(true);
    setInterventionError("");

    try {
      const manualPiecesText = String(interventionFormData.pieces_libres || "").trim();
      const mergedDescription = [
        interventionFormData.description?.trim(),
        manualPiecesText ? `Pièces utilisées: ${manualPiecesText}` : ""
      ].filter(Boolean).join("\n\n");

      const payload = {
        date_intervention: interventionFormData.date_intervention || undefined,
        type: interventionFormData.type,
        description: mergedDescription || undefined,
        garage_nom: interventionFormData.garage_nom || undefined,
        garage_adresse: interventionFormData.garage_adresse || undefined,
        kilometrage: interventionFormData.kilometrage !== "" ? Number(interventionFormData.kilometrage) : undefined,
        cout_total: interventionFormData.cout_total !== "" ? Number(interventionFormData.cout_total) : undefined,
      };

      await createIntervention(Number(interventionFormData.vehicleId), payload);
      setSuccessMessage("Intervention ajoutée avec succès");
      resetInterventionForm();
      setHistoriqueLoaded(false);
      await fetchHistorique();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const validationErrors = err.response?.data?.errors;
      const validationMessage = Array.isArray(validationErrors) && validationErrors.length > 0
        ? validationErrors.map((x) => x.msg).join(" | ")
        : "";
      setInterventionError(apiMessage || validationMessage || "Erreur lors de la création de l'intervention");
    } finally {
      setInterventionLoading(false);
    }
  };

  const handleEditIntervention = (vehicleId, interventionId) => {
    navigate(`/vehicules/${vehicleId}/interventions/${interventionId}?edit=1`);
  };

  const handleDeleteIntervention = async (vehicleId, interventionId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette intervention ?")) return;
    
    setInterventionDeletingId(interventionId);
    try {
      await interventionsApi.deleteIntervention(vehicleId, interventionId);
      window.dispatchEvent(new CustomEvent('maintenance:refresh', { detail: { vehicleId } }));
      setSuccessMessage("Intervention supprimée avec succès");
      setHistoriqueLoaded(false);
      await fetchHistorique();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setInterventionError(err.response?.data?.message || "Erreur lors de la suppression");
    } finally {
      setInterventionDeletingId(null);
    }
  };

  const handleDelete = async (vehiculeId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce véhicule ?")) {
      setError("");
      setLoading(true);
      try {
        await deleteVehicule(vehiculeId);
        setSuccessMessage("Véhicule supprimé avec succès");
        await fetchVehicules();
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors de la suppression");
      } finally {
        setLoading(false);
      }
    }
  };

  const rendezVous = [
    { id: 1, garage: "Garage Auto Plus", date: "2026-03-15", heure: "10:00", service: "Vidange" },
    { id: 2, garage: "Centre Pneus", date: "2026-03-20", heure: "14:30", service: "Changement pneus" },
  ];

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-[#1a2b4b]">Tableau de bord Automobiliste</h1>
              <p className="mt-1 text-sm text-[#617089]">Suivez vos véhicules, rendez-vous et historique d'interventions.</p>
            </div>
          </div>

          {/* Onglets */}
          <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-[#d5deec] pb-2">
            <button
              onClick={() => setActiveTab("vehicules")}
              className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "vehicules" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
            >
              Mes véhicules
            </button>
            <button
              onClick={() => setActiveTab("rendezvous")}
              className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "rendezvous" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
            >
              Rendez-vous
            </button>
            <button
              onClick={() => setActiveTab("historique")}
              className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "historique" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
            >
              Historique
            </button>
            <button
              onClick={() => navigate("/automobiliste/garages")}
              className="rounded-lg px-4 py-2 font-semibold text-gray-600 hover:bg-white"
            >
              Garages
            </button>
            {/* Bouton Recommandations dynamiques supprimé */}
          </div>

        {/* Contenu des onglets */}
        <div className="vb-card p-6">
          {activeTab === "vehicules" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Mes véhicules</h2>
                <button 
                  type="button"
                  onClick={handleAddVehicleClick}
                  disabled={loading}
                  className="vb-btn-primary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  + Ajouter un véhicule
                </button>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {successMessage}
                </div>
              )}
              {showForm && (
                <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingId ? "Modifier le véhicule" : "Ajouter un nouveau véhicule"}
                  </h3>
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="modele_voiture"
                      placeholder="Modele de voiture *"
                      value={formData.modele_voiture}
                      onChange={handleInputChange}
                      required
                      className="vb-input px-3 py-2"
                    />
                    <input
                      type="text"
                      name="matricule_voiture"
                      placeholder="Matricule de voiture *"
                      value={formData.matricule_voiture}
                      onChange={handleInputChange}
                      required
                      className="vb-input px-3 py-2"
                    />
                    <input
                      type="number"
                      name="kilometrage_voiture"
                      placeholder="Kilometrage de voiture"
                      value={formData.kilometrage_voiture}
                      onChange={handleInputChange}
                      min="0"
                      className="vb-input px-3 py-2"
                    />
                    <input
                      type="file"
                      name="photo"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoChange}
                      aria-label="Ajouter photo voiture"
                      className="vb-input px-3 py-2 md:col-span-2"
                    />
                    {selectedPhotoPreview && (
                      <div className="md:col-span-2">
                        <img
                          src={selectedPhotoPreview}
                          alt="Apercu"
                          className="w-full h-40 object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex gap-2 md:col-span-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? "Chargement..." : (editingId ? "Modifier" : "Ajouter")}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={loading}
                        className="vb-btn-outline flex-1 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {loading && vehicules.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Chargement des véhicules...</p>
              ) : vehicules.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun véhicule enregistré. Cliquez sur "Ajouter un véhicule" pour commencer.</p>
              ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {vehicules.map((v) => (
                  <div key={v.id} className="vb-card p-4 transition hover:shadow-md">
                    {v.photo_voiture && (
                      <img 
                        src={getVehiclePhotoUrl(v.photo_voiture)}
                        alt={v.modele_voiture}
                        className="w-full h-40 object-cover rounded mb-3"
                      />
                    )}
                    <h3 className="font-bold text-lg">{v.modele_voiture}</h3>
                    <p className="text-gray-600">Matricule : {v.matricule_voiture}</p>
                    {v.kilometrage_voiture !== null && <p className="text-gray-600">Kilometrage : {v.kilometrage_voiture} km</p>}
                    <div className="mt-3 flex space-x-2">
                      <button 
                        onClick={() => navigate(`/vehicules/${v.id}/alerts`)}
                        className="flex-1 px-2 py-1 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 rounded disabled:text-gray-400"
                      >
                        Alertes
                      </button>
                      <button 
                        onClick={() => handleEditClick(v)}
                        disabled={loading}
                        className="flex-1 text-blue-600 hover:underline disabled:text-gray-400"
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => handleDelete(v.id)}
                        disabled={loading}
                        className="flex-1 text-red-600 hover:underline disabled:text-gray-400"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {activeTab === "rendezvous" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Mes rendez-vous</h2>
                  <p className="mt-1 text-sm text-slate-600">Consultez et gérez vos rendez-vous avec les garages.</p>
                </div>
                <button
                  onClick={() => navigate("/automobiliste/appointments")}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                  Réserver
                </button>
              </div>

              {appointmentsError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {appointmentsError}
                </div>
              )}

              {appointmentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-slate-600">Chargement des rendez-vous...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-600">Aucun rendez-vous.</p>
                  <button
                    onClick={() => navigate("/automobiliste/appointments")}
                    className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Réserver votre premier rendez-vous
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className={`rounded-2xl border p-4 transition ${
                        apt.status === "confirmed"
                          ? "border-emerald-200 bg-emerald-50"
                          : apt.status === "cancelled"
                          ? "border-rose-200 bg-rose-50"
                          : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-slate-600" />
                            <span className="font-bold text-slate-900">
                              {formatAppointmentDate(apt.appointment_date)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                            <Clock className="h-4 w-4" />
                            {apt.appointment_time ? apt.appointment_time : "À définir"}
                          </div>
                          {apt.description && (
                            <p className="mt-3 text-sm text-slate-700">
                              <strong>Service:</strong> {apt.description}
                            </p>
                          )}
                          {parseAppointmentNotes(apt.notes).services.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {parseAppointmentNotes(apt.notes).services.map((service) => (
                                <span key={service} className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                                  {service}
                                </span>
                              ))}
                            </div>
                          )}
                          {apt.notes && (
                            <p className="mt-2 text-xs text-slate-600">
                              <strong>Notes:</strong> {apt.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${
                              apt.status === "confirmed"
                                ? "bg-emerald-100 text-emerald-700"
                                : apt.status === "cancelled"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {apt.status === "confirmed"
                              ? "✅ Confirmé"
                              : apt.status === "cancelled"
                              ? "❌ Annulé"
                              : "⏳ En attente"}
                          </span>
                          {apt.status === "pending" && (
                            <button
                              onClick={() => handleDeleteAppointment(apt.id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "historique" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Historique des interventions</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={openInterventionForm}
                    disabled={interventionLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    + Nouvelle intervention
                  </button>
                  <button
                    type="button"
                    onClick={fetchHistorique}
                    disabled={historiqueLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {historiqueLoading ? "Actualisation..." : "Actualiser"}
                  </button>
                </div>
              </div>

              {showInterventionForm && (
                <div className="mb-6 border border-green-200 bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Créer une intervention</h3>
                  <form onSubmit={handleInterventionSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      name="vehicleId"
                      value={interventionFormData.vehicleId}
                      onChange={handleInterventionFieldChange}
                      className="px-3 py-2 border border-gray-300 rounded"
                      required
                    >
                      <option value="">Sélectionner un véhicule</option>
                      {vehicules.map((v) => (
                        <option key={v.id} value={v.id}>{v.modele_voiture} - {v.matricule_voiture}</option>
                      ))}
                    </select>

                    <input
                      type="date"
                      name="date_intervention"
                      value={interventionFormData.date_intervention}
                      onChange={handleInterventionFieldChange}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />

                    <select
                      name="type"
                      value={interventionFormData.type}
                      onChange={handleInterventionFieldChange}
                      className="px-3 py-2 border border-gray-300 rounded"
                      required
                    >
                      <option value="vidange">Vidange</option>
                      <option value="révision">Révision</option>
                      <option value="réparation">Réparation</option>
                      <option value="autre">Autre</option>
                    </select>

                    <input
                      type="number"
                      min="0"
                      name="kilometrage"
                      placeholder="Kilométrage"
                      value={interventionFormData.kilometrage}
                      onChange={handleInterventionFieldChange}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="cout_total"
                      placeholder="Coût total"
                      value={interventionFormData.cout_total}
                      onChange={handleInterventionFieldChange}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />

                    <input
                      type="text"
                      name="garage_nom"
                      placeholder="Nom du garage"
                      value={interventionFormData.garage_nom}
                      onChange={handleInterventionFieldChange}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />

                    <input
                      type="text"
                      name="garage_adresse"
                      placeholder="Adresse du garage"
                      value={interventionFormData.garage_adresse}
                      onChange={handleInterventionFieldChange}
                      className="px-3 py-2 border border-gray-300 rounded"
                    />

                    <textarea
                      name="description"
                      placeholder="Description"
                      value={interventionFormData.description}
                      onChange={handleInterventionFieldChange}
                      className="md:col-span-2 px-3 py-2 border border-gray-300 rounded"
                      rows="3"
                    />

                    <div className="md:col-span-2 border border-gray-200 rounded p-3 bg-white">
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium text-gray-700">Pièces utilisées</span>
                        <textarea
                          name="pieces_libres"
                          value={interventionFormData.pieces_libres}
                          onChange={handleInterventionFieldChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                          rows="3"
                          placeholder="Écrire manuellement, ex: Filtre à huile x1, Huile moteur 5W30 x4L"
                        />
                      </label>
                    </div>

                    <div className="md:col-span-2 flex gap-2">
                      <button
                        type="submit"
                        disabled={interventionLoading}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {interventionLoading ? "Enregistrement..." : "Enregistrer"}
                      </button>
                      <button
                        type="button"
                        onClick={resetInterventionForm}
                        disabled={interventionLoading}
                        className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {interventionError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {interventionError}
                </div>
              )}

              {historiqueError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {historiqueError}
                </div>
              )}

              {historiqueLoading ? (
                <p className="text-gray-500">Chargement de l'historique...</p>
              ) : historiqueByVehicule.length === 0 ? (
                <p className="text-gray-500">Aucun véhicule trouvé. Ajoutez un véhicule pour voir son historique.</p>
              ) : (
                <div className="space-y-6">
                  {historiqueByVehicule.map(({ vehicule, interventions, error: vehicleError }) => (
                    <div key={vehicule.id} className="border rounded-lg p-4">
                      <div className="mb-3">
                        <h3 className="font-bold text-lg">{vehicule.modele_voiture}</h3>
                        <p className="text-gray-600">Matricule : {vehicule.matricule_voiture}</p>
                      </div>

                      {vehicleError ? (
                        <p className="text-red-600">{vehicleError}</p>
                      ) : interventions.length === 0 ? (
                        <p className="text-gray-500">Aucune intervention enregistrée pour ce véhicule.</p>
                      ) : (
                        <div className="space-y-3">
                          {interventions.map((intervention) => (
                            <div key={intervention.id} className="bg-gray-50 border rounded-md p-3">
                              <div className="mb-2 flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditIntervention(vehicule.id, intervention.id)}
                                  className="rounded border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                >
                                  Modifier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteIntervention(vehicule.id, intervention.id)}
                                  disabled={interventionDeletingId === intervention.id}
                                  className="rounded border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {interventionDeletingId === intervention.id ? "Suppression..." : "Supprimer"}
                                </button>
                              </div>

                              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                <p><span className="font-semibold">Date :</span> {intervention.date_intervention || "-"}</p>
                                <p><span className="font-semibold">Type :</span> {intervention.type || "-"}</p>
                                <p><span className="font-semibold">Kilométrage :</span> {intervention.kilometrage ?? "-"}</p>
                                <p><span className="font-semibold">Coût total :</span> {Number(intervention.cout_total) > 0 ? `${intervention.cout_total} TND` : "—"}</p>
                              </div>

                              {(intervention.garage_nom || intervention.garage_adresse) && (
                                <p className="mt-2 text-sm text-gray-700">
                                  <span className="font-semibold">Garage :</span> {intervention.garage_nom || "-"}
                                  {intervention.garage_adresse ? `, ${intervention.garage_adresse}` : ""}
                                </p>
                              )}

                              {intervention.description && (
                                <p className="mt-2 text-sm text-gray-700">
                                  <span className="font-semibold">Description :</span> {intervention.description}
                                </p>
                              )}

                              <div className="mt-2 text-sm">
                                <p className="font-semibold mb-1">Pièces utilisées :</p>
                                {Array.isArray(intervention.pieces) && intervention.pieces.length > 0 ? (
                                  <ul className="list-disc list-inside text-gray-700">
                                    {intervention.pieces.map((piece) => (
                                      <li key={piece.id}>
                                        {piece.nom} (x{piece.InterventionPiece?.quantite || 1}) - {piece.InterventionPiece?.prix_unitaire_applique || piece.prix_unitaire || 0} TND
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-500">Aucune pièce enregistrée.</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </PlatformLayout>
  );
};

export default AutomobilisteDashboard;


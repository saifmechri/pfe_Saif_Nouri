import { useState, useEffect } from "react";
import {
  getVehicules,
  createVehicule,
  updateVehicule,
  deleteVehicule,
  getInterventionsByVehicle,
  createIntervention,
  getPieces
} from "../../services/vehicule";
import { useNavigate } from "react-router-dom";
import PlatformLayout from "../../components/PlatformLayout";

const AutomobilisteDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("vehicules");

  const backendBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/, "");

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

  // États pour la création d'intervention
  const [showInterventionForm, setShowInterventionForm] = useState(false);
  const [interventionLoading, setInterventionLoading] = useState(false);
  const [interventionError, setInterventionError] = useState("");
  const [pieces, setPieces] = useState([]);
  const [piecesLoading, setPiecesLoading] = useState(false);
  const [interventionFormData, setInterventionFormData] = useState({
    vehicleId: "",
    date_intervention: "",
    type: "vidange",
    description: "",
    garage_nom: "",
    garage_adresse: "",
    kilometrage: "",
    pieces: []
  });

  // États pour le formulaire
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState("");
  const [formData, setFormData] = useState({
    modele_voiture: "",
    matricule_voiture: "",
    kilometrage_voiture: "",
    photo_voiture: ""
  });

  // Charger les véhicules au montage
  useEffect(() => {
    fetchVehicules();
  }, []);

  useEffect(() => {
    if (activeTab === "historique" && !historiqueLoaded) {
      fetchHistorique();
    }
  }, [activeTab, historiqueLoaded]);

  useEffect(() => {
    if (activeTab === "historique" && showInterventionForm && pieces.length === 0 && !piecesLoading) {
      fetchPieces();
    }
  }, [activeTab, showInterventionForm, pieces.length, piecesLoading]);

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
          const res = await getInterventionsByVehicle(vehicule.id);
          return {
            vehicule,
            interventions: Array.isArray(res.data) ? res.data : [],
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

  const fetchPieces = async () => {
    setPiecesLoading(true);
    try {
      const res = await getPieces();
      setPieces(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setInterventionError(err.response?.data?.message || "Erreur lors du chargement des pièces");
    } finally {
      setPiecesLoading(false);
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
      pieces: []
    });

    if (pieces.length === 0) {
      fetchPieces();
    }

    setShowInterventionForm(true);
  };

  const handleInterventionFieldChange = (e) => {
    const { name, value } = e.target;
    setInterventionFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addPieceLine = () => {
    setInterventionFormData((prev) => ({
      ...prev,
      pieces: [...prev.pieces, { pieceId: "", quantite: 1, prix_unitaire: "" }]
    }));
  };

  const removePieceLine = (index) => {
    setInterventionFormData((prev) => ({
      ...prev,
      pieces: prev.pieces.filter((_, i) => i !== index)
    }));
  };

  const handlePieceFieldChange = (index, field, value) => {
    setInterventionFormData((prev) => ({
      ...prev,
      pieces: prev.pieces.map((piece, i) => (i === index ? { ...piece, [field]: value } : piece))
    }));
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
      pieces: []
    });
  };

  const handleInterventionSubmit = async (e) => {
    e.preventDefault();
    setInterventionLoading(true);
    setInterventionError("");

    try {
      const cleanedPieces = interventionFormData.pieces
        .filter((p) => p.pieceId)
        .map((p) => ({
          pieceId: Number(p.pieceId),
          quantite: p.quantite ? Number(p.quantite) : 1,
          ...(p.prix_unitaire !== "" ? { prix_unitaire: Number(p.prix_unitaire) } : {})
        }));

      const payload = {
        date_intervention: interventionFormData.date_intervention || undefined,
        type: interventionFormData.type,
        description: interventionFormData.description || undefined,
        garage_nom: interventionFormData.garage_nom || undefined,
        garage_adresse: interventionFormData.garage_adresse || undefined,
        kilometrage: interventionFormData.kilometrage !== "" ? Number(interventionFormData.kilometrage) : undefined,
        pieces: cleanedPieces
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

  const resetForm = () => {
    setFormData({
      modele_voiture: "",
      matricule_voiture: "",
      kilometrage_voiture: "",
      photo_voiture: ""
    });
    setSelectedPhotoFile(null);
    setSelectedPhotoPreview("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddClick = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEditClick = (vehicule) => {
    setFormData({
      modele_voiture: vehicule.modele_voiture,
      matricule_voiture: vehicule.matricule_voiture,
      kilometrage_voiture: vehicule.kilometrage_voiture || "",
      photo_voiture: vehicule.photo_voiture || ""
    });
    setSelectedPhotoFile(null);
    setSelectedPhotoPreview(vehicule.photo_voiture || "");
    setEditingId(vehicule.id);
    setShowForm(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedPhotoFile(file);
    setSelectedPhotoPreview(URL.createObjectURL(file));
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
            <button
              onClick={() => navigate("/automobiliste/recommandations")}
              className="vb-btn-primary ml-auto px-4 py-2 text-sm"
            >
              Recommandations dynamiques
            </button>
          </div>

        {/* Contenu des onglets */}
        <div className="vb-card p-6">
          {activeTab === "vehicules" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Mes véhicules</h2>
                <button 
                  onClick={handleAddClick}
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
              <h2 className="text-xl font-semibold mb-4">Rendez-vous à venir</h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Garage</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Service</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rendezVous.map((rdv) => (
                    <tr key={rdv.id} className="border-b">
                      <td className="py-2">{rdv.garage}</td>
                      <td>{rdv.date}</td>
                      <td>{rdv.heure}</td>
                      <td>{rdv.service}</td>
                      <td>
                        <button className="text-blue-600 hover:underline mr-2">Détails</button>
                        <button className="text-red-600 hover:underline">Annuler</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "historique" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Historique des interventions</h2>
                <div className="flex gap-2">
                  <button
                    onClick={openInterventionForm}
                    disabled={interventionLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    + Nouvelle intervention
                  </button>
                  <button
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
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold">Pièces utilisées (optionnel)</p>
                        <button
                          type="button"
                          onClick={addPieceLine}
                          className="text-sm bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                        >
                          + Ajouter pièce
                        </button>
                      </div>

                      {piecesLoading ? (
                        <p className="text-sm text-gray-500">Chargement des pièces...</p>
                      ) : interventionFormData.pieces.length === 0 ? (
                        <p className="text-sm text-gray-500">Aucune pièce ajoutée.</p>
                      ) : (
                        <div className="space-y-2">
                          {interventionFormData.pieces.map((pieceLine, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                              <select
                                value={pieceLine.pieceId}
                                onChange={(e) => handlePieceFieldChange(index, "pieceId", e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded"
                                required
                              >
                                <option value="">Choisir pièce</option>
                                {pieces.map((p) => (
                                  <option key={p.id} value={p.id}>{p.nom} ({p.prix_unitaire} TND)</option>
                                ))}
                              </select>

                              <input
                                type="number"
                                min="1"
                                value={pieceLine.quantite}
                                onChange={(e) => handlePieceFieldChange(index, "quantite", e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded"
                                placeholder="Quantité"
                                required
                              />

                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={pieceLine.prix_unitaire}
                                onChange={(e) => handlePieceFieldChange(index, "prix_unitaire", e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded"
                                placeholder="Prix unitaire (optionnel)"
                              />

                              <button
                                type="button"
                                onClick={() => removePieceLine(index)}
                                className="text-red-600 hover:underline"
                              >
                                Supprimer
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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
                              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                <p><span className="font-semibold">Date :</span> {intervention.date_intervention || "-"}</p>
                                <p><span className="font-semibold">Type :</span> {intervention.type || "-"}</p>
                                <p><span className="font-semibold">Kilométrage :</span> {intervention.kilometrage ?? "-"}</p>
                                <p><span className="font-semibold">Coût total :</span> {intervention.cout_total ?? "0"} TND</p>
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
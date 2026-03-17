import { useState, useEffect } from "react";
import { getVehicules, createVehicule, updateVehicule, deleteVehicule } from "../../services/vehicule";

const AutomobilisteDashboard = () => {
  const [activeTab, setActiveTab] = useState("vehicules");

  // États pour les véhicules
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // États pour le formulaire
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    marque: "",
    modele: "",
    annee: new Date().getFullYear(),
    immatriculation: "",
    couleur: "",
    kilometrage: "",
    photo_url: ""
  });

  // Charger les véhicules au montage
  useEffect(() => {
    fetchVehicules();
  }, []);

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

  const resetForm = () => {
    setFormData({
      marque: "",
      modele: "",
      annee: new Date().getFullYear(),
      immatriculation: "",
      couleur: "",
      kilometrage: "",
      photo_url: ""
    });
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
      marque: vehicule.marque,
      modele: vehicule.modele,
      annee: vehicule.annee,
      immatriculation: vehicule.immatriculation,
      couleur: vehicule.couleur || "",
      kilometrage: vehicule.kilometrage || "",
      photo_url: vehicule.photo_url || ""
    });
    setEditingId(vehicule.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (editingId) {
        await updateVehicule(editingId, formData);
        setSuccessMessage("Véhicule modifié avec succès");
      } else {
        await createVehicule(formData);
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

  // Données fictives pour rendez-vous
  const fictitiousVehicules = [
    { id: 1, marque: "Toyota", modele: "Corolla", annee: 2020, immatriculation: "AB-123-CD" },
    { id: 2, marque: "Renault", modele: "Clio", annee: 2019, immatriculation: "EF-456-GH" },
  ];

  const rendezVous = [
    { id: 1, garage: "Garage Auto Plus", date: "2026-03-15", heure: "10:00", service: "Vidange" },
    { id: 2, garage: "Centre Pneus", date: "2026-03-20", heure: "14:30", service: "Changement pneus" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Tableau de bord Automobiliste</h1>

        {/* Onglets */}
        <div className="flex space-x-4 border-b mb-6">
          <button
            onClick={() => setActiveTab("vehicules")}
            className={`pb-2 px-4 font-medium ${activeTab === "vehicules" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Mes véhicules
          </button>
          <button
            onClick={() => setActiveTab("rendezvous")}
            className={`pb-2 px-4 font-medium ${activeTab === "rendezvous" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Rendez-vous
          </button>
          <button
            onClick={() => setActiveTab("historique")}
            className={`pb-2 px-4 font-medium ${activeTab === "historique" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Historique
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="bg-white p-6 rounded-lg shadow">
          {activeTab === "vehicules" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Mes véhicules</h2>
                <button 
                  onClick={handleAddClick}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
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
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {editingId ? "Modifier le véhicule" : "Ajouter un nouveau véhicule"}
                  </h3>
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="marque"
                      placeholder="Marque *"
                      value={formData.marque}
                      onChange={handleInputChange}
                      required
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      name="modele"
                      placeholder="Modèle *"
                      value={formData.modele}
                      onChange={handleInputChange}
                      required
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      name="annee"
                      placeholder="Année *"
                      value={formData.annee}
                      onChange={handleInputChange}
                      required
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      name="immatriculation"
                      placeholder="Immatriculation *"
                      value={formData.immatriculation}
                      onChange={handleInputChange}
                      required
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      name="couleur"
                      placeholder="Couleur"
                      value={formData.couleur}
                      onChange={handleInputChange}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="number"
                      name="kilometrage"
                      placeholder="Kilométrage"
                      value={formData.kilometrage}
                      onChange={handleInputChange}
                      min="0"
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="url"
                      name="photo_url"
                      placeholder="URL de la photo"
                      value={formData.photo_url}
                      onChange={handleInputChange}
                      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 md:col-span-2"
                    />
                    <div className="flex gap-2 md:col-span-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {loading ? "Chargement..." : (editingId ? "Modifier" : "Ajouter")}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={loading}
                        className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 disabled:bg-gray-400"
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
                  <div key={v.id} className="border p-4 rounded-lg shadow-sm hover:shadow-md transition">
                    {v.photo_url && (
                      <img 
                        src={v.photo_url} 
                        alt={`${v.marque} ${v.modele}`}
                        className="w-full h-40 object-cover rounded mb-3"
                      />
                    )}
                    <h3 className="font-bold text-lg">{v.marque} {v.modele}</h3>
                    <p className="text-gray-600">Année : {v.annee}</p>
                    <p className="text-gray-600">Immatriculation : {v.immatriculation}</p>
                    {v.couleur && <p className="text-gray-600">Couleur : {v.couleur}</p>}
                    {v.kilometrage !== null && <p className="text-gray-600">Kilométrage : {v.kilometrage} km</p>}
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
              <h2 className="text-xl font-semibold mb-4">Historique des prestations</h2>
              <p className="text-gray-500">Aucun historique pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutomobilisteDashboard;
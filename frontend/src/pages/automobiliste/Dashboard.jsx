import { useState } from "react";
import { Link } from "react-router-dom";

const AutomobilisteDashboard = () => {
  const [activeTab, setActiveTab] = useState("vehicules");

  // Données fictives
  const vehicules = [
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
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  + Ajouter un véhicule
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {vehicules.map((v) => (
                  <div key={v.id} className="border p-4 rounded-lg shadow-sm">
                    <h3 className="font-bold text-lg">{v.marque} {v.modele}</h3>
                    <p className="text-gray-600">Année : {v.annee}</p>
                    <p className="text-gray-600">Immatriculation : {v.immatriculation}</p>
                    <div className="mt-3 flex space-x-2">
                      <button className="text-blue-600 hover:underline">Modifier</button>
                      <button className="text-red-600 hover:underline">Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
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
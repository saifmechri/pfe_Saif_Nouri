import { useState } from "react";
import PlatformLayout from "../../components/PlatformLayout";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("utilisateurs");

  // Données fictives
  const utilisateurs = [
    { id: 1, nom: "Dupont", prenom: "Jean", email: "jean@example.com", role: "automobiliste" },
    { id: 2, nom: "Martin", prenom: "Marie", email: "marie@example.com", role: "garage" },
    { id: 3, nom: "Durand", prenom: "Paul", email: "paul@example.com", role: "vendeur" },
  ];

  const stats = {
    utilisateurs: 120,
    garages: 15,
    annonces: 45,
    rendezVous: 230,
  };

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Administration</h1>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Utilisateurs</p>
            <p className="text-2xl font-bold">{stats.utilisateurs}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Garages</p>
            <p className="text-2xl font-bold">{stats.garages}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Annonces</p>
            <p className="text-2xl font-bold">{stats.annonces}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Rendez-vous</p>
            <p className="text-2xl font-bold">{stats.rendezVous}</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex space-x-4 border-b mb-6">
          <button
            onClick={() => setActiveTab("utilisateurs")}
            className={`pb-2 px-4 font-medium ${activeTab === "utilisateurs" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab("garages")}
            className={`pb-2 px-4 font-medium ${activeTab === "garages" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Garages
          </button>
          <button
            onClick={() => setActiveTab("annonces")}
            className={`pb-2 px-4 font-medium ${activeTab === "annonces" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Annonces
          </button>
          <button
            onClick={() => setActiveTab("parametres")}
            className={`pb-2 px-4 font-medium ${activeTab === "parametres" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          >
            Paramètres
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          {activeTab === "utilisateurs" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Gestion des utilisateurs</h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Nom</th>
                    <th>Prénom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {utilisateurs.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="py-2">{u.nom}</td>
                      <td>{u.prenom}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>
                        <button className="text-blue-600 hover:underline mr-2">Éditer</button>
                        <button className="text-red-600 hover:underline">Bloquer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "garages" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Gestion des garages</h2>
              <p className="text-gray-500">Liste des garages avec validation...</p>
            </div>
          )}

          {activeTab === "annonces" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Annonces signalées</h2>
              <p className="text-gray-500">Modération des annonces...</p>
            </div>
          )}

          {activeTab === "parametres" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Paramètres généraux</h2>
              <p className="text-gray-500">Configuration de la plateforme...</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </PlatformLayout>
  );
};

export default AdminDashboard;
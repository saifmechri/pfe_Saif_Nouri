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
      <div className="min-h-screen bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-2 text-3xl font-extrabold text-[#1a2b4b]">Administration</h1>
          <p className="mb-6 text-sm text-[#617089]">Vision globale de la plateforme, moderations et pilotage metier.</p>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="vb-card p-4">
            <p className="text-sm text-gray-600">Utilisateurs</p>
            <p className="text-2xl font-bold">{stats.utilisateurs}</p>
          </div>
          <div className="vb-card p-4">
            <p className="text-sm text-gray-600">Garages</p>
            <p className="text-2xl font-bold">{stats.garages}</p>
          </div>
          <div className="vb-card p-4">
            <p className="text-sm text-gray-600">Annonces</p>
            <p className="text-2xl font-bold">{stats.annonces}</p>
          </div>
          <div className="vb-card p-4">
            <p className="text-sm text-gray-600">Rendez-vous</p>
            <p className="text-2xl font-bold">{stats.rendezVous}</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="mb-6 flex flex-wrap gap-3 border-b border-[#d5deec] pb-2">
          <button
            onClick={() => setActiveTab("utilisateurs")}
            className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "utilisateurs" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
          >
            Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab("garages")}
            className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "garages" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
          >
            Garages
          </button>
          <button
            onClick={() => setActiveTab("annonces")}
            className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "annonces" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
          >
            Annonces
          </button>
          <button
            onClick={() => setActiveTab("parametres")}
            className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "parametres" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
          >
            Paramètres
          </button>
        </div>

        <div className="vb-card p-6">
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
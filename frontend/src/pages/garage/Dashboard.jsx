import { useState } from "react";
import PlatformLayout from "../../components/PlatformLayout";

const GarageDashboard = () => {
  const [activeTab, setActiveTab] = useState("aujourdhui");

  // Données fictives
  const rendezVousAujourdhui = [
    { id: 1, client: "Jean Dupont", heure: "09:00", service: "Vidange", vehicule: "Toyota Corolla" },
    { id: 2, client: "Marie Martin", heure: "11:30", service: "Révision", vehicule: "Renault Clio" },
  ];

  const services = [
    { id: 1, nom: "Vidange", duree: "1h", prix: "80€" },
    { id: 2, nom: "Révision complète", duree: "2h", prix: "150€" },
  ];

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-2 text-3xl font-extrabold text-[#1a2b4b]">Dashboard Garage</h1>
          <p className="mb-6 text-sm text-[#617089]">Suivez votre planning atelier et la performance de vos services.</p>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="vb-card flex items-center p-4">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rendez-vous aujourd'hui</p>
              <p className="text-2xl font-bold">{rendezVousAujourdhui.length}</p>
            </div>
          </div>
          <div className="vb-card flex items-center p-4">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Services actifs</p>
              <p className="text-2xl font-bold">{services.length}</p>
            </div>
          </div>
          <div className="vb-card flex items-center p-4">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Clients enregistrés</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="mb-6 flex flex-wrap gap-3 border-b border-[#d5deec] pb-2">
          <button
            onClick={() => setActiveTab("aujourdhui")}
            className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "aujourdhui" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "services" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab("clients")}
            className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "clients" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
          >
            Clients
          </button>
        </div>

        <div className="vb-card p-6">
          {activeTab === "aujourdhui" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Rendez-vous du jour</h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Heure</th>
                    <th>Client</th>
                    <th>Véhicule</th>
                    <th>Service</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rendezVousAujourdhui.map((rdv) => (
                    <tr key={rdv.id} className="border-b">
                      <td className="py-2">{rdv.heure}</td>
                      <td>{rdv.client}</td>
                      <td>{rdv.vehicule}</td>
                      <td>{rdv.service}</td>
                      <td>
                        <button className="text-blue-600 hover:underline mr-2">Démarrer</button>
                        <button className="text-green-600 hover:underline">Terminer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "services" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Services proposés</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  + Nouveau service
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {services.map((s) => (
                  <div key={s.id} className="border p-4 rounded-lg">
                    <h3 className="font-bold text-lg">{s.nom}</h3>
                    <p className="text-gray-600">Durée : {s.duree}</p>
                    <p className="text-gray-600">Prix : {s.prix}</p>
                    <div className="mt-2">
                      <button className="text-blue-600 hover:underline">Modifier</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "clients" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Liste des clients</h2>
              <p className="text-gray-500">Recherche et gestion des clients...</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </PlatformLayout>
  );
};

export default GarageDashboard;
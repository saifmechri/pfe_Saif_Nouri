import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PlatformLayout from "../../components/PlatformLayout";

const VendeurDashboard = () => {
  const [activeTab, setActiveTab] = useState("annonces");
  const navigate = useNavigate();

  // Données fictives
  const annonces = [
    { id: 1, titre: "Toyota Corolla 2020", prix: 15000, status: "active", vues: 45 },
    { id: 2, titre: "Renault Clio 2019", prix: 12000, status: "en_attente", vues: 12 },
  ];

  const transactions = [
    { id: 1, acheteur: "Paul Durand", vehicule: "Toyota Corolla", montant: 15000, date: "2026-03-10" },
  ];

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-2 text-3xl font-extrabold text-[#1a2b4b]">Dashboard Vendeur</h1>
          <p className="mb-6 text-sm text-[#617089]">Pilotez vos annonces, ventes et catalogue de pièces.</p>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="vb-card p-4">
            <p className="text-sm text-gray-600">Annonces actives</p>
            <p className="text-2xl font-bold">{annonces.filter(a => a.status === "active").length}</p>
          </div>
          <div className="vb-card p-4">
            <p className="text-sm text-gray-600">En attente</p>
            <p className="text-2xl font-bold">{annonces.filter(a => a.status === "en_attente").length}</p>
          </div>
          <div className="vb-card p-4">
            <p className="text-sm text-gray-600">Ventes totales</p>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </div>
          <div className="vb-card p-4">
            <p className="text-sm text-gray-600">Chiffre d'affaires</p>
            <p className="text-2xl font-bold">{transactions.reduce((acc, t) => acc + t.montant, 0)} €</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-[#d5deec] pb-2">
          <button
            onClick={() => setActiveTab("annonces")}
            className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "annonces" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
          >
            Mes annonces
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "transactions" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "messages" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
          >
            Messages
          </button>
          <button
            onClick={() => navigate("/vendeur/catalogue")}
            className="vb-btn-primary ml-auto px-4 py-2 text-sm"
          >
            Catalogue pièces
          </button>
        </div>

        <div className="vb-card p-6">
          {activeTab === "annonces" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gestion des annonces</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  + Nouvelle annonce
                </button>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Titre</th>
                    <th>Prix</th>
                    <th>Vues</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {annonces.map((a) => (
                    <tr key={a.id} className="border-b">
                      <td className="py-2">{a.titre}</td>
                      <td>{a.prix} €</td>
                      <td>{a.vues}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs ${a.status === "active" ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"}`}>
                          {a.status === "active" ? "Active" : "En attente"}
                        </span>
                      </td>
                      <td>
                        <button className="text-blue-600 hover:underline mr-2">Modifier</button>
                        <button className="text-red-600 hover:underline">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "transactions" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Historique des ventes</h2>
              {transactions.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2">Date</th>
                      <th>Acheteur</th>
                      <th>Véhicule</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b">
                        <td className="py-2">{t.date}</td>
                        <td>{t.acheteur}</td>
                        <td>{t.vehicule}</td>
                        <td>{t.montant} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">Aucune transaction pour le moment.</p>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Messages</h2>
              <p className="text-gray-500">Boîte de réception...</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </PlatformLayout>
  );
};

export default VendeurDashboard;

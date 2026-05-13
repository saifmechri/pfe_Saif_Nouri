import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Pencil, Eye } from "lucide-react";
import PlatformLayout from "../../components/PlatformLayout";
import { getPieces } from "../../services/pieces";
import { getCompleteProfile, updateProfile } from "../../services/user";

const getPayload = (response) => response?.data?.data ?? response?.data;

const VendeurDashboard = () => {
  const [activeTab, setActiveTab] = useState("pieces");
  const [sellerPieces, setSellerPieces] = useState([]);
  const [piecesLoading, setPiecesLoading] = useState(false);
  const [piecesError, setPiecesError] = useState("");
  
  // États pour la présentation du vendeur
  const [presentationForm, setPresentationForm] = useState({
    store_name: "",
    store_address: "",
    store_description: "",
    store_hours: "",
    store_specialties: "",
    store_services: ""
  });
  const [presentationSaving, setPresentationSaving] = useState(false);
  const [presentationMessage, setPresentationMessage] = useState("");
  const [presentationError, setPresentationError] = useState("");
  const [ownerId, setOwnerId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPieceToDelete, setSelectedPieceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const loadSellerPieces = async (ownerId) => {
    const parsedOwnerId = Number.parseInt(ownerId, 10);
    if (!Number.isInteger(parsedOwnerId) || parsedOwnerId <= 0) {
      setSellerPieces([]);
      return;
    }

    setPiecesLoading(true);
    setPiecesError("");

    try {
      const response = await getPieces({
        userId: parsedOwnerId,
        includeUnvalidated: "true",
        limit: 100,
        page: 1,
        sortBy: "created_at",
        sortOrder: "desc"
      });

      const payload = getPayload(response);
      setSellerPieces(Array.isArray(payload?.items) ? payload.items : []);
    } catch (error) {
      setSellerPieces([]);
      setPiecesError(error?.response?.data?.message || "Impossible de charger vos pieces pour le moment.");
    } finally {
      setPiecesLoading(false);
    }
  };

  const handlePresentationChange = (event) => {
    const { name, value } = event.target;
    setPresentationForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePresentationSave = async (event) => {
    event.preventDefault();
    setPresentationError("");
    setPresentationMessage("");
    setPresentationSaving(true);

    try {
      const payload = {
        store_name: presentationForm.store_name,
        store_address: presentationForm.store_address,
        store_description: presentationForm.store_description,
        store_hours: presentationForm.store_hours,
        store_specialties: presentationForm.store_specialties,
        store_services: presentationForm.store_services
      };

      await updateProfile(payload);
      setPresentationMessage("Présentation enregistrée avec succès.");
      
      // Recharger le profil pour mettre à jour la présentation
      const response = await getCompleteProfile();
      const profile = getPayload(response)?.user || getPayload(response) || {};
      setPresentationForm({
        store_name: profile.store_name || "",
        store_address: profile.store_address || "",
        store_description: profile.store_description || "",
        store_hours: profile.store_hours || "",
        store_specialties: profile.store_specialties || "",
        store_services: profile.store_services || ""
      });
    } catch (err) {
      setPresentationError(err.response?.data?.message || "Erreur lors de l'enregistrement de la présentation");
    } finally {
      setPresentationSaving(false);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const response = await getCompleteProfile();
        const payload = getPayload(response);
        const profile = payload?.user || payload || {};
        const parsedOwnerId = Number.parseInt(profile?.id, 10) || null;
        
        setOwnerId(parsedOwnerId);
        
        // Initialiser les champs de présentation
        setPresentationForm({
          store_name: profile.store_name || "",
          store_address: profile.store_address || "",
          store_description: profile.store_description || "",
          store_hours: profile.store_hours || "",
          store_specialties: profile.store_specialties || "",
          store_services: profile.store_services || ""
        });
        
        await loadSellerPieces(parsedOwnerId);
      } catch {
        setSellerPieces([]);
        setPiecesError("Impossible de charger vos pieces pour le moment.");
      }
    };

    initializeDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeletePiece = async () => {
    if (!selectedPieceToDelete) return;
    setDeleting(true);
    try {
      // Appel API pour supprimer la pièce (à adapter selon votre API)
      await fetch(`/api/pieces/${selectedPieceToDelete.id}`, { method: 'DELETE' });
      setSellerPieces(sellerPieces.filter(p => p.id !== selectedPieceToDelete.id));
      setShowDeleteModal(false);
      setSelectedPieceToDelete(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-2 text-3xl font-extrabold text-[#1a2b4b]">Dashboard Vendeur</h1>
          <p className="mb-6 text-sm text-[#617089]">Pilotez vos pièces, votre catalogue et vos échanges vendeurs.</p>

        {/* Statistiques */}
        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
          <div className="rounded-2xl border border-[#e8eef8] bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm hover:shadow-md transition">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7fa8] mb-2">📦 Pièces publiées</p>
            <p className="text-3xl font-bold text-[#1d4ed8]">{sellerPieces.length}</p>
          </div>
          <div className="rounded-2xl border border-[#e8eef8] bg-gradient-to-br from-green-50 to-green-100 p-6 shadow-sm hover:shadow-md transition">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7fa8] mb-2">✅ Stock disponible</p>
            <p className="text-3xl font-bold text-green-600">{sellerPieces.filter((piece) => Number(piece.stock) > 0).length}</p>
          </div>
          <div className="rounded-2xl border border-[#e8eef8] bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 shadow-sm hover:shadow-md transition">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7fa8] mb-2">⚠️ En rupture</p>
            <p className="text-3xl font-bold text-yellow-600">{sellerPieces.filter((piece) => Number(piece.stock) <= 0).length}</p>
          </div>
          <div className="rounded-2xl border border-[#e8eef8] bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-sm hover:shadow-md transition">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6b7fa8] mb-2">👁️ Vues totales</p>
            <p className="text-3xl font-bold text-purple-600">{sellerPieces.reduce((acc, piece) => acc + Number(piece.vues || 0), 0)}</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-[#d5deec] pb-2">
          <button
            onClick={() => setActiveTab("presentation")}
            className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "presentation" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
          >
            Présentation
          </button>
          <button
            onClick={() => setActiveTab("pieces")}
            className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "pieces" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
          >
            Mes pièces
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
          {activeTab === "presentation" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Éditer la présentation</h2>
              <form onSubmit={handlePresentationSave} className="space-y-4">
                {presentationError && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{presentationError}</div>}
                {presentationMessage && <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{presentationMessage}</div>}
                
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Nom du magasin</label>
                  <input
                    type="text"
                    name="store_name"
                    value={presentationForm.store_name}
                    onChange={handlePresentationChange}
                    className="w-full rounded-lg border border-[#d5deec] px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                    placeholder="Nom de votre magasin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Adresse</label>
                  <input
                    type="text"
                    name="store_address"
                    value={presentationForm.store_address}
                    onChange={handlePresentationChange}
                    className="w-full rounded-lg border border-[#d5deec] px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                    placeholder="Adresse de votre magasin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Description</label>
                  <textarea
                    name="store_description"
                    value={presentationForm.store_description}
                    onChange={handlePresentationChange}
                    className="w-full rounded-lg border border-[#d5deec] px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                    placeholder="Description de votre magasin"
                    rows="4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Horaires</label>
                  <input
                    type="text"
                    name="store_hours"
                    value={presentationForm.store_hours}
                    onChange={handlePresentationChange}
                    className="w-full rounded-lg border border-[#d5deec] px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                    placeholder="Ex: Lun-Sam 09:00-18:00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Spécialités</label>
                  <textarea
                    name="store_specialties"
                    value={presentationForm.store_specialties}
                    onChange={handlePresentationChange}
                    className="w-full rounded-lg border border-[#d5deec] px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                    placeholder="Vos spécialités (séparées par des lignes)"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1">Services</label>
                  <textarea
                    name="store_services"
                    value={presentationForm.store_services}
                    onChange={handlePresentationChange}
                    className="w-full rounded-lg border border-[#d5deec] px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
                    placeholder="Vos services (séparés par des lignes)"
                    rows="3"
                  />
                </div>

                <button
                  type="submit"
                  disabled={presentationSaving}
                  className="vb-btn-primary px-4 py-2 text-sm disabled:opacity-50"
                >
                  {presentationSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "pieces" && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#102848]">Gestion des pièces</h2>
                <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#1d4ed8] to-[#1e40af] px-6 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition">
                  ➕ Nouvelle pièce
                </button>
              </div>

              {piecesLoading ? (
                <p className="text-sm text-gray-500">Chargement de vos pieces...</p>
              ) : piecesError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{piecesError}</div>
              ) : sellerPieces.length === 0 ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center text-blue-700">Aucune pièce publiée pour le moment.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b-2 border-[#dbe4f2] bg-[#f9fbff]">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-[#1a355e]">📦 Nom pièce</th>
                        <th className="px-4 py-3 font-semibold text-[#1a355e]">💰 Prix</th>
                        <th className="px-4 py-3 font-semibold text-[#1a355e]">📊 Stock</th>
                        <th className="px-4 py-3 font-semibold text-[#1a355e]">👁️ Vues</th>
                        <th className="px-4 py-3 font-semibold text-[#1a355e]">✅ Statut</th>
                        <th className="px-4 py-3 font-semibold text-[#1a355e]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerPieces.map((piece) => {
                        const isInStock = Number(piece.stock) > 0;

                        return (
                          <tr key={piece.id} className="border-b border-[#e8eef8] hover:bg-[#f9fbff] transition">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900">{piece.nom || piece.reference || "Pièce"}</div>
                              <div className="text-xs text-slate-500">{piece.reference || "Référence non renseignée"}</div>
                            </td>
                            <td className="px-4 py-3 font-semibold text-[#1d4ed8]">{Number(piece.prix_unitaire || 0).toFixed(2)} €</td>
                            <td className="px-4 py-3 font-semibold">{Number(piece.stock || 0)}</td>
                            <td className="px-4 py-3 text-purple-600 font-semibold">{Number(piece.vues || 0)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                isInStock 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-yellow-100 text-yellow-700"
                              }`}>
                                {isInStock ? "✅ Disponible" : "⚠️ Rupture"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/vendeur/catalogue?pieceId=${piece.id}`)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#c8d8f5] bg-[#eaf2ff] px-3 py-1 text-xs font-semibold text-[#144a9f] hover:bg-[#dfebff] transition"
                                >
                                  <Pencil size={14} /> Éditer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/vendeur/catalogue?pieceId=${piece.id}`)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#d2dceb] bg-white px-3 py-1 text-xs font-semibold text-[#16375f] hover:bg-[#f5f8fe] transition"
                                >
                                  <Eye size={14} /> Voir
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPieceToDelete(piece);
                                    setShowDeleteModal(true);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#f5d5d5] bg-[#ffe8e8] px-3 py-1 text-xs font-semibold text-[#c41e3a] hover:bg-[#ffd9d9] transition"
                                >
                                  <Trash2 size={14} /> Suppr.
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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

        {/* Modal de suppression de pièce */}
        {showDeleteModal && selectedPieceToDelete && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
            <div className="rounded-2xl border border-[#f5d5d5] bg-white shadow-2xl max-w-sm w-full">
              <div className="border-b border-[#f5d5d5] bg-gradient-to-r from-[#fff5f5] to-[#ffe8e8] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <Trash2 size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1a1a1a]">Supprimer la pièce</h3>
                    <p className="text-sm text-[#666]">Cette action est irréversible</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-[#555] leading-relaxed mb-4">
                  Êtes-vous sûr de vouloir supprimer <strong>{selectedPieceToDelete.nom || selectedPieceToDelete.reference}</strong> ? Cette action ne peut pas être annulée.
                </p>
              </div>
              <div className="flex gap-3 border-t border-[#f5d5d5] bg-[#fafafa] p-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 rounded-lg border border-[#d2dceb] bg-white px-4 py-2 text-sm font-semibold text-[#16375f] hover:bg-[#f5f8fe] transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeletePiece}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-[#c41e3a] to-[#a01830] px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition disabled:opacity-50"
                >
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </PlatformLayout>
  );
};

export default VendeurDashboard;

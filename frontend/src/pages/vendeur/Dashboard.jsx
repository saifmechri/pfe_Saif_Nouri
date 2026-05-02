import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlatformLayout from "../../components/PlatformLayout";
import { getPieceSellerLocations } from "../../services/pieces";
import { getCompleteProfile } from "../../services/user";

const fallbackCenter = [35.8256, 10.6369];

const getPayload = (response) => response?.data?.data ?? response?.data;

const extractCoordinates = (profile) => {
  const latitude = Number(profile?.latitude ?? profile?.store_latitude ?? profile?.lat);
  const longitude = Number(profile?.longitude ?? profile?.store_longitude ?? profile?.lon);

  if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
    return [latitude, longitude];
  }

  return null;
};

const buildGoogleMapsEmbedFromCoords = (coords, zoom = 11) => {
  if (!Array.isArray(coords) || coords.length !== 2) {
    return "";
  }

  const [lat, lon] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return "";
  }

  return `https://maps.google.com/maps?q=${lat},${lon}&z=${zoom}&output=embed`;
};

const buildGoogleMapsSearchFromCoords = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) {
    return "";
  }

  const [lat, lon] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return "";
  }

  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
};

const VendeurDashboard = () => {
  const [activeTab, setActiveTab] = useState("annonces");
  const [mapCenter, setMapCenter] = useState(fallbackCenter);
  const [sellerPosition, setSellerPosition] = useState(null);
  const [sellerUserId, setSellerUserId] = useState(null);
  const [nearbySellers, setNearbySellers] = useState([]);
  const [radiusKm, setRadiusKm] = useState(25);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapError, setMapError] = useState("");

  const navigate = useNavigate();

  // Données fictives
  const annonces = [
    { id: 1, titre: "Toyota Corolla 2020", prix: 15000, status: "active", vues: 45 },
    { id: 2, titre: "Renault Clio 2019", prix: 12000, status: "en_attente", vues: 12 },
  ];

  const transactions = [
    { id: 1, acheteur: "Paul Durand", vehicule: "Toyota Corolla", montant: 15000, date: "2026-03-10" },
  ];

  const nearestSeller = useMemo(() => {
    if (nearbySellers.length === 0) {
      return null;
    }

    return [...nearbySellers].sort((a, b) => {
      const first = Number(a.distance_km ?? Number.MAX_SAFE_INTEGER);
      const second = Number(b.distance_km ?? Number.MAX_SAFE_INTEGER);
      return first - second;
    })[0];
  }, [nearbySellers]);

  const dashboardMapEmbedUrl = useMemo(() => buildGoogleMapsEmbedFromCoords(mapCenter, 11), [mapCenter]);
  const myLocationSearchUrl = useMemo(
    () => buildGoogleMapsSearchFromCoords(sellerPosition || mapCenter),
    [sellerPosition, mapCenter]
  );

  const goToStorePresentation = (ownerId) => {
    const parsedOwnerId = Number.parseInt(ownerId, 10);
    if (!Number.isInteger(parsedOwnerId) || parsedOwnerId <= 0) {
      return;
    }

    navigate(`/vendeur/catalogue?ownerId=${parsedOwnerId}&tab=presentation`);
  };

  useEffect(() => {
    initializeMapData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const geocodeAddress = async (address) => {
    const target = String(address || "").trim();
    if (!target) {
      return null;
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(target)}`
    );
    const items = await response.json();
    const firstMatch = Array.isArray(items) ? items[0] : null;

    if (!firstMatch) {
      return null;
    }

    const lat = Number(firstMatch.lat);
    const lon = Number(firstMatch.lon);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return null;
    }

    return [lat, lon];
  };

  const fetchNearbySellers = async (coords, radius = radiusKm) => {
    try {
      const response = await getPieceSellerLocations({
        userLat: coords[0],
        userLon: coords[1],
        radiusKm: radius
      });

      const payload = getPayload(response);
      const items = Array.isArray(payload?.items) ? payload.items : [];
      setNearbySellers(items.filter((item) => item.latitude !== null && item.longitude !== null));
    } catch {
      setMapError("Impossible de charger les vendeurs de pieces proches pour le moment.");
    }
  };

  const initializeMapData = async () => {
    setIsMapLoading(true);
    setMapError("");

    try {
      let coords = null;

      const response = await getCompleteProfile();
      const payload = getPayload(response);
      const profile = payload?.user || payload || {};
      setSellerUserId(Number.parseInt(profile?.id, 10) || null);

      coords = extractCoordinates(profile);

      if (!coords && profile?.store_address) {
        coords = await geocodeAddress(profile.store_address);
      }

      if (!coords) {
        coords = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => resolve([position.coords.latitude, position.coords.longitude]),
            () => reject(new Error("location-failed")),
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      }

      setSellerPosition(coords);
      setMapCenter(coords);
      await fetchNearbySellers(coords, radiusKm);
    } catch {
      setSellerPosition(null);
      setMapCenter(fallbackCenter);
      setMapError("Position vendeur indisponible. Activez la localisation ou ajoutez une adresse de magasin.");
    } finally {
      setIsMapLoading(false);
    }
  };

  const handleRadiusChange = async (event) => {
    const nextRadius = Number(event.target.value);
    setRadiusKm(nextRadius);

    if (sellerPosition) {
      await fetchNearbySellers(sellerPosition, nextRadius);
    }
  };

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-2 text-3xl font-extrabold text-[#1a2b4b]">Dashboard Vendeur</h1>
          <p className="mb-6 text-sm text-[#617089]">Pilotez vos annonces, ventes et catalogue de pièces.</p>

          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="vb-card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-[#1a2b4b]">Carte vendeur et vendeurs de pieces proches</h2>
                <button
                  type="button"
                  onClick={initializeMapData}
                  className="rounded-md border border-[#d1dae8] px-3 py-1.5 text-sm font-semibold text-[#1a2b4b] hover:bg-[#f8faff]"
                >
                  Actualiser la carte
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#d1dae8]">
                <iframe
                  title="Carte Google Maps vendeur"
                  src={dashboardMapEmbedUrl}
                  className="garage-map border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {myLocationSearchUrl && (
                  <a
                    href={myLocationSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"
                  >
                    Ouvrir ma position sur Google Maps
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => goToStorePresentation(sellerUserId)}
                  className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                >
                  Ouvrir ma presentation
                </button>
              </div>

              {nearbySellers.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {nearbySellers.map((seller) => {
                    const sellerCoords = [Number(seller.latitude), Number(seller.longitude)];
                    const sellerMapLink = buildGoogleMapsSearchFromCoords(sellerCoords);

                    return (
                      <div key={seller.user_id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                        <p className="font-semibold text-[#1a2b4b]">{seller.store_name || seller.name || "Vendeur"}</p>
                        <p className="text-xs text-[#617089]">{seller.store_address || "Adresse non disponible"}</p>
                        <p className="mt-1 text-xs text-[#334155]">Distance: {seller.distance_km ? `${Number(seller.distance_km).toFixed(1)} km` : "N/A"}</p>
                        <p className="text-xs text-[#334155]">Pieces: {seller.pieces_count ?? 0}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sellerMapLink && (
                            <a
                              href={sellerMapLink}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-blue-200 bg-white px-2 py-1 text-xs font-semibold text-blue-700"
                            >
                              Ouvrir dans Maps
                            </a>
                          )}
                          <button
                            type="button"
                            className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white"
                            onClick={() => goToStorePresentation(seller.user_id)}
                          >
                            Voir presentation
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {mapError && <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{mapError}</p>}
            </div>

            <div className="vb-card p-4">
              <h3 className="mb-3 text-lg font-bold text-[#1a2b4b]">Parametres localisation</h3>
              <label className="block text-sm font-medium text-[#334155]">
                Rayon de recherche vendeurs (km)
                <select
                  value={radiusKm}
                  onChange={handleRadiusChange}
                  className="vb-input mt-1 w-full px-3 py-2"
                >
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
              </label>

              <div className="mt-4 space-y-2 text-sm text-[#617089]">
                <p>Etat: {isMapLoading ? "Chargement..." : "Pret"}</p>
                <p>Vendeurs trouves: {nearbySellers.length}</p>
                <p>
                  Vendeur le plus proche: {nearestSeller ? `${nearestSeller.store_name || nearestSeller.name || "Vendeur"} (${Number(nearestSeller.distance_km || 0).toFixed(1)} km)` : "Aucun"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/vendeur/catalogue")}
                className="mt-4 w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Ouvrir le catalogue pieces
              </button>
            </div>
          </div>

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

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import PlatformLayout from "../../components/PlatformLayout";
import { comparePieceAcrossVendors } from "../../services/pieces";
import { extractConversationAndMessages, startChatConversation } from "../../services/chat";

const chatRouteByRole = {
  automobiliste: "/automobiliste/messages",
  garage: "/garage/messages",
  vendeur: "/vendeur/messages",
  admin: "/vendeur/messages"
};

const ComparaisonPrix = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const bestOfferRowRef = useRef(null);

  const [nameInput, setNameInput] = useState(searchParams.get("name") || "");
  const [includeOutOfStock, setIncludeOutOfStock] = useState((searchParams.get("includeOutOfStock") || "false") === "true");

  const effectiveName = searchParams.get("name") || "";

  const runComparison = async (params) => {
    const hasName = String(params.name || "").trim().length > 0;

    if (!hasName) {
      setError("Saisissez nom/reference pour lancer la comparaison.");
      setData(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await comparePieceAcrossVendors({
        name: hasName ? params.name : undefined,
        includeOutOfStock: Boolean(params.includeOutOfStock)
      });

      const nextData = res.data?.data || res.data || null;
      setData(nextData);
      const nextOffers = Array.isArray(nextData?.offres) ? nextData.offres : [];
      setSelectedOffer(nextOffers[0] || null);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la comparaison multi-vendeurs.");
      setData(null);
      setSelectedOffer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runComparison({
      name: effectiveName,
      includeOutOfStock
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveName, includeOutOfStock]);

  useEffect(() => {
    setNameInput(effectiveName);
  }, [effectiveName]);

  const summary = data?.summary || {};
  const offers = data?.offres || [];

  const sortedOffers = useMemo(
    () => [...offers].sort((a, b) => Number(a.prix_unitaire || 0) - Number(b.prix_unitaire || 0)),
    [offers]
  );

  const bestPrice = useMemo(() => {
    if (summary.prix_min !== undefined && summary.prix_min !== null) {
      return Number(summary.prix_min);
    }

    if (data?.best_offer?.prix_unitaire !== undefined && data?.best_offer?.prix_unitaire !== null) {
      return Number(data.best_offer.prix_unitaire);
    }

    return 0;
  }, [summary.prix_min, data]);

  const maxPrice = Number(summary.prix_max || 0);
  const economyAmount = Number(summary.economie_max || 0);
  const economyPercent = maxPrice > 0 ? (economyAmount / maxPrice) * 100 : 0;

  const scrollToBestOffer = () => {
    if (bestOfferRowRef.current) {
      bestOfferRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const getSellerDisplayName = (offer, index) => {
    const sellerName = offer?.vendeur?.nom || "";
    const storeName = offer?.vendeur?.magasin || "";
    return sellerName || storeName || `Vendeur ${index + 1}`;
  };

  const getSellerPhone = (offer) => offer?.vendeur?.telephone || "-";

  const getSellerOwnerId = (offer) => {
    if (!offer) return null;

    const vendorProfile = offer?.vendeur && typeof offer.vendeur === "object" ? offer.vendeur : null;
    const directCandidates = [
      vendorProfile?.id,
      offer?.user_id,
      offer?.vendeur_user_id,
      offer?.vendor_user_id,
      offer?.seller_user_id,
      offer?.owner_id,
      offer?.vendeur_id,
      offer?.vendor_id,
      offer?.seller_id
    ];

    return directCandidates
      .map((value) => Number.parseInt(value, 10))
      .find((value) => Number.isFinite(value) && value > 0) || null;
  };

  const handleContactSeller = async () => {
    const sellerUserId = getSellerOwnerId(selectedOffer);
    const targetMessagesPath = chatRouteByRole[user?.role] || "/login";

    if (!user?.role || !["automobiliste", "vendeur", "garage", "admin"].includes(user.role)) {
      navigate("/login");
      return;
    }

    if (!sellerUserId) {
      setError("Impossible de trouver le vendeur pour demarrer le chat.");
      return;
    }

    try {
      setError("");
      const response = await startChatConversation({
        conversationType: "automobiliste_vendeur",
        vendeurId: Number(sellerUserId),
        historyLimit: 50
      });

      const { conversation } = extractConversationAndMessages(response);
      if (conversation?.id) {
        navigate(`${targetMessagesPath}?conversationId=${conversation.id}`);
        return;
      }

      navigate(targetMessagesPath);
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de contacter le vendeur par chat.");
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();

    const next = new URLSearchParams();
    if (String(nameInput).trim()) next.set("name", String(nameInput).trim());
    next.set("includeOutOfStock", includeOutOfStock ? "true" : "false");

    setSearchParams(next);
  };

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Comparaison prix multi-vendeurs</h1>
              <p className="mt-1 text-slate-600">Vue dédiée dynamique pour analyser le meilleur prix disponible.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/vendeur/catalogue")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Retour catalogue
            </button>
          </div>

          <form onSubmit={submitSearch} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                type="text"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Nom ou référence"
                className="rounded-xl border border-slate-200 px-3 py-2 text-slate-700"
              />
              <div className="rounded-xl border border-slate-200 px-3 py-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeOutOfStock}
                    onChange={(event) => setIncludeOutOfStock(event.target.checked)}
                  />
                  Inclure hors stock
                </label>
                <p className="mt-1 text-xs text-slate-500">Affiche aussi les vendeurs qui ont actuellement un stock à 0.</p>
              </div>
            </div>
            <div className="mt-3">
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700">Comparer</button>
            </div>
          </form>

          {loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                ))}
              </div>
              <div className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-white" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-semibold">Impossible de charger la comparaison.</p>
              <p className="mt-1 text-sm">{error}</p>
              <button
                type="button"
                onClick={() => runComparison({ name: effectiveName, includeOutOfStock })}
                className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700"
              >
                Réessayer
              </button>
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">🏪 Vendeurs</p>
                  <p className="mt-1 text-4xl font-black text-blue-800">{summary.vendeurs_count ?? sortedOffers.length ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">💸 Prix minimum</p>
                  <p className="mt-1 text-4xl font-black text-emerald-700">{Number(bestPrice).toFixed(2)} DT</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">🟧 Économie max</p>
                  <p className="mt-1 text-4xl font-black text-amber-700">{Number(economyAmount).toFixed(2)} DT</p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-emerald-800 shadow-sm">
                <p className="text-sm font-semibold">
                  Vous pouvez économiser jusqu'à {Number(economyAmount).toFixed(2)} DT ({Number(economyPercent).toFixed(1)}%).
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-black text-slate-900">{data.piece?.nom || data.best_offer?.nom || "Pièce"}</h2>
                  <button
                    type="button"
                    onClick={scrollToBestOffer}
                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    Voir meilleur vendeur
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="px-4 py-3">Vendeur</th>
                        <th className="px-4 py-3">Prix</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Zone</th>
                        <th className="px-4 py-3">Téléphone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedOffers.map((offer, index) => (
                        <tr
                          key={offer.piece_id || `${offer?.vendeur?.id || "vendeur"}-${index}`}
                          ref={index === 0 ? bestOfferRowRef : null}
                          onClick={() => setSelectedOffer(offer)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedOffer(offer);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className={`border-b border-slate-100 transition hover:bg-blue-50 ${
                            index === 0
                              ? "bg-emerald-50"
                              : index % 2 === 0
                                ? "bg-white"
                                : "bg-slate-50/50"
                          } ${
                            selectedOffer?.piece_id === offer.piece_id && selectedOffer?.vendeur?.id === offer?.vendeur?.id
                              ? "ring-1 ring-blue-300"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            <div className="flex items-center gap-2">
                              <span>{getSellerDisplayName(offer, index)}</span>
                              {index === 0 && (
                                <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                  Meilleur prix
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-black text-slate-900">{Number(offer.prix_unitaire || 0).toFixed(2)} DT</td>
                          <td className="px-4 py-3 text-slate-700">{offer.stock ?? "-"}</td>
                          <td className="px-4 py-3 text-slate-700">{offer.zone_geographique || "-"}</td>
                          <td className="px-4 py-3 text-slate-700">{getSellerPhone(offer)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {selectedOffer && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Détail de l'offre sélectionnée</p>
                    <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-2">
                      <p><span className="font-semibold text-slate-900">Vendeur:</span> {selectedOffer?.vendeur?.nom || selectedOffer?.vendeur?.magasin || "-"}</p>
                      <p><span className="font-semibold text-slate-900">Téléphone:</span> {selectedOffer?.vendeur?.telephone || "-"}</p>
                      <p><span className="font-semibold text-slate-900">Référence:</span> {selectedOffer?.reference || "-"}</p>
                      <p><span className="font-semibold text-slate-900">Prix:</span> {Number(selectedOffer?.prix_unitaire || 0).toFixed(2)} DT</p>
                      <p><span className="font-semibold text-slate-900">Stock:</span> {selectedOffer?.stock ?? "-"}</p>
                      <p><span className="font-semibold text-slate-900">Zone:</span> {selectedOffer?.zone_geographique || "-"}</p>
                      <p><span className="font-semibold text-slate-900">État:</span> {selectedOffer?.condition || "-"}</p>
                      <p><span className="font-semibold text-slate-900">Catégorie:</span> {selectedOffer?.categorie || "-"}</p>
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={handleContactSeller}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300"
                      >
                        Contacter le vendeur
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PlatformLayout>
  );
};

export default ComparaisonPrix;



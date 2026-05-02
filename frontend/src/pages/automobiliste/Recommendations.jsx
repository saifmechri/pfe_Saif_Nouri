import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDynamicRecommendations } from "../../services/recommendation";

const initialFilters = {
  urgency: "",
  sortBy: "urgence",
  order: "desc",
  minInterventionScore: 50,
  garageLimit: 3,
  limit: 6,
};

const badgeByUrgency = {
  URGENT: "bg-red-100 text-red-700 border-red-300",
  "RECOMMANDÉ": "bg-amber-100 text-amber-700 border-amber-300",
  FUTUR: "bg-blue-100 text-blue-700 border-blue-300",
};

const urgencyOrder = ["URGENT", "RECOMMANDÉ", "FUTUR"];

function getRecommendationUrgency(kmActuel, kmRecommande) {
  const current = Number(kmActuel);
  const recommended = Number(kmRecommande);

  if (!Number.isFinite(current) || !Number.isFinite(recommended) || recommended <= 0) {
    return "FUTUR";
  }

  const remaining = Math.max(0, recommended - current);

  if (current >= recommended) return "URGENT";
  if (remaining <= 1000) return "RECOMMANDÉ";
  return "FUTUR";
}

function normalizeRecommendationItem(item) {
  const kmRecommande = Number(item?.intervention?.km_recommande ?? 0);
  const kmActuel = Number(item?.intervention?.km_actuel ?? item?.vehicle?.kilometrage ?? 0);
  const kmRestant = kmRecommande > 0 ? Math.max(0, kmRecommande - kmActuel) : null;

  return {
    ...item,
    intervention: {
      ...item?.intervention,
      km_recommande: kmRecommande || null,
      km_actuel: kmActuel,
      km_restant: kmRestant,
      urgence: getRecommendationUrgency(kmActuel, kmRecommande),
    },
  };
}

function formatDistance(value) {
  if (value === null || value === undefined) return "N/A";
  return `${Number(value).toFixed(1)} km`;
}

const Recommendations = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: initialFilters.limit,
    totalPages: 1,
    stats: { byUrgency: {} },
  });

  const normalizedRecommendations = useMemo(
    () => recommendations.map(normalizeRecommendationItem),
    [recommendations]
  );

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          ...appliedFilters,
          page,
        };

        if (!params.urgency) {
          delete params.urgency;
        }

        const res = await getDynamicRecommendations(params);
        const payload = res.data || {};

        setRecommendations(Array.isArray(payload.data) ? payload.data : []);
        setMeta(payload.meta || {
          total: 0,
          page: 1,
          limit: appliedFilters.limit,
          totalPages: 1,
          stats: { byUrgency: {} },
        });
      } catch (err) {
        const apiErrors = err.response?.data?.errors;
        const details = Array.isArray(apiErrors) ? apiErrors.join(" | ") : "";
        setError(details || err.response?.data?.message || "Erreur lors du chargement des recommandations.");
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [appliedFilters, page]);

  const urgencyStats = useMemo(() => {
    const stats = meta?.stats?.byUrgency || {};
    if (Object.keys(stats).length > 0) {
      return urgencyOrder.map((key) => ({
        key,
        value: stats[key] || 0,
      }));
    }

    const fallback = normalizedRecommendations.reduce((acc, item) => {
      const key = item?.intervention?.urgence || "FUTUR";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return urgencyOrder.map((key) => ({
      key,
      value: fallback[key] || 0,
    }));
  }, [meta, normalizedRecommendations]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: ["minInterventionScore", "garageLimit", "limit"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  };

  const currentPage = meta?.page || page;
  const totalPages = meta?.totalPages || 1;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)]">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-2">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Recommandations véhicule
              </span>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Recommandations dynamiques
              </h1>
              <p className="text-sm leading-6 text-slate-600 sm:text-base">
                Classement basé sur le kilométrage réel: URGENT si le véhicule a atteint le seuil, RECOMMANDÉ si le prochain entretien est proche, sinon FUTUR.
              </p>
            </div>
            <button
              onClick={() => navigate("/automobiliste")}
              className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
            >
              Retour au dashboard
            </button>
          </div>
        </div>

        <form onSubmit={applyFilters} className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Filtres et tri</h2>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Urgence, score, distance</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              name="urgency"
              value={filters.urgency}
              onChange={handleInputChange}
              className="px-3 py-2 border rounded-lg border-slate-300"
            >
              <option value="">Toutes urgences</option>
              <option value="URGENT">URGENT</option>
              <option value="RECOMMANDÉ">RECOMMANDÉ</option>
              <option value="FUTUR">FUTUR</option>
            </select>

            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleInputChange}
              className="px-3 py-2 border rounded-lg border-slate-300"
            >
              <option value="urgence">Trier par urgence</option>
              <option value="score">Trier par score</option>
              <option value="distance">Trier par distance</option>
              <option value="type">Trier par type</option>
            </select>

            <select
              name="order"
              value={filters.order}
              onChange={handleInputChange}
              className="px-3 py-2 border rounded-lg border-slate-300"
            >
              <option value="desc">Ordre descendant</option>
              <option value="asc">Ordre ascendant</option>
            </select>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Score minimum
              <input
                type="number"
                min="0"
                max="100"
                name="minInterventionScore"
                value={filters.minInterventionScore}
                onChange={handleInputChange}
                className="px-3 py-2 border rounded-lg border-slate-300"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Garages proposes / reco
              <input
                type="number"
                min="1"
                max="10"
                name="garageLimit"
                value={filters.garageLimit}
                onChange={handleInputChange}
                className="px-3 py-2 border rounded-lg border-slate-300"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Recommandations par page
              <input
                type="number"
                min="1"
                max="50"
                name="limit"
                value={filters.limit}
                onChange={handleInputChange}
                className="px-3 py-2 border rounded-lg border-slate-300"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button type="submit" className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-blue-500">
              Appliquer
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reinitialiser
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {urgencyStats.map((item) => (
            <div key={item.key} className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{item.key}</p>
              <p className="mt-1 text-3xl font-black text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">{error}</div>}

        {loading ? (
          <div className="rounded-2xl border border-white/70 bg-white/90 p-8 text-slate-500 shadow-sm">Chargement...</div>
        ) : recommendations.length === 0 ? (
          <div className="rounded-2xl border border-white/70 bg-white/90 p-8 text-slate-500 shadow-sm">
            Aucune recommandation trouvee pour les filtres actuels.
          </div>
        ) : (
          <div className="space-y-4">
            {normalizedRecommendations.map((item, index) => {
              const urgencyClass = badgeByUrgency[item.intervention?.urgence] || "bg-slate-100 text-slate-700 border-slate-300";

              return (
                <article key={`${item.vehicle?.id || index}-${item.intervention?.id || index}`} className="overflow-hidden rounded-[26px] border border-white/80 bg-white/95 shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
                  <div className={`h-1.5 ${item.intervention?.urgence === "URGENT" ? "bg-red-500" : item.intervention?.urgence === "RECOMMANDÉ" ? "bg-amber-500" : "bg-blue-500"}`} />
                  <div className="p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {item.intervention?.type || "Intervention"} - {item.vehicle?.modele || "Vehicule"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.vehicle?.marque || "-"} | {item.vehicle?.matricule || "-"} | {item.vehicle?.kilometrage ?? "-"} km
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${urgencyClass}`}>
                      {item.intervention?.urgence || "N/A"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Score</p>
                      <p className="font-semibold text-slate-900">{item.intervention?.score ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">KM recommande</p>
                      <p className="font-semibold text-slate-900">{item.intervention?.km_recommande ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">KM actuel</p>
                      <p className="font-semibold text-slate-900">{item.intervention?.km_actuel ?? "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">KM restant</p>
                      <p className="font-semibold text-slate-900">{item.intervention?.km_restant ?? "-"}</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="mb-2 font-semibold text-slate-900">Garages recommandes</p>
                    {Array.isArray(item.garages) && item.garages.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-3 py-2 text-left">Nom</th>
                              <th className="px-3 py-2 text-left">Distance</th>
                              <th className="px-3 py-2 text-left">Rating</th>
                              <th className="px-3 py-2 text-left">Score</th>
                              <th className="px-3 py-2 text-left">Telephone</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.garages.map((garage) => (
                              <tr key={garage.id} className="border-t border-slate-100">
                                <td className="px-3 py-2 font-medium text-slate-900">{garage.name || "-"}</td>
                                <td className="px-3 py-2">{formatDistance(garage.distance_km)}</td>
                                <td className="px-3 py-2">{garage.rating ?? "-"}</td>
                                <td className="px-3 py-2">{garage.score_global ?? "-"}</td>
                                <td className="px-3 py-2">{garage.telephone || "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Aucun garage disponible pour cette recommandation.</p>
                    )}
                  </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)] md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-800">{meta?.total || 0}</span> recommandations
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => canGoPrev && setPage((prev) => prev - 1)}
              disabled={!canGoPrev}
              className="rounded-full border border-slate-300 px-3 py-2 disabled:opacity-50"
            >
              Precedent
            </button>
            <span className="text-sm text-slate-700">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => canGoNext && setPage((prev) => prev + 1)}
              disabled={!canGoNext}
              className="rounded-full border border-slate-300 px-3 py-2 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
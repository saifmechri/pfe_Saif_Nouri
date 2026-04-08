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
    return ["URGENT", "RECOMMANDÉ", "FUTUR"].map((key) => ({
      key,
      value: stats[key] || 0,
    }));
  }, [meta]);

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
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Recommandations dynamiques</h1>
            <p className="text-slate-600 mt-1">Interventions prioritaires selon vos vehicules et garages proches.</p>
          </div>
          <button
            onClick={() => navigate("/automobiliste")}
            className="w-full md:w-auto px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            Retour au dashboard
          </button>
        </div>

        <form onSubmit={applyFilters} className="bg-white rounded-xl shadow p-4 border border-slate-200">
          <h2 className="font-semibold text-slate-800 mb-4">Filtres et tri</h2>
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

          <div className="mt-4 flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Appliquer
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Reinitialiser
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {urgencyStats.map((item) => (
            <div key={item.key} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-500">{item.key}</p>
              <p className="text-2xl font-bold text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>

        {error && <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-700">{error}</div>}

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-slate-500">Chargement...</div>
        ) : recommendations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-slate-500">
            Aucune recommandation trouvee pour les filtres actuels.
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((item, index) => {
              const urgencyClass = badgeByUrgency[item.intervention?.urgence] || "bg-slate-100 text-slate-700 border-slate-300";

              return (
                <article key={`${item.vehicle?.id || index}-${item.intervention?.id || index}`} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {item.intervention?.type || "Intervention"} - {item.vehicle?.modele || "Vehicule"}
                      </h3>
                      <p className="text-slate-600 text-sm mt-1">
                        {item.vehicle?.marque || "-"} | {item.vehicle?.matricule || "-"} | {item.vehicle?.kilometrage ?? "-"} km
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${urgencyClass}`}>
                      {item.intervention?.urgence || "N/A"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-slate-500">Score</p>
                      <p className="font-semibold text-slate-800">{item.intervention?.score ?? "-"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-slate-500">KM recommande</p>
                      <p className="font-semibold text-slate-800">{item.intervention?.km_recommande ?? "-"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-slate-500">KM actuel</p>
                      <p className="font-semibold text-slate-800">{item.intervention?.km_actuel ?? "-"}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-slate-500">KM restant</p>
                      <p className="font-semibold text-slate-800">{item.intervention?.km_restant ?? "-"}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="font-semibold text-slate-800 mb-2">Garages recommandes</p>
                    {Array.isArray(item.garages) && item.garages.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="text-left px-3 py-2">Nom</th>
                              <th className="text-left px-3 py-2">Distance</th>
                              <th className="text-left px-3 py-2">Rating</th>
                              <th className="text-left px-3 py-2">Score</th>
                              <th className="text-left px-3 py-2">Telephone</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.garages.map((garage) => (
                              <tr key={garage.id} className="border-t border-slate-100">
                                <td className="px-3 py-2">{garage.name || "-"}</td>
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
                      <p className="text-slate-500 text-sm">Aucun garage disponible pour cette recommandation.</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-800">{meta?.total || 0}</span> recommandations
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => canGoPrev && setPage((prev) => prev - 1)}
              disabled={!canGoPrev}
              className="px-3 py-2 rounded-lg border border-slate-300 disabled:opacity-50"
            >
              Precedent
            </button>
            <span className="text-sm text-slate-700">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => canGoNext && setPage((prev) => prev + 1)}
              disabled={!canGoNext}
              className="px-3 py-2 rounded-lg border border-slate-300 disabled:opacity-50"
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
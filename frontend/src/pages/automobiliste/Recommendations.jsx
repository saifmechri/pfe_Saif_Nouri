import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { getDynamicRecommendations } from "../../services/recommendation";

const PAGE_SIZE = 6;

const INITIAL_FILTERS = {
  urgency: "",
  sortBy: "urgence",
  minScore: 50,
  distance: 20
};

const URGENCY_OPTIONS = [
  { value: "", label: "All", pill: "bg-slate-100 text-slate-700 border-slate-300" },
  { value: "URGENT", label: "Urgent", pill: "bg-red-100 text-red-700 border-red-300" },
  { value: "RECOMMANDÉ", label: "Recommended", pill: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "FUTUR", label: "Future", pill: "bg-blue-100 text-blue-700 border-blue-300" }
];

const SORT_OPTIONS = [
  { value: "urgence", label: "Urgency" },
  { value: "distance", label: "Distance" },
  { value: "score", label: "Score" }
];

const DISTANCE_OPTIONS = [10, 20, 50];
const URGENCY_ORDER = { URGENT: 3, "RECOMMANDÉ": 2, FUTUR: 1 };

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
      urgence: getRecommendationUrgency(kmActuel, kmRecommande)
    }
  };
}

function formatDistance(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/A";
  return `${Number(value).toFixed(1)} km`;
}

function getUrgencyBadgeClass(urgency) {
  switch (urgency) {
    case "URGENT":
      return "bg-red-100 text-red-700 border-red-300";
    case "RECOMMANDÉ":
      return "bg-amber-100 text-amber-700 border-amber-300";
    case "FUTUR":
      return "bg-blue-100 text-blue-700 border-blue-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

const Recommendations = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [visibleRecommendations, setVisibleRecommendations] = useState([]);
  const [expandedRecommendation, setExpandedRecommendation] = useState(null);

  const normalizedRecommendations = useMemo(
    () => recommendations.map(normalizeRecommendationItem),
    [recommendations]
  );

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await getDynamicRecommendations({ limit: 50, page: 1 });
        const payload = res.data || {};

        setRecommendations(Array.isArray(payload.data) ? payload.data : []);
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
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters.urgency, filters.sortBy, filters.minScore, filters.distance]);

  useEffect(() => {
    const selectedDistance = Number(filters.distance);

    const filtered = normalizedRecommendations
      .map((item) => {
        const garages = Array.isArray(item.garages) ? item.garages : [];
        const filteredGarages = garages.filter((garage) => {
          const garageDistance = Number(garage.distance_km);
          return Number.isFinite(garageDistance) && garageDistance <= selectedDistance;
        });

        const bestGarageDistance = filteredGarages.reduce((best, garage) => {
          const currentDistance = Number(garage.distance_km);
          if (!Number.isFinite(currentDistance)) {
            return best;
          }
          if (best === null) {
            return currentDistance;
          }
          return currentDistance < best ? currentDistance : best;
        }, null);

        return {
          ...item,
          garages: filteredGarages,
          bestGarageDistance
        };
      })
      .filter((item) => {
        if (filters.urgency && item.intervention?.urgence !== filters.urgency) {
          return false;
        }

        if (Number(item.intervention?.score ?? 0) < Number(filters.minScore)) {
          return false;
        }

        return item.garages.length > 0;
      })
      .sort((a, b) => {
        if (filters.sortBy === "score") {
          return Number(b.intervention?.score ?? 0) - Number(a.intervention?.score ?? 0);
        }

        if (filters.sortBy === "distance") {
          const aDistance = a.bestGarageDistance ?? Number.POSITIVE_INFINITY;
          const bDistance = b.bestGarageDistance ?? Number.POSITIVE_INFINITY;
          if (aDistance !== bDistance) return aDistance - bDistance;
          return Number(b.intervention?.score ?? 0) - Number(a.intervention?.score ?? 0);
        }

        const urgencyDiff = (URGENCY_ORDER[b.intervention?.urgence] || 0) - (URGENCY_ORDER[a.intervention?.urgence] || 0);
        if (urgencyDiff !== 0) return urgencyDiff;
        return Number(b.intervention?.score ?? 0) - Number(a.intervention?.score ?? 0);
      });

    setVisibleRecommendations(filtered);
  }, [normalizedRecommendations, filters]);

  const currentPage = Math.max(1, page);
  const totalPages = Math.max(1, Math.ceil(visibleRecommendations.length / PAGE_SIZE));
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const pageRecommendations = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return visibleRecommendations.slice(startIndex, startIndex + PAGE_SIZE);
  }, [visibleRecommendations, currentPage]);

  const urgencyStats = useMemo(() => {
    const stats = visibleRecommendations.reduce(
      (acc, item) => {
        const key = item.intervention?.urgence || "FUTUR";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      { URGENT: 0, "RECOMMANDÉ": 0, FUTUR: 0 }
    );

    return [
      { key: "URGENT", value: stats.URGENT || 0 },
      { key: "RECOMMANDÉ", value: stats["RECOMMANDÉ"] || 0 },
      { key: "FUTUR", value: stats.FUTUR || 0 }
    ];
  }, [visibleRecommendations]);

  const handleUrgencyChange = (value) => {
    setFilters((prev) => ({ ...prev, urgency: value }));
  };

  const handleRangeChange = (event) => {
    setFilters((prev) => ({ ...prev, minScore: Number(event.target.value) }));
  };

  const handleSelectChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: name === "distance" ? Number(value) : value
    }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
    setExpandedRecommendation(null);
  };

  const currentFiltersSummary = [
    filters.urgency || "All",
    `Score ≥ ${filters.minScore}`,
    `Distance ≤ ${filters.distance} km`,
    SORT_OPTIONS.find((option) => option.value === filters.sortBy)?.label || "Urgency"
  ];

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
                Filtres instantanés et tri intelligent des recommandations selon l&apos;urgence, la distance et le score.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/automobiliste")}
              className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
            >
              Retour au dashboard
            </button>
          </div>
        </div>

        <section className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Filtres et tri</h2>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">compact, instantané, responsive</p>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              aria-label="Réinitialiser les filtres"
              title="Réinitialiser"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Urgency</p>
              <div className="flex flex-wrap gap-2">
                {URGENCY_OPTIONS.map((option) => {
                  const active = filters.urgency === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => handleUrgencyChange(option.value)}
                      className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? option.pill + " shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {currentFiltersSummary.map((item) => (
                  <span key={item} className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[420px] lg:grid-cols-2">
              <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>Minimum score</span>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-blue-700 shadow-sm">
                    {filters.minScore}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={filters.minScore}
                  onChange={handleRangeChange}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600"
                />
                <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                  <span>0</span>
                  <span>100</span>
                </div>
              </label>

              <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 text-sm font-semibold text-slate-700">Distance</div>
                <select
                  name="distance"
                  value={filters.distance}
                  onChange={handleSelectChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400"
                >
                  {DISTANCE_OPTIONS.map((distance) => (
                    <option key={distance} value={distance}>
                      {distance} km
                    </option>
                  ))}
                </select>
              </label>

              <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2 lg:col-span-1">
                <div className="mb-2 text-sm font-semibold text-slate-700">Sort by</div>
                <select
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleSelectChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {urgencyStats.map((item) => (
            <div key={item.key} className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{item.key}</p>
              <p className="mt-1 text-3xl font-black text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-white/70 bg-white/90 p-8 text-slate-500 shadow-sm">Chargement...</div>
        ) : visibleRecommendations.length === 0 ? (
          <div className="rounded-2xl border border-white/70 bg-white/90 p-8 text-slate-500 shadow-sm">
            Aucune recommandation trouvee pour les filtres actuels.
          </div>
        ) : (
          <div className="space-y-4">
            {pageRecommendations.map((item, index) => {
              const urgencyClass = getUrgencyBadgeClass(item.intervention?.urgence);
              const isFirst = (currentPage - 1) * PAGE_SIZE + index === 0;

              return (
                <article
                  key={`${item.vehicle?.id || index}-${item.intervention?.id || index}`}
                  className="overflow-hidden rounded-[26px] border border-white/80 bg-white/95 shadow-[0_16px_45px_rgba(15,23,42,0.08)]"
                >
                  <div
                    className={`h-1.5 ${item.intervention?.urgence === "URGENT" ? "bg-red-500" : item.intervention?.urgence === "RECOMMANDÉ" ? "bg-amber-500" : "bg-blue-500"}`}
                  />
                  <div className="p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            {item.intervention?.type || "Intervention"} - {item.vehicle?.modele || "Vehicule"}
                          </h3>
                          {isFirst && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              Recommended
                            </span>
                          )}
                        </div>
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
                        <p className="text-slate-500">KM recommandé</p>
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
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-semibold text-slate-900">Garages recommandés</p>
                        <span className="text-xs font-medium text-slate-500">
                          {item.garages.length} garage(s) dans le rayon
                        </span>
                      </div>

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
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedRecommendation((prev) => (prev === index ? null : index))}
                      className="mt-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {expandedRecommendation === index ? "Masquer les détails" : "Voir les détails"}
                    </button>

                    {expandedRecommendation === index && (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        Tri actuel: <span className="font-semibold text-slate-900">{SORT_OPTIONS.find((option) => option.value === filters.sortBy)?.label || "Urgency"}</span> ·
                        Distance max: <span className="font-semibold text-slate-900">{filters.distance} km</span> ·
                        Score minimum: <span className="font-semibold text-slate-900">{filters.minScore}</span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-[24px] border border-white/70 bg-white/90 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)] md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-800">{visibleRecommendations.length}</span> recommandations
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => canGoPrev && setPage((prev) => prev - 1)}
              disabled={!canGoPrev}
              className="rounded-full border border-slate-300 px-3 py-2 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-700">
              Page {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => canGoNext && setPage((prev) => prev + 1)}
              disabled={!canGoNext}
              className="rounded-full border border-slate-300 px-3 py-2 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
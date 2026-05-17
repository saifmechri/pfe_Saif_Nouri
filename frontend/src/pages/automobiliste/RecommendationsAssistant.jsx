import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, MapPin, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import PlatformLayout from "../../components/PlatformLayout";
import { getDynamicRecommendations } from "../../services/recommendation";

/**
 * INTELLIGENT RECOMMENDATIONS PAGE
 * 
 * Displays AI-powered maintenance recommendations using AUTO BOT engine.
 * 
 * HOW TO USE:
 * 1. Page loads recommendations for all user's vehicles
 * 2. For each vehicle shows:
 *    - Recommended maintenance type (oil change, inspection, etc.)
 *    - Top 3 matching garages sorted by score
 *    - Distance, rating, and price for each garage
 * 3. Click "Choisir ce garage" to create appointment
 * 
 * RECOMMENDATION ALGORITHM:
 * - Analyzes mileage vs service intervals
 * - Checks time since last maintenance
 * - Ranks garages by distance, ratings, specialization
 * - Risk assessment: URGENT / RECOMMANDÉ / FUTUR
 */

const FALLBACK_TEXT = "Donnée non renseignée";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatKm = (value) => {
  const parsed = toNumber(value);
  if (parsed === null) return FALLBACK_TEXT;
  return `${Math.round(parsed)} km`;
};

const formatDistance = (value) => {
  const parsed = toNumber(value);
  if (parsed === null) return FALLBACK_TEXT;
  return `${parsed.toFixed(1)} km`;
};

const formatRating = (value) => {
  const parsed = toNumber(value);
  if (parsed === null) return FALLBACK_TEXT;
  return parsed.toFixed(1);
};

const formatMoney = (value) => {
  const parsed = toNumber(value);
  if (parsed === null) return "À confirmer";
  return `${Math.round(parsed)} DT`;
};

const formatLastMaintenance = (value, interventionCount) => {
  if (Number.isFinite(interventionCount) && interventionCount > 0) {
    const parsed = toNumber(value);
    if (parsed !== null) {
      return `${Math.round(parsed)} km depuis la dernière maintenance`;
    }
    return "Historique de maintenance disponible";
  }

  return "Aucune maintenance enregistrée";
};

const getToneClasses = (tone) => {
  if (tone === "rose") return "border-rose-200 bg-rose-50 text-rose-700";
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

const DEFAULT_DECISION = {
  decision: "Révision",
  recommendation_summary: "Recommandation générée par le moteur intelligent Auto Bot.",
  recommendation_role: "Moteur intelligent Auto Bot",
  risk: "MEDIUM",
  risk_message: "Le système applique un mode de continuité pour afficher une décision valide.",
  risk_tone: "amber",
  final_score: 50,
  vehicle_score: 50,
  garage_score: 50,
  reasons: ["Décision de fallback active en attendant un enrichissement des données."],
  analysis: {
    trigger: "Déclencheur: décision de continuité.",
    history: "Historique insuffisant: fallback de sécurité.",
    riskReason: "Risque MEDIUM appliqué par défaut."
  },
  vehicle: {
    id: null,
    modele: "Votre véhicule",
    matricule: null,
    kilometrage_voiture: null,
    fuel: null,
    current_state: "À vérifier"
  },
  recommended_garage: {
    name: "Garage à confirmer",
    distance_km: null,
    rating: null,
    isOpen: false,
    score_global: 0
  },
  top_garages: []
};

const normalizeVehicleSnapshot = (vehicle = {}) => ({
  id: vehicle.id ?? null,
  modele: vehicle.modele ?? vehicle.modele_voiture ?? "Votre véhicule",
  type: vehicle.type ?? vehicle.type_vehicule ?? null,
  matricule: vehicle.matricule ?? vehicle.matricule_voiture ?? null,
  kilometrage_voiture: toNumber(vehicle.kilometrage_voiture),
  fuel: vehicle.fuel ?? vehicle.type_vehicule ?? null,
  current_state: vehicle.current_state ?? "À vérifier"
});

const normalizeDecision = (decision) => {
  if (!decision || typeof decision !== "object") return DEFAULT_DECISION;

  const normalizedVehicle = normalizeVehicleSnapshot(decision.vehicle);
  const normalizedGarages = Array.isArray(decision.top_garages)
    ? decision.top_garages.map((garage) => ({ ...garage }))
    : DEFAULT_DECISION.top_garages;

  return {
    ...DEFAULT_DECISION,
    ...decision,
    analysis: {
      ...DEFAULT_DECISION.analysis,
      ...(decision.analysis || {})
    },
    vehicle: normalizedVehicle,
    recommended_garage: {
      ...DEFAULT_DECISION.recommended_garage,
      ...(decision.recommended_garage || {})
    },
    recommendation_role: decision.recommendation_role || DEFAULT_DECISION.recommendation_role,
    top_garages: normalizedGarages,
    reasons: Array.isArray(decision.reasons) ? decision.reasons : DEFAULT_DECISION.reasons
  };
};

const RecommendationsAssistant = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decision, setDecision] = useState(DEFAULT_DECISION);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError("");
      setDecision(DEFAULT_DECISION);

      try {
        const response = await getDynamicRecommendations({ page: 1, limit: 50, sortBy: "score", order: "desc" });
        const canonicalDecision = normalizeDecision(response.data?.decision);

        if (!isMounted) return;
        setDecision(canonicalDecision);
      } catch (fetchError) {
        const apiErrors = fetchError.response?.data?.errors;
        const details = Array.isArray(apiErrors) ? apiErrors.join(" | ") : "";
        setError(details || fetchError.response?.data?.message || "Impossible de charger la décision.");
        setDecision(DEFAULT_DECISION);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const vehicle = decision.vehicle || DEFAULT_DECISION.vehicle;
    console.log("[RecommendationsUI][VehicleRender]", {
      id: vehicle.id ?? null,
      matricule: vehicle.matricule ?? null,
      kilometrage_voiture: vehicle.kilometrage_voiture ?? null
    });
  }, [decision.vehicle?.id, decision.vehicle?.matricule, decision.vehicle?.kilometrage_voiture]);

  const topGarages = Array.isArray(decision.top_garages) ? decision.top_garages.slice(0, 3) : [];
  const recommendedGarage = decision.recommended_garage || topGarages[0] || null;
  const toneClasses = getToneClasses(decision.risk_tone);
  // Client-side distance filtering and risk consistency
  const MAX_DISTANCE_KM = 1000; // default cap for recommendations
  const filteredTopGarages = topGarages.filter((g) => {
    const d = Number(g.distance_km ?? g.distance ?? NaN);
    return Number.isNaN(d) ? true : d <= MAX_DISTANCE_KM;
  });
  let finalRecommendedGarage = recommendedGarage;
  if (
    recommendedGarage &&
    Number.isFinite(Number(recommendedGarage.distance_km)) &&
    Number(recommendedGarage.distance_km) > MAX_DISTANCE_KM
  ) {
    finalRecommendedGarage = filteredTopGarages[0] || null;
  }

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef3fb_100%)]">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-[32px] border border-white/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.3fr_0.7fr] lg:px-8 lg:py-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Assistant de décision
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                    Recommandation intelligente pour l'entretien véhicule
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                    Le moteur décisionnel d'Auto Bot analyse le véhicule, l'historique de maintenance et les garages pour fournir une décision canonique prête à être consommée en production.
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(37,99,235,0.88))] p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Décision principale</p>
                    <h2 className="mt-2 text-2xl font-black">{decision.decision}</h2>
                    <p className="mt-1 text-sm text-white/80">
                      {decision.recommendation_summary}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/12 px-4 py-3 text-right backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/70">Score final</p>
                    <p className="mt-1 text-2xl font-black">{decision.final_score}/100</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-[28px] border border-white/80 bg-white/90 p-10 text-slate-600 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              Récupération de la décision depuis le moteur backend...
            </div>
          ) : (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-[32px] border border-white/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
                        <Sparkles className="h-3.5 w-3.5" />
                        Résumé
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {decision.risk}
                      </span>
                    </div>

                    <div>
                      <h2 className="mt-2 text-3xl font-black text-slate-900">{decision.vehicle?.modele || decision.vehicle?.type || "Votre véhicule"}</h2>
                      <p className="mt-2 text-sm text-slate-600">
                        ID: {decision.vehicle?.id ?? FALLBACK_TEXT} · Matricule: {decision.vehicle?.matricule || FALLBACK_TEXT} · KM: {formatKm(decision.vehicle?.kilometrage_voiture)} · Carburant: {decision.vehicle?.fuel || FALLBACK_TEXT} · État: {decision.vehicle?.current_state || FALLBACK_TEXT}
                      </p>
                    </div>

                    <div className="rounded-[26px] bg-[linear-gradient(180deg,#0f172a,#1d4ed8)] p-5 text-white shadow-[0_14px_35px_rgba(15,23,42,0.12)]">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Décision finale</p>
                      <div className="mt-2 flex flex-wrap items-end gap-3">
                        <h3 className="text-3xl font-black">{decision.decision}</h3>
                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white/90">{decision.final_score}/100</span>
                      </div>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">{decision.recommendation_summary}</p>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Score véhicule</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{decision.vehicle_score}/100</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Score garage</p>
                        <p className="mt-2 text-2xl font-black text-slate-900">{decision.garage_score}/100</p>
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
                      <p className="text-xs font-bold uppercase tracking-[0.16em]">Risque</p>
                      <p className="mt-1 text-lg font-black">{decision.risk}</p>
                      <p className="mt-2 text-sm leading-6">{decision.risk_message}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-slate-700" />
                  <h2 className="text-xl font-black text-slate-900">Analyse</h2>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[26px] bg-slate-50 p-5">
                    <div className="space-y-3 text-sm leading-7 text-slate-700">
                      <p>{decision.analysis?.trigger || FALLBACK_TEXT}</p>
                      <p>{decision.analysis?.history || FALLBACK_TEXT}</p>
                      <p>{formatLastMaintenance(decision.analysis?.mileageSinceLastMaintenance, decision.analysis?.totalInterventions)}</p>
                      <p>{decision.analysis?.riskReason || FALLBACK_TEXT}</p>
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-slate-200 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Raisons principales</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {(Array.isArray(decision.reasons) ? decision.reasons : []).slice(0, 3).map((reason) => (
                        <li key={reason} className="rounded-xl bg-slate-50 px-3 py-2">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section className="rounded-[32px] border border-white/80 bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-slate-700" />
                    <h2 className="text-xl font-black text-slate-900">Garage matching</h2>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Top 3 seulement</p>
                </div>

                <div className="mt-5 space-y-4">
                  {finalRecommendedGarage ? (
                    <>
                      <article className="rounded-[30px] border border-amber-300 bg-gradient-to-br from-amber-50 via-white to-sky-50 p-6 shadow-[0_18px_45px_rgba(251,191,36,0.16)] ring-1 ring-amber-200">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Meilleur match</p>
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-800">
                                <Sparkles className="h-3.5 w-3.5" />
                                RECOMMANDÉ
                              </span>
                            </div>
                            <h3 className="mt-2 text-xl font-black text-slate-900">{finalRecommendedGarage.name}</h3>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Score</p>
                            <p className="text-sm font-black text-slate-900">{Math.round(toNumber(finalRecommendedGarage.score_global) || 0)}/100</p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm text-slate-700">
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Distance</p>
                            <p className="mt-1 font-semibold text-slate-900">{formatDistance(finalRecommendedGarage.distance_km)}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Rating</p>
                            <p className="mt-1 font-semibold text-slate-900">⭐ {formatRating(finalRecommendedGarage.rating)}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Disponibilité</p>
                            <p className="mt-1 font-semibold text-slate-900">{finalRecommendedGarage.isOpen ? "Disponible maintenant" : "Sur rendez-vous"}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Prix estimé</p>
                            <p className="mt-1 font-semibold text-slate-900">{formatMoney(finalRecommendedGarage.estimated_price)}</p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => navigate("/automobiliste/appointments")}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            Prendre rendez-vous
                            <ArrowRight className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate("/automobiliste/garages")}
                            className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                          >
                            Voir garage
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </article>

                      {topGarages.length > 1 ? (
                        <div className="space-y-3 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Autres garages</p>
                          <div className="space-y-3">
                            {topGarages.slice(1).map((garage) => (
                              <div key={garage.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                  <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900">{garage.name}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {formatDistance(garage.distance_km)} · ⭐ {formatRating(garage.rating)} · {garage.isOpen ? "Disponible" : "Sur rendez-vous"}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Score</p>
                                    <p className="text-sm font-black text-slate-900">{Math.round(toNumber(garage.score_global) || 0)}/100</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => navigate("/automobiliste/appointments")}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                  >
                                    Prendre rendez-vous
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => navigate("/automobiliste/garages")}
                                    className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                                  >
                                    Voir garage
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="rounded-[26px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                      Aucun garage exploitable n'a été trouvé pour cette décision.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </PlatformLayout>
  );
};

export default RecommendationsAssistant;



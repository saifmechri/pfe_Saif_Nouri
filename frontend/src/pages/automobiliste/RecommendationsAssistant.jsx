import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeDollarSign,
  BadgeInfo,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Clock3,
  Columns3,
  Loader2,
  MapPin,
  Package,
  RefreshCcw,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
  Wrench,
  ShieldCheck
} from "lucide-react";
import PlatformLayout from "../../components/PlatformLayout";
import { getDynamicRecommendations } from "../../services/recommendation";

const PAGE_SIZE = 4;

const ASSISTANT_TABS = [
  {
    id: "nearby",
    label: "Garages proches",
    hint: "Met en avant les solutions les plus proches de l'utilisateur.",
    icon: MapPin
  },
  {
    id: "price",
    label: "Meilleurs prix",
    hint: "Oriente les résultats vers le meilleur rapport qualité/prix.",
    icon: BadgeDollarSign
  },
  {
    id: "rating",
    label: "Mieux notés",
    hint: "Classe les propositions selon la confiance et les avis.",
    icon: Star
  },
  {
    id: "fast",
    label: "Disponibles rapidement",
    hint: "Favorise les garages ouverts et les services accessibles maintenant.",
    icon: Clock3
  },
  {
    id: "pieces",
    label: "Pièces compatibles",
    hint: "Affiche les pièces les plus adaptées au véhicule courant.",
    icon: Package
  },
  {
    id: "services",
    label: "Services recommandés",
    hint: "Privilégie les prestations les plus utiles pour ce véhicule.",
    icon: Wrench
  }
];

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDistance = (value) => {
  const parsed = toNumber(value);
  if (parsed === null) return "N/A";
  return `${parsed.toFixed(1)} km`;
};

const formatMoney = (value) => {
  const parsed = toNumber(value);
  if (parsed === null) return "À confirmer";
  return `${parsed.toFixed(0)} DT`;
};

const formatRating = (value) => {
  const parsed = toNumber(value);
  if (parsed === null) return "N/A";
  return parsed.toFixed(1);
};

const normalizeResponseItems = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
};

const isOpenNow = (garage) => Boolean(garage?.isOpen ?? garage?.is_open);

const getServiceSummary = (serviceEntry = {}) => {
  const services = Array.isArray(serviceEntry.services) ? serviceEntry.services : [];
  const activeServices = services.filter((service) => service.is_active !== false);
  const prices = activeServices
    .map((service) => toNumber(service.base_price))
    .filter((price) => price !== null);

  return {
    services: activeServices,
    count: activeServices.length,
    minPrice: prices.length > 0 ? Math.min(...prices) : null
  };
};

const rankGarage = (garage, mode, serviceEntry = {}) => {
  const distance = toNumber(garage?.distance_km);
  const rating = toNumber(garage?.rating) ?? 0;
  const score = toNumber(garage?.score_global) ?? 0;
  const serviceSummary = getServiceSummary(serviceEntry);
  const price = serviceSummary.minPrice;
  const availabilityRank = isOpenNow(garage) ? 0 : 1;

  const distanceRank = distance === null ? Number.POSITIVE_INFINITY : distance;
  const priceRank = price === null ? Number.POSITIVE_INFINITY : price;

  if (mode === "price") {
    return [priceRank, distanceRank, -rating, -score];
  }

  if (mode === "rating") {
    return [-rating, distanceRank, priceRank, -score];
  }

  if (mode === "fast") {
    return [availabilityRank, distanceRank, -rating, priceRank, -score];
  }

  if (mode === "services") {
    return [-serviceSummary.count, -rating, priceRank, distanceRank, -score];
  }

  if (mode === "pieces") {
    return [distanceRank, priceRank, -rating, -score];
  }

  return [distanceRank, -rating, priceRank, -score];
};

const compareTuple = (a = [], b = []) => {
  const maxLength = Math.max(a.length, b.length);
  for (let index = 0; index < maxLength; index += 1) {
    const left = a[index] ?? 0;
    const right = b[index] ?? 0;

    if (left < right) return -1;
    if (left > right) return 1;
  }

  return 0;
};

const getCompatibilityScore = (piece, vehicle) => {
  if (!piece) return 0;

  const vehicleModel = normalize(vehicle?.modele || vehicle?.model || vehicle?.vehicle_model);
  const vehicleBrand = normalize(vehicle?.marque || vehicle?.brand);
  const vehicleType = normalize(vehicle?.type || vehicle?.vehicle_type);
  const pieceModel = normalize(piece?.modele);
  const pieceBrand = normalize(piece?.marque);
  const pieceCategory = normalize(piece?.categorie);
  const pieceName = normalize(piece?.nom);

  let score = 0;

  if (pieceBrand && vehicleBrand && pieceBrand.includes(vehicleBrand)) score += 40;
  if (pieceModel && vehicleModel && (pieceModel.includes(vehicleModel) || vehicleModel.includes(pieceModel))) score += 45;
  if (pieceCategory && vehicleType && pieceCategory.includes(vehicleType)) score += 15;
  if (pieceName && vehicleModel && pieceName.includes(vehicleModel)) score += 10;
  if (toNumber(piece.stock) > 0) score += 10;

  return score;
};

const getCompatibilityLabel = (score) => {
  if (score >= 70) return "Compatible";
  if (score >= 35) return "Compatibilité estimée";
  return "Suggestion";
};

const getRecommendationReason = (mode, card) => {
  const garage = card?.bestGarage || {};
  const priceLabel = formatMoney(card?.bestPrice);
  const distanceLabel = formatDistance(garage?.distance_km);
  const ratingLabel = formatRating(garage?.rating);

  if (mode === "price") {
    return card.bestPrice === null
      ? "Tarif à confirmer avec le garage."
      : `Meilleur rapport qualité/prix détecté à ${priceLabel}.`;
  }

  if (mode === "rating") {
    return `Garage mieux noté à ${ratingLabel}/5 par la communauté.`;
  }

  if (mode === "fast") {
    return isOpenNow(garage)
      ? "Garage ouvert et prêt à prendre en charge la demande."
      : "Garage disponible sur rendez-vous rapide.";
  }

  if (mode === "pieces") {
    const firstPiece = card.compatiblePieces?.[0];
    return firstPiece
      ? `La pièce ${firstPiece.nom} est compatible avec votre véhicule.`
      : "Pièces adaptées proposées selon le catalogue disponible.";
  }

  if (mode === "services") {
    return card.serviceCount > 0
      ? `${card.serviceCount} service(s) recommandés à partir de ${priceLabel}.`
      : "Services recommandés selon le profil du garage.";
  }

  return `Garage proche à ${distanceLabel} avec une note de ${ratingLabel}/5.`;
};

const RecommendationsAssistant = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("nearby");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [pieces, setPieces] = useState([]); // kept for minimal display if needed later
  const garageServiceMap = {};
  const compatiblePieces = [];
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [reloadSeed, setReloadSeed] = useState(0);

  useEffect(() => {
    setPage(1);
    setSelectedCardId(null);
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        // Map UI tabs to backend-supported sort keys
        const sortByMap = {
          nearby: 'distance',
          rating: 'score',
          fast: 'urgence',
          default: 'urgence'
        };

        const sortBy = sortByMap[activeTab] || sortByMap.default;

        const recommendationResponse = await getDynamicRecommendations({ page: 1, limit: 40, sortBy, order: 'desc' });
        const recommendationPayload = recommendationResponse.data?.data ?? recommendationResponse.data ?? {};
        const recommendationItems = normalizeResponseItems(recommendationPayload);

        if (!isMounted) return;

        setRecommendations(recommendationItems);
      } catch (fetchError) {
        const apiErrors = fetchError.response?.data?.errors;
        const details = Array.isArray(apiErrors) ? apiErrors.join(" | ") : "";
        setError(details || fetchError.response?.data?.message || "Erreur lors du chargement des recommandations.");
        setRecommendations([]);
        setPieces([]);
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
  }, [reloadSeed, activeTab]);

  const primaryVehicle = recommendations[0]?.vehicle || null;

  const recommendationCards = useMemo(() => {
    return (recommendations || []).map((item, index) => {
      const garages = Array.isArray(item.garages) ? item.garages.filter(Boolean) : [];
      const bestGarage = garages[0] || null;
      const vehicle = item.vehicle || {};
      const reasons = Array.isArray(item.reasons) ? item.reasons.filter(Boolean) : [];
      const recommendationSummary = item.recommendationSummary || item.explanation?.recommendationSummary || "Option secondaire";
      const finalScore = Number(item.finalScore ?? item.explanation?.finalScore ?? item?.intervention?.score ?? 0);

      return {
        id: `${vehicle?.id || 'vehicle'}-${item.intervention?.id || index}`,
        item,
        vehicle,
        bestGarage,
        garages,
        reasons,
        recommendationSummary,
        finalScore,
        recommendationReason: recommendationSummary
      };
    }).filter((card) => card.bestGarage);
  }, [recommendations]);

  const totalPages = Math.max(1, Math.ceil(recommendationCards.length / PAGE_SIZE));
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;
  const pageCards = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return recommendationCards.slice(startIndex, startIndex + PAGE_SIZE);
  }, [recommendationCards, page]);

  const comparisonRows = useMemo(() => {
    return pageCards.slice(0, 5).map((card, index) => ({
      id: `${card.id}-${index}`,
      garage: card.bestGarage?.name || "Garage",
      price: null,
      distance: card.bestGarage?.distance_km,
      rating: card.bestGarage?.rating,
      availability: isOpenNow(card.bestGarage) ? "Disponible" : "Sur rendez-vous"
    }));
  }, [pageCards]);

  const visibleServices = [];

  const stats = useMemo(() => {
    const garageCount = recommendationCards.length;
    const offerCount = 0;
    const todayServicesCount = recommendationCards.filter((card) => isOpenNow(card.bestGarage)).length;
    const compatiblePiecesCount = 0;

    return [
      {
        label: "Garages recommandés",
        value: garageCount,
        icon: MapPin,
        tone: "from-sky-50 to-white"
      },
      {
        label: "Meilleures offres",
        value: offerCount,
        icon: BadgeDollarSign,
        tone: "from-emerald-50 to-white"
      },
      {
        label: "Services aujourd'hui",
        value: todayServicesCount,
        icon: Clock3,
        tone: "from-amber-50 to-white"
      },
      {
        label: "Pièces compatibles",
        value: compatiblePiecesCount,
        icon: Package,
        tone: "from-violet-50 to-white"
      }
    ];
  }, [recommendationCards, compatiblePieces]);

  const activeTabMeta = ASSISTANT_TABS.find((tab) => tab.id === activeTab) || ASSISTANT_TABS[0];

  const handleReload = () => {
    setReloadSeed((value) => value + 1);
  };

  const handleReset = () => {
    setActiveTab("nearby");
    setPage(1);
    setSelectedCardId(null);
  };

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef3fb_100%)]">
        <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-5 sm:px-6 sm:py-6">
        <section className="overflow-hidden rounded-[32px] border border-white/80 bg-white/90 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
                <Sparkles className="h-3.5 w-3.5" />
                Assistant intelligent
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  Recommandations dynamiques
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                  La page agit comme un véritable assistant de décision pour l'automobiliste: elle compare les garages,
                  identifie les pièces compatibles, met en avant les meilleurs prix et propose des actions rapides.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleReload}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Actualiser
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/automobiliste/garages")}
                  className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
                >
                  Voir les garages
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/automobiliste/appointments")}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <CalendarClock className="h-4 w-4" />
                  Prendre rendez-vous
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(37,99,235,0.86))] p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">Véhicule principal</p>
                  <h2 className="mt-2 text-2xl font-black">
                    {primaryVehicle?.modele || primaryVehicle?.type || "Votre véhicule"}
                  </h2>
                  <p className="mt-1 text-sm text-white/80">
                    {primaryVehicle?.matricule || "Aucun matricule renseigné"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/12 px-4 py-3 text-right backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/70">Mode actuel</p>
                  <p className="mt-1 font-bold">{activeTabMeta.label}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-white/70">Assistant</p>
                  <p className="mt-1 font-semibold">Comparaison & suggestion</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-white/70">Actions rapides</p>
                  <p className="mt-1 font-semibold">Garage, pièce, rendez-vous</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className={`rounded-[24px] border border-white/80 bg-gradient-to-br ${stat.tone} p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)]`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{stat.value}</p>
                  </div>
                  <div className="rounded-2xl bg-white/90 p-3 text-slate-700 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Filtrage intelligent</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">{activeTabMeta.label}</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">{activeTabMeta.hint}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Columns3 className="h-4 w-4" />
                Réinitialiser
              </button>
              <button
                type="button"
                onClick={() => navigate("/vendeur/comparaison")}
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                <BadgeDollarSign className="h-4 w-4" />
                Comparer les prix
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {ASSISTANT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${isActive ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/15" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
                  aria-pressed={isActive}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
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
            Chargement des recommandations intelligentes...
          </div>
        ) : recommendationCards.length === 0 ? (
          <section className="overflow-hidden rounded-[32px] border border-dashed border-slate-300 bg-white/90 p-8 text-center shadow-sm">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                <CarFront className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Aucune recommandation disponible</h3>
                <p className="text-sm leading-6 text-slate-600">
                  Ajoutez un véhicule ou explorez les garages pour générer des recommandations plus pertinentes et des pièces adaptées.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/automobiliste/garages")}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Rechercher des garages
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/profil")}
                  className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                >
                  <CarFront className="h-4 w-4" />
                  Ajouter un véhicule
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.32fr_0.88fr]">
            <section className="space-y-4">
                {pageCards.map((card) => {
                const garage = card.bestGarage || {};
                const isSelected = selectedCardId === card.id;
                const serviceItems = [];
                const mainPrice = card.bestPrice ?? null;
                const distance = garage.distance_km;
                const score = Number(card.item?.intervention?.score ?? 0);
                const compatibilityChips = (card.compatiblePieces || []).slice(0, 3);

                return (
                  <article
                    key={card.id}
                    className={`overflow-hidden rounded-[30px] border bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition duration-200 ${isSelected ? "border-sky-300 ring-2 ring-sky-100" : "border-white/80"}`}
                  >
                    <div className="h-1.5 bg-[linear-gradient(90deg,_#0f172a,_#38bdf8,_#22c55e)]" />
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
                              <Sparkles className="h-3.5 w-3.5" />
                              {activeTabMeta.label}
                            </span>
                            {isOpenNow(garage) && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Disponible aujourd'hui
                              </span>
                            )}
                          </div>

                          <div>
                            <h3 className="text-2xl font-black text-slate-900">
                              {card.item?.intervention?.type || "Service recommandé"}
                            </h3>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                              {card.recommendationSummary}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              Véhicule: {card.vehicle?.modele || card.vehicle?.type || "-"}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              Score final: {Number.isFinite(card.finalScore) ? card.finalScore.toFixed(1) : score.toFixed(0)}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              {card.serviceCount || 0} service(s)
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              {(card.compatiblePieces || []).length} pièce(s) liée(s)
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {(card.reasons || []).slice(0, 4).map((reason) => (
                              <span
                                key={reason}
                                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="grid min-w-[260px] grid-cols-2 gap-3 rounded-[24px] bg-slate-50 p-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Garage</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{garage.name || "Garage recommandé"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Distance</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{formatDistance(distance)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Prix estimé</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{formatMoney(mainPrice)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Rating</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">
                              ⭐ {formatRating(garage.rating)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Disponibilité</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {isOpenNow(garage) ? "Ouvert maintenant" : "Sur rendez-vous"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Service recommandé</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {card.item?.intervention?.type || "Entretien ciblé"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Prix du service</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {mainPrice !== null ? `${mainPrice.toFixed(0)} DT` : "À confirmer"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-slate-900">Comparer les solutions</p>
                              <p className="text-xs text-slate-500">Prix, distance, avis et disponibilité</p>
                            </div>
                            <Columns3 className="h-4 w-4 text-slate-400" />
                          </div>
                          <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="min-w-full text-sm">
                              <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                  <th className="px-3 py-2 text-left">Garage</th>
                                  <th className="px-3 py-2 text-left">Prix</th>
                                  <th className="px-3 py-2 text-left">Distance</th>
                                  <th className="px-3 py-2 text-left">Rating</th>
                                  <th className="px-3 py-2 text-left">Dispo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {card.garages.slice(0, 4).map((garageRow) => {
                                  const garageService = { minPrice: null };

                                  return (
                                    <tr key={garageRow.id} className="border-t border-slate-100">
                                      <td className="px-3 py-2 font-medium text-slate-900">{garageRow.name || "Garage"}</td>
                                      <td className="px-3 py-2">{formatMoney(garageService.minPrice)}</td>
                                      <td className="px-3 py-2">{formatDistance(garageRow.distance_km)}</td>
                                      <td className="px-3 py-2">⭐ {formatRating(garageRow.rating)}</td>
                                      <td className="px-3 py-2">{isOpenNow(garageRow) ? "Ouvert" : "RDV"}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                          <div>
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-slate-900">Pièces compatibles</p>
                                <p className="text-xs text-slate-500">Compatibilité estimée pour ce véhicule</p>
                              </div>
                              <Package className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="space-y-2">
                              {compatibilityChips.length > 0 ? (
                                compatibilityChips.map((piece) => (
                                  <div key={piece.id} className="rounded-2xl border border-white bg-white p-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-900">{piece.nom}</p>
                                        <p className="text-xs text-slate-500">
                                          {piece.marque || "Marque"} · {piece.modele || "Modèle"}
                                        </p>
                                      </div>
                                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
                                        {piece.compatibilityLabel}
                                      </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                                      <span className="rounded-full bg-slate-100 px-2.5 py-1">{formatMoney(piece.prix_unitaire)}</span>
                                      <span className="rounded-full bg-slate-100 px-2.5 py-1">Stock {piece.stock ?? 0}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                                  Aucune pièce explicitement compatible détectée pour cette recommandation.
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="mb-2 text-sm font-bold text-slate-900">Services recommandés</p>
                            <div className="space-y-2">
                              {serviceItems.length > 0 ? (
                                serviceItems.map((service) => (
                                  <div key={service.id} className="rounded-2xl border border-white bg-white px-3 py-2 shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-sm font-medium text-slate-900">{service.name}</span>
                                      <span className="text-xs font-semibold text-emerald-700">
                                        {service.base_price !== null && service.base_price !== undefined
                                          ? `${Number(service.base_price).toFixed(0)} DT`
                                          : "Tarif à confirmer"}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                                  Aucun service détaillé chargé pour ce garage.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => navigate("/automobiliste/garages")}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Voir garage
                          <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/automobiliste/appointments")}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          <CalendarClock className="h-4 w-4" />
                          Prendre rendez-vous
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/vendeur/catalogue")}
                          className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Acheter pièce
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/vendeur/comparaison")}
                          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
                        >
                          <TrendingUp className="h-4 w-4" />
                          Comparer prix
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedCardId((prev) => (prev === card.id ? null : card.id))}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <BadgeInfo className="h-4 w-4" />
                          {selectedCardId === card.id ? "Masquer les détails" : "Voir détails"}
                        </button>
                      </div>

                      {selectedCardId === card.id && (
                        <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                          <div className="grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Résumé</p>
                              <p className="mt-2 text-sm font-semibold text-slate-900">{card.recommendationSummary}</p>
                            </div>
                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Score final</p>
                              <p className="mt-2 text-3xl font-black text-slate-900">
                                {Number.isFinite(card.finalScore) ? card.finalScore.toFixed(1) : score.toFixed(0)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">Score global calculé à partir de l'intervention et du garage retenu.</p>
                            </div>
                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Raisons clés</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(card.reasons || []).length > 0 ? (
                                  card.reasons.map((reason) => (
                                    <span key={reason} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                      {reason}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-slate-500">Aucune raison détaillée disponible.</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedCardId === card.id && (
                        <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                          <p className="text-sm font-bold text-slate-900">Détail du scoring</p>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Intervention (backend)</p>
                              <div className="mt-2 text-sm text-slate-700">
                                {card.item?.intervention?.score_breakdown ? (
                                  <dl className="space-y-2">
                                    <div className="flex justify-between">
                                      <dt className="text-xs text-slate-500">Kilométrage</dt>
                                      <dd className="font-medium">{card.item.intervention.score_breakdown.kmScorePercent ?? 'N/A'}% · {card.item.intervention.score_breakdown.kmContribution ?? 'N/A'} pts</dd>
                                    </div>
                                    <div className="flex justify-between">
                                      <dt className="text-xs text-slate-500">Date dernière intervention</dt>
                                      <dd className="font-medium">{card.item.intervention.score_breakdown.dateScorePercent ?? 'N/A'}% · {card.item.intervention.score_breakdown.dateContribution ?? 'N/A'} pts</dd>
                                    </div>
                                    <div className="flex justify-between">
                                      <dt className="text-xs text-slate-500">Type véhicule (mult)</dt>
                                      <dd className="font-medium">x{card.item.intervention.score_breakdown.vehicleTypeMultiplier ?? 'N/A'} · {card.item.intervention.score_breakdown.typeContribution ?? 'N/A'} pts</dd>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                      <dt className="text-xs text-slate-500">Total (intervention)</dt>
                                      <dd className="font-semibold">{card.item.intervention.score_breakdown.total ?? 'N/A'}</dd>
                                    </div>
                                  </dl>
                                ) : (
                                  <p className="text-sm text-slate-500">Aucun détail disponible.</p>
                                )}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-white p-4 shadow-sm">
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Garage (backend)</p>
                              <div className="mt-2 text-sm text-slate-700">
                                {card.bestGarage?.score_breakdown ? (
                                  <dl className="space-y-2">
                                    <div className="flex justify-between">
                                      <dt className="text-xs text-slate-500">Distance</dt>
                                      <dd className="font-medium">{card.bestGarage.score_breakdown.distanceKm ?? 'N/A'} km · {card.bestGarage.score_breakdown.distanceScore0to10 ?? 'N/A'}/10 ({card.bestGarage.score_breakdown.distanceContribution ?? 'N/A'} pts)</dd>
                                    </div>
                                    <div className="flex justify-between">
                                      <dt className="text-xs text-slate-500">Rating</dt>
                                      <dd className="font-medium">{card.bestGarage.score_breakdown.ratingScore0to10 ?? 'N/A'}/10 · {card.bestGarage.score_breakdown.ratingContribution ?? 'N/A'} pts</dd>
                                    </div>
                                    <div className="flex justify-between">
                                      <dt className="text-xs text-slate-500">Disponibilité</dt>
                                      <dd className="font-medium">{card.bestGarage.score_breakdown.availabilityScore0to10 ?? 'N/A'}/10 · {card.bestGarage.score_breakdown.availabilityContribution ?? 'N/A'} pts</dd>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                      <dt className="text-xs text-slate-500">Total (garage)</dt>
                                      <dd className="font-semibold">{card.bestGarage.score_breakdown.total ?? 'N/A'}</dd>
                                    </div>
                                  </dl>
                                ) : (
                                  <p className="text-sm text-slate-500">Aucun détail disponible.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>

            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Comparaison</p>
                    <h3 className="mt-1 text-lg font-black text-slate-900">Top garages</h3>
                  </div>
                  <Columns3 className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left">Garage</th>
                        <th className="px-3 py-2 text-left">Prix</th>
                        <th className="px-3 py-2 text-left">Distance</th>
                        <th className="px-3 py-2 text-left">Rating</th>
                        <th className="px-3 py-2 text-left">Dispo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.length > 0 ? (
                        comparisonRows.map((row) => (
                          <tr key={row.id} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-medium text-slate-900">{row.garage}</td>
                            <td className="px-3 py-2">{formatMoney(row.price)}</td>
                            <td className="px-3 py-2">{formatDistance(row.distance)}</td>
                            <td className="px-3 py-2">⭐ {formatRating(row.rating)}</td>
                            <td className="px-3 py-2">{row.availability}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-3 py-5 text-center text-slate-500" colSpan={5}>
                            Aucune comparaison disponible.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Pièces compatibles</p>
                    <h3 className="mt-1 text-lg font-black text-slate-900">Suggestions clés</h3>
                  </div>
                  <Package className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-4 space-y-3">
                  {compatiblePieces.length > 0 ? (
                    compatiblePieces.slice(0, 6).map((piece) => (
                      <div key={piece.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{piece.nom}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {piece.marque || "Marque"} · {piece.modele || "Modèle"} · {piece.categorie || "Catégorie"}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-sky-700 shadow-sm">
                            {piece.compatibilityLabel}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">{formatMoney(piece.prix_unitaire)}</span>
                          <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">Stock {piece.stock ?? 0}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      Aucune pièce compatible n'a été détectée pour ce véhicule.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Services recommandés</p>
                    <h3 className="mt-1 text-lg font-black text-slate-900">Aujourd'hui</h3>
                  </div>
                  <Wrench className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-4 space-y-3">
                  {visibleServices.length > 0 ? (
                    visibleServices.map((service) => (
                      <div key={service.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                            <p className="mt-1 text-xs text-slate-500">Durée: {service.duration_minutes || "-"} min</p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                            {service.base_price !== null && service.base_price !== undefined
                              ? `${Number(service.base_price).toFixed(0)} DT`
                              : "Tarif à confirmer"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      Les services recommandés apparaîtront ici dès qu'un garage est sélectionné.
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(37,99,235,0.86))] p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Conseil intelligent</p>
                    <h3 className="mt-1 text-lg font-black">Solution personnalisée</h3>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-white/80">
                  Cette page met en avant les meilleures options plutôt que les alertes brutes: proximité, tarifs,
                  avis, disponibilité et compatibilité pièces.
                </p>

                <div className="mt-4 grid gap-2 text-sm">
                  <div className="rounded-2xl bg-white/10 px-3 py-2">• Voir le garage recommandé</div>
                  <div className="rounded-2xl bg-white/10 px-3 py-2">• Comparer les prix et la distance</div>
                  <div className="rounded-2xl bg-white/10 px-3 py-2">• Lancer un rendez-vous ou acheter la pièce</div>
                </div>
              </section>
            </aside>
          </div>
        )}

        {!loading && recommendationCards.length > 0 && (
          <div className="flex flex-col gap-3 rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)] md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-600">
              Total: <span className="font-semibold text-slate-900">{recommendationCards.length}</span> recommandations intelligentes
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => canGoPrev && setPage((value) => value - 1)}
                disabled={!canGoPrev}
                className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="text-sm font-medium text-slate-700">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => canGoNext && setPage((value) => value + 1)}
                disabled={!canGoNext}
                className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </PlatformLayout>
  );
};

export default RecommendationsAssistant;
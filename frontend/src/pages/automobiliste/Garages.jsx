import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { CalendarCheck2, Clock3, MapPin, Navigation, Share2, Star } from "lucide-react";
import PlatformLayout from "../../components/PlatformLayout";
import GoogleMapGarages from "../../components/GoogleMapGarages";
import {
  createGarageReview,
  deleteGarageReview,
  getGarageById,
  getReviewsByGarage,
  getServicesByGarage,
  listGarages,
  updateGarageReview
} from "../../services/garage";
import { AuthContext } from "../../context/AuthContext";
import { formatDistance, getDistanceColor, getDistanceLabel } from "../../utils/distanceCalculator";

const getPayload = (response) => response?.data?.data ?? response?.data;
const fallbackCenter = { lat: 35.8256, lng: 10.6369 };

const featuredGarages = [
  {
    id: "featured-le-mecano-diag",
    name: "LE MECANO DIAG",
    adresse: "Sousse",
    city: "Sousse",
    latitude: 35.8256,
    longitude: 10.6369,
    rating: 4.7,
    note: "Garage ajouté manuellement à la carte"
  },
  {
    id: "featured-gargouri-auto",
    name: "GARGOURI AUTO",
    adresse: "Houmt Souk, Djerba",
    city: "Houmt Souk, Djerba",
    latitude: 33.875,
    longitude: 10.857,
    rating: 4.6,
    note: "Garage ajouté manuellement à la carte"
  }
];

const garageBrandsCatalog = [
  "Audi", "BMW", "BYD", "Changan", "Chery", "Chevrolet", "Citroen", "Cupra",
  "Daewoo", "Dacia", "DFM", "FAW", "Fiat", "Ford", "Foton", "Geely", "Great Wall",
  "Haval", "Honda", "Hyundai", "Isuzu", "JAC", "Jeep", "Kia", "Lada", "Land Rover",
  "Lexus", "Mahindra", "Mazda", "Mercedes", "MG", "Mitsubishi", "Nissan", "Opel",
  "Peugeot", "Porsche", "Renault", "Seat", "Skoda", "SsangYong", "Suzuki", "Tesla",
  "Toyota", "Volkswagen", "Volvo"
].sort((a, b) => a.localeCompare(b));

const garageSpecialtyCatalog = [
  "Mécanique générale",
  "Tôlerie et Peinture",
  "Électricité auto",
  "Services pneumatiques",
  "Diagnostic auto",
  "Services rapides",
  "Vitrage auto",
  "Climatisation auto",
  "Clé et multimédia",
  "Sellerie auto",
  "Maintenance Calculateurs",
  "Tourneur",
  "Spécialiste crémaillère",
  "Spécialiste radiateur",
  "Spécialiste injection",
  "Échappement / catalyseur",
  "Optiques auto",
  "Spécialiste boîtes de vitesses",
  "Conversions véhicules",
  "Tuning auto",
  "Station lavage",
  "Vente pièces auto neuves",
  "Vente pièces détachées d’occasion",
  "Vente accessoires",
  "Station service",
  "Expert automobile",
  "Auto-école",
  "Centre contrôle technique",
  "Concessionnaire auto neuf",
  "Concessionnaire auto occasion",
  "Remorquage et dépannage",
  "Leasing",
  "Vente de motos & Pièces détachées",
  "Entretien & réparation Moto",
  "Personnalisation & préparation Moto"
];

const garageServicesCatalog = [
  "Réparation moteur", "Entretien mécanique", "Remplacement moteur", "Spécialiste camion",
  "Débosselage et carrosserie", "Peinture au four", "Lustrage et polissage", "Peinture jantes",
  "Diagnostic électrique", "Alternateur / Démarreur", "Batterie", "Câblage et fusibles",
  "Montage et équilibrage", "Parallélisme / Géométrie", "Réparation crevaison", "Gonflage azote",
  "Passage à la valise", "Lecture/Effacement défauts", "Programmation calculateurs", "Test de composants",
  "Vidange et filtres", "Freinage (Plaquettes/Disques)", "Amortisseurs", "Révision saisonnière",
  "Remplacement pare-brise", "Réparation d'impact", "Vitres teintées / Film solaire", "Rénovation optiques",
  "Recharge climatisation", "Détection de fuites", "Remplacement compresseur", "Traitement antibactérien",
  "Double de clé / Programmation", "Installation autoradio / Écrans", "Caméra de recul", "Alarmes",
  "Sellerie intérieure", "Réparation sièges", "Rénovation cuir", "Housses sur mesure",
  "Diagnostic ECU", "Reprogrammation", "Réparation ECU", "Codage modules",
  "Usinage pièces", "Fabrication sur mesure", "Rectification", "Ajustement",
  "Réparation crémaillère", "Remplacement crémaillère", "Réglage direction", "Diagnostic direction",
  "Réparation radiateur", "Nettoyage circuit", "Remplacement radiateur", "Purge système",
  "Nettoyage injecteurs", "Test injecteurs", "Remplacement injecteurs", "Codage injecteurs",
  "Réparation ligne échappement", "Remplacement catalyseur", "Soudure échappement", "Diagnostic pollution",
  "Rénovation phares", "Remplacement optiques", "Polissage optiques", "Réglage feux",
  "Réparation boîte manuelle", "Réparation boîte automatique", "Vidange boîte", "Diagnostic transmission",
  "Passage au GPL / Éthanol", "Aménagement utilitaire", "Adaptation handicap", "Conversion électrique",
  "Kit carrosserie", "Rabaissement (Combinés filetés)", "Éclairage personnalisé", "Optimisation performance",
  "Lavage haute pression", "Nettoyage intérieur / Shampoing", "Lavage moteur", "Traitement céramique",
  "Pièces moteur", "Consommables (Filtres/Freins)", "Lubrifiants", "Outillage",
  "Pièces de casse auto", "Moteurs d'occasion", "Portières / Capots", "Jantes occasion",
  "Tapis et housses", "Coffres de toit", "Produits d'entretien", "Gadgets auto",
  "Carburant (Essence/Diesel)", "Gonflage pneus", "Boutique de dépannage", "Lavage automatique",
  "Expertise après sinistre", "Estimation valeur véhicule", "Conseil à l'achat", "Litiges mécaniques",
  "Permis B (Voiture)", "Code de la route", "Conduite accompagnée", "Perfectionnement",
  "Visite périodique", "Contre-visite", "Contrôle pollution", "Contrôle spécifique (VTC/Taxi)",
  "Vente véhicules neufs", "Essai routier", "Reprise ancien véhicule", "Financement / Garantie",
  "Vente occasions révisées", "Garantie occasion",
  "Dépannage sur place", "Remorquage 24h/24", "Transport longue distance", "Sortie de fourrière",
  "Location Longue Durée (LLD)", "LOA (Location avec Option d'Achat)", "Gestion de flotte", "Location courte durée",
  "Vente motos", "Pièces détachées moto", "Accessoires motard", "Casques et équipements",
  "Révision moto", "Pneumatiques moto", "Kit chaîne et carburation", "Entretien mécanique moto",
  "Personnalisation moto", "Préparation moteur", "Aménagement esthétique"
];

const defaultFilterOptions = {
  brands: garageBrandsCatalog,
  specialties: garageSpecialtyCatalog,
  services: garageServicesCatalog,
  openModes: ["Ouvert maintenant"],
  displacements: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
};

const mergeUniqueValues = (primary = [], secondary = []) =>
  Array.from(new Set([...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])]));

const initialReviewForm = {
  rating: 5,
  comment: ""
};

const getMarqueInitials = (marque) =>
  marque
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

const slugifyLogoName = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const brandLogoDomains = {
  Audi: "audi.com",
  BMW: "bmw.com",
  BYD: "byd.com",
  Changan: "changan.com",
  Chery: "cheryinternational.com",
  Chevrolet: "chevrolet.com",
  Citroen: "citroen.com",
  "Citroën": "citroen.com",
  Cupra: "cupraofficial.com",
  Daewoo: "daewoo.com",
  Dacia: "dacia.com",
  DFM: "dfmc.com.cn",
  FAW: "faw.com",
  Fiat: "fiat.com",
  Ford: "ford.com",
  Foton: "foton-global.com",
  Geely: "geely.com",
  "Great Wall": "gwm-global.com",
  Haval: "haval.com",
  Honda: "honda.com",
  Hyundai: "hyundai.com",
  Isuzu: "isuzu.com",
  JAC: "jac.com.cn",
  Jeep: "jeep.com",
  Kia: "kia.com",
  Lada: "lada.ru",
  "Land Rover": "landrover.com",
  MG: "mgmotor.eu",
  Mitsubishi: "mitsubishi-motors.com",
  Nissan: "nissan-global.com",
  Peugeot: "peugeot.com",
  Renault: "renault.com",
  "Rolls-Royce": "rolls-roycemotorcars.com",
  Seat: "seat.com",
  Skoda: "skoda-auto.com",
  Suzuki: "suzuki.com",
  Tesla: "tesla.com",
  Toyota: "toyota.com",
  Volkswagen: "volkswagen.com",
  Volvo: "volvocars.com",
  Wuling: "wuling.com",
  Xpeng: "xiaopeng.com",
  Zotye: "zotye.com"
};

const getBrandLogoCandidates = (marque) => {
  const slug = slugifyLogoName(marque);
  const normalized = marque.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const fileBaseCandidates = Array.from(new Set([
    slug,
    slug.replace(/-/g, ""),
    normalized,
    normalized.toLowerCase(),
    normalized.replace(/\s+/g, "-"),
    normalized.replace(/\s+/g, "_"),
    normalized.replace(/[\s-]+/g, ""),
    marque,
    marque.toLowerCase()
  ])).filter(Boolean);

  const extensions = ["png", "jpg", "jpeg", "webp", "svg", "PNG", "JPG", "JPEG", "WEBP", "SVG"];
  const localCandidates = fileBaseCandidates.flatMap((base) =>
    extensions.map((ext) => `/logos/marques/${encodeURIComponent(base)}.${ext}`)
  );

  const domain = brandLogoDomains[marque];
  if (!domain) {
    return [...localCandidates, buildMarqueImage(marque)];
  }

  const encodedDomain = encodeURIComponent(domain);
  return [...localCandidates, `https://logo.clearbit.com/${encodedDomain}`, buildMarqueImage(marque)];
};

const buildMarqueImage = (marque) => {
  const initials = getMarqueInitials(marque);
  const paletteIndex = garageBrandsCatalog.indexOf(marque) % 4;
  const top = paletteIndex === 0 ? "#e0f2fe" : paletteIndex === 1 ? "#e0e7ff" : paletteIndex === 2 ? "#ffe4e6" : "#fef3c7";

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='220' viewBox='0 0 320 220'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='${top}'/>
        <stop offset='100%' stop-color='#ffffff'/>
      </linearGradient>
    </defs>
    <rect width='320' height='220' rx='22' fill='url(#g)'/>
    <rect x='24' y='26' width='272' height='116' rx='18' fill='rgba(255,255,255,0.72)'/>
    <text x='160' y='98' text-anchor='middle' font-family='Segoe UI, Arial' font-size='40' font-weight='700' fill='#0f172a'>${initials}</text>
    <text x='160' y='178' text-anchor='middle' font-family='Segoe UI, Arial' font-size='22' font-weight='600' fill='#1f2937'>${marque}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const includesNormalized = (haystack, needle) => {
  if (!needle) return true;
  return normalizeText(haystack).includes(normalizeText(needle));
};

const weekOrder = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const parseScheduleText = (value) => {
  const raw = String(value || "").trim();
  if (!raw) {
    return [];
  }

  const lines = raw
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  const parsed = lines.map((line) => {
    const pipeParts = line.split("|").map((part) => part.trim());
    if (pipeParts.length === 4) {
      const [day, enabled, start, end] = pipeParts;
      return {
        day,
        enabled: enabled === "1" || enabled.toLowerCase() === "true",
        timeLabel: `${start || "08:00"} - ${end || "18:00"}`
      };
    }

    const match = line.match(/^([^:]+):\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (match) {
      const [, day, start, end] = match;
      return {
        day: day.trim(),
        enabled: true,
        timeLabel: `${start} - ${end}`
      };
    }

    return null;
  }).filter(Boolean);

  return parsed.sort((a, b) => weekOrder.indexOf(a.day) - weekOrder.indexOf(b.day));
};

const GaragesPage = () => {
  const { user } = useContext(AuthContext);

  // Filter options state - fetched from API
  const [filterOptions, setFilterOptions] = useState({
    brands: defaultFilterOptions.brands,
    specialties: defaultFilterOptions.specialties,
    services: defaultFilterOptions.services,
    openModes: defaultFilterOptions.openModes,
    displacements: defaultFilterOptions.displacements
  });

  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [openOnly, setOpenOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [selectedMapSpecialty, setSelectedMapSpecialty] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedOpenModes, setSelectedOpenModes] = useState([]);
  const [selectedDeplacements, setSelectedDeplacements] = useState([]);
  const [showBrandsModal, setShowBrandsModal] = useState(false);
  const [showSpecialtiesModal, setShowSpecialtiesModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showDeplacementModal, setShowDeplacementModal] = useState(false);

  const [garages, setGarages] = useState([]);
  const [selectedGarageId, setSelectedGarageId] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [garageServices, setGarageServices] = useState([]);
  const [garageReviews, setGarageReviews] = useState([]);
  const [summary, setSummary] = useState({ reviews_count: 0, average_rating: 0 });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [editingReviewId, setEditingReviewId] = useState(null);

  const [userPosition, setUserPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState(fallbackCenter);
  const hasLoadedInitialFilters = useRef(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const getApiErrorMessage = (err, fallback) => {
    const data = err?.response?.data;
    const details = Array.isArray(data?.error?.details) ? data.error.details : [];

    if (details.length > 0) {
      const message = details
        .map((item) => item?.message)
        .filter(Boolean)
        .join(" | ");
      if (message) {
        return message;
      }
    }

    if (!err?.response) {
      return "Serveur API inaccessible. Vérifiez que le backend tourne sur http://localhost:3000.";
    }

    if (typeof data?.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }

    return fallback;
  };

  // Fetch filter options from backend API on component mount
  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(FILTER_OPTIONS_ENDPOINT);
      if (!response.ok) {
        throw new Error("Failed to fetch filter options");
      }
      const data = await response.json();
      const payload = data?.data || data;
      
      setFilterOptions({
        brands: mergeUniqueValues(defaultFilterOptions.brands, payload?.brands).sort((a, b) => a.localeCompare(b)),
        specialties: mergeUniqueValues(defaultFilterOptions.specialties, payload?.specialties),
        services: mergeUniqueValues(defaultFilterOptions.services, payload?.services),
        openModes: mergeUniqueValues(defaultFilterOptions.openModes, payload?.openModes),
        displacements: defaultFilterOptions.displacements
      });
    } catch (err) {
      console.error("Error fetching filter options:", err);
      setFilterOptions(defaultFilterOptions);
    }
  };

  const clearQuickFilters = () => {
    setSelectedBrand("");
    setSelectedSpecialties([]);
    setSelectedServices([]);
    setSelectedOpenModes([]);
    setSelectedDeplacements([]);
    setOpenOnly(false);
    setMinRating(0);
  };

  const renderFilterButton = (label, count, onClick, disabled = false) => {
    const disabledClass = "border-[#e2e8f0] bg-[#f1f5f9] text-[#cbd5e1] cursor-not-allowed";
    const enabledClass = "border-[#dbe2ec] bg-white text-[#617089] hover:border-orange-300 hover:text-orange-600";
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={disabled ? "Sélectionnez d'abord Marques, Spécialités ou Services" : ""}
        className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${disabled ? disabledClass : enabledClass}`}
      >
        {label}{count > 0 ? ` (${count})` : ""}
      </button>
    );
  };

  const selectedGarage = useMemo(
    () => garages.find((g) => g.id === selectedGarageId) || null,
    [garages, selectedGarageId]
  );

  const garagesForMap = useMemo(() => {
    if (!selectedMapSpecialty) {
      return garages;
    }

    return garages.filter((garage) => {
      const specialtiesText = garage.specialties || garage.store_specialties || "";
      const servicesText = garage.services_catalog || garage.store_services || "";
      return includesNormalized(specialtiesText, selectedMapSpecialty) || includesNormalized(servicesText, selectedMapSpecialty);
    });
  }, [garages, selectedMapSpecialty]);

  const selectedGarageWorkSchedule = useMemo(
    () => parseScheduleText(selectedGarage?.work_hours),
    [selectedGarage?.work_hours]
  );

  const selectedGarageTravelSchedule = useMemo(
    () => parseScheduleText(selectedGarage?.travel_hours),
    [selectedGarage?.travel_hours]
  );

  const toggleSelection = (value, setter) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const toggleBrand = (brand) => {
    setSelectedBrand((current) => (current === brand ? "" : brand));
  };

  // Fetch filter options when component mounts
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPos = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserPosition(nextPos);
        setMapCenter(nextPos);
      },
      () => {
        setUserPosition(null);
        setMapCenter(fallbackCenter);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    fetchGarages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPosition]);

  useEffect(() => {
    if (selectedGarageId) {
      fetchGarageDetails(selectedGarageId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGarageId]);

  useEffect(() => {
    if (!selectedGarageId) {
      return;
    }

    const visible = garagesForMap.some((garage) => garage.id === selectedGarageId);
    if (!visible) {
      setSelectedGarageId(null);
      setGarageServices([]);
      setGarageReviews([]);
    }
  }, [garagesForMap, selectedGarageId]);

  useEffect(() => {
    if (!hasLoadedInitialFilters.current) {
      hasLoadedInitialFilters.current = true;
      return;
    }

    fetchGarages(search.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minRating, openOnly, selectedBrand, selectedSpecialties, selectedServices, selectedDeplacements, userPosition]);

  useEffect(() => {
    const hasOpenSelection = selectedOpenModes.length > 0;
    setOpenOnly(hasOpenSelection);
  }, [selectedOpenModes]);

  const buildGarageFilters = (customSearch) => {
    const trimmedSearch = String(customSearch || "").trim();
    const serviceTerms = [...selectedServices];

    const filters = {
      page: 1,
      limit: 100,
      search: trimmedSearch || undefined,
      minRating: minRating > 0 ? minRating : undefined,
      includeClosed: openOnly ? false : true,
      sortBy: userPosition ? "distance" : "created_at",
      sortOrder: "asc"
    };

    if (selectedBrand) {
      filters.brands = selectedBrand.toLowerCase();
    }

    if (selectedSpecialties.length > 0) {
      filters.specialties = selectedSpecialties.map((term) => term.toLowerCase()).join(",");
    }

    if (serviceTerms.length > 0) {
      filters.services = serviceTerms.map((term) => term.toLowerCase()).join(",");
      filters.serviceMatch = "any";
    }

    if (userPosition) {
      filters.userLat = userPosition.lat;
      filters.userLon = userPosition.lng;
    }

    return filters;
  };

  const fetchGarages = async (customSearch = search.trim()) => {
    setIsLoadingList(true);
    setError("");

    try {
      const response = await listGarages(buildGarageFilters(customSearch));
      const payload = getPayload(response);
      const items = Array.isArray(payload?.items) ? payload.items : [];

      const filteredItems = items.filter((garage) => {
        const brandsText = garage.vehicle_brands || "";
        const specialtiesText = garage.specialties || garage.store_specialties || "";
        const servicesText = garage.services_catalog || garage.store_services || "";
        const serviceNames = Array.isArray(garage.service_names) ? garage.service_names.join(" ") : "";
        const identityText = `${garage.name || ""} ${garage.adresse || ""} ${brandsText} ${specialtiesText} ${servicesText} ${serviceNames}`;

        const matchesBrand = !selectedBrand || includesNormalized(brandsText, selectedBrand) || includesNormalized(identityText, selectedBrand);
        const matchesSpecialties =
          selectedSpecialties.length === 0 ||
          selectedSpecialties.some((specialty) => includesNormalized(specialtiesText, specialty) || includesNormalized(serviceNames, specialty));
        const matchesServices =
          selectedServices.length === 0 ||
          selectedServices.some((service) => includesNormalized(servicesText, service) || includesNormalized(serviceNames, service));
        const travelSchedule = parseScheduleText(garage.travel_hours);
        const availableTravelDays = travelSchedule.filter((entry) => entry.enabled).map((entry) => entry.day);
        // Déplacement is only valid as secondary filter
        const hasOtherFilters = selectedBrand || selectedSpecialties.length > 0 || selectedServices.length > 0;
        const matchesDeplacement = !hasOtherFilters || selectedDeplacements.length === 0 ||
          selectedDeplacements.some((day) => availableTravelDays.includes(day));

        return matchesBrand && matchesSpecialties && matchesServices && matchesDeplacement;
      });

      setGarages(filteredItems);

      if (filteredItems.length > 0) {
        const stillExists = filteredItems.some((garage) => garage.id === selectedGarageId);
        const targetGarageId = stillExists ? selectedGarageId : filteredItems[0].id;
        setSelectedGarageId(targetGarageId);

        const targetGarage = filteredItems.find((garage) => garage.id === targetGarageId);
        if (targetGarage?.latitude !== null && targetGarage?.longitude !== null) {
          setMapCenter({ lat: targetGarage.latitude, lng: targetGarage.longitude });
        }
      } else {
        setSelectedGarageId(null);
        setGarageServices([]);
        setGarageReviews([]);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Erreur lors du chargement des garages."));
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchGarageDetails = async (garageId) => {
    setIsLoadingDetails(true);
    setError("");

    try {
      const [garageRes, servicesRes, reviewsRes] = await Promise.all([
        getGarageById(garageId),
        getServicesByGarage(garageId),
        getReviewsByGarage(garageId, { page: 1, limit: 30 })
      ]);

      const garagePayload = getPayload(garageRes);
      const servicePayload = getPayload(servicesRes);
      const reviewPayload = getPayload(reviewsRes);

      if (garagePayload?.id) {
        setGarages((current) =>
          current.map((item) => (item.id === garagePayload.id ? { ...item, ...garagePayload } : item))
        );
      }

      setGarageServices(Array.isArray(servicePayload?.items) ? servicePayload.items : []);
      setGarageReviews(Array.isArray(reviewPayload?.items) ? reviewPayload.items : []);
      setSummary(reviewPayload?.summary || { reviews_count: 0, average_rating: 0 });

      const myReview = (reviewPayload?.items || []).find((review) => Number(review.user_id) === Number(user?.id));
      if (myReview) {
        setReviewForm({ rating: Number(myReview.rating), comment: myReview.comment || "" });
        setEditingReviewId(myReview.id);
      } else {
        setReviewForm(initialReviewForm);
        setEditingReviewId(null);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Erreur lors du chargement des détails du garage."));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    await fetchGarages(search.trim());
  };

  const handleApplyFilters = async () => {
    await fetchGarages(search.trim());
  };

  const handleSelectGarage = (garage) => {
    setSelectedGarageId(garage.id);
    if (garage.latitude !== null && garage.longitude !== null) {
      setMapCenter({ lat: garage.latitude, lng: garage.longitude });
    }
  };

  const handleMarkerClick = (garageId) => {
    if (!garageId) {
      setSelectedGarageId(null);
      return;
    }

    const clickedGarage = garagesForMap.find((item) => item.id === garageId) || garages.find((item) => item.id === garageId);
    if (!clickedGarage) {
      return;
    }

    handleSelectGarage(clickedGarage);
  };

  const handleOpenDirections = () => {
    if (!selectedGarage) {
      return;
    }

    const destinationText = [selectedGarage.name, selectedGarage.adresse]
      .filter(Boolean)
      .join(", ")
      .trim();
    const destination = destinationText || (selectedGarage.latitude !== null && selectedGarage.longitude !== null
      ? `${selectedGarage.latitude},${selectedGarage.longitude}`
      : "");

    if (!destination) {
      return;
    }

    const origin = userPosition ? `${userPosition.lat},${userPosition.lng}` : "";
    const url = origin
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleBookAppointment = () => {
    if (!selectedGarage?.telephone) {
      return;
    }

    window.location.href = `tel:${selectedGarage.telephone}`;
  };

  const handleShareGarage = async () => {
    if (!selectedGarage) {
      return;
    }

    const shareData = {
      title: selectedGarage.name,
      text: `${selectedGarage.name} - ${selectedGarage.adresse || "Garage"}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} | ${shareData.url}`);
        setSuccessMessage("Lien du garage copié.");
      }
    } catch {
      // Ignore cancel and unsupported share errors silently.
    }
  };

  const handleReviewFieldChange = (event) => {
    const { name, value } = event.target;
    setReviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!selectedGarageId) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment || null
      };

      if (editingReviewId) {
        await updateGarageReview(selectedGarageId, editingReviewId, payload);
        setSuccessMessage("Votre avis a ete mis a jour.");
      } else {
        await createGarageReview(selectedGarageId, payload);
        setSuccessMessage("Votre avis a ete ajoute.");
      }

      await fetchGarageDetails(selectedGarageId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible d'enregistrer votre avis."));
    }
  };

  const handleDeleteMyReview = async () => {
    if (!selectedGarageId || !editingReviewId) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      await deleteGarageReview(selectedGarageId, editingReviewId);
      setSuccessMessage("Votre avis a ete supprime.");
      setReviewForm(initialReviewForm);
      setEditingReviewId(null);
      await fetchGarageDetails(selectedGarageId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de supprimer votre avis."));
    }
  };

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef3fb_100%)]">
        <div className="mx-auto max-w-[1400px] px-4 py-5 space-y-5 sm:px-6 sm:py-6">
          <header className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.95)_0%,rgba(239,246,255,0.95)_100%)] px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:px-6 sm:py-6">
            <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-blue-100/70 blur-3xl" />
            <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-orange-100/70 blur-3xl" />
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
                  Compte automobiliste
                </span>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-[#10243f] sm:text-4xl">Carte des garages</h1>
                <p className="mt-2 max-w-3xl text-sm text-[#5b6f8f] sm:text-[15px]">
                  Trouvez rapidement le bon garage autour de vous avec des filtres précis, une carte interactive et les avis clients.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-[#dbe7fb] bg-white/90 px-4 py-3 text-center shadow-sm">
                  <p className="text-xs font-semibold text-[#64748b]">Résultats</p>
                  <p className="text-lg font-extrabold text-[#1e3a8a]">{garages.length}</p>
                </div>
                <div className="rounded-2xl border border-[#fde4cf] bg-white/90 px-4 py-3 text-center shadow-sm">
                  <p className="text-xs font-semibold text-[#64748b]">Garage actif</p>
                  <p className="text-lg font-extrabold text-[#9a3412]">{selectedGarage ? "1" : "0"}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7f9f]">Recherche géolocalisée</p>
            </div>
          </div>

          {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
          {successMessage && <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{successMessage}</p>}

          {showBrandsModal && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/45 p-3 sm:items-center">
              <div className="max-h-[92vh] w-full max-w-[980px] overflow-y-auto rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-2xl sm:px-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 sm:text-4xl">Choisir • Marques</h3>
                <button type="button" onClick={() => setShowBrandsModal(false)} className="text-3xl text-slate-500">×</button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                {filterOptions.brands.map((brand) => {
                  const active = selectedBrand === brand;
                  const logoCandidates = getBrandLogoCandidates(brand);
                  const logoUrl = logoCandidates[0] || "";
                  const fallbackImage = buildMarqueImage(brand);
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => toggleBrand(brand)}
                      className={`overflow-hidden rounded-[22px] border bg-white p-2 text-center transition ${active ? "border-blue-300 shadow-[0_0_0_2px_rgba(37,99,235,0.16)]" : "border-slate-200"}`}
                    >
                      <div className={`flex h-[112px] items-center justify-center rounded-[16px] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3 ${active ? "ring-1 ring-blue-300/40" : ""}`}>
                        <img
                          src={logoUrl || fallbackImage}
                          alt={brand}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-contain"
                          data-logo-index="0"
                          onError={(event) => {
                            const currentIndex = Number.parseInt(event.currentTarget.dataset.logoIndex || "0", 10);
                            const nextIndex = currentIndex + 1;
                            if (nextIndex < logoCandidates.length) {
                              event.currentTarget.dataset.logoIndex = String(nextIndex);
                              event.currentTarget.src = logoCandidates[nextIndex];
                              return;
                            }
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = fallbackImage;
                          }}
                        />
                      </div>
                      <p className={`mt-2 truncate text-[15px] font-bold ${active ? "text-slate-900" : "text-slate-700"}`}>{brand}</p>
                    </button>
                  );
                })}
              </div>
              </div>
            </div>
          )}

          {showSpecialtiesModal && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/45 p-3 sm:items-center">
              <div className="max-h-[92vh] w-full max-w-[1100px] overflow-y-auto rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-2xl sm:px-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 sm:text-4xl">Choisir • Spécialités</h3>
                <button type="button" onClick={() => setShowSpecialtiesModal(false)} className="text-3xl text-slate-500">×</button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filterOptions.specialties.map((speciality) => {
                  const active = selectedSpecialties.includes(speciality);
                  return (
                    <button
                      key={speciality}
                      type="button"
                      onClick={() => toggleSelection(speciality, setSelectedSpecialties)}
                      className={`rounded-2xl border p-4 text-left text-sm font-semibold transition ${active ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"}`}
                    >
                      {speciality}
                    </button>
                  );
                })}
              </div>
              </div>
            </div>
          )}

          {showServicesModal && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/45 p-3 sm:items-center">
              <div className="max-h-[92vh] w-full max-w-[1100px] overflow-y-auto rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-2xl sm:px-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 sm:text-4xl">Choisir • Services</h3>
                <button type="button" onClick={() => setShowServicesModal(false)} className="text-3xl text-slate-500">×</button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filterOptions.services.map((service) => {
                  const active = selectedServices.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleSelection(service, setSelectedServices)}
                      className={`rounded-2xl border p-4 text-left text-sm font-semibold transition ${active ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-slate-50"}`}
                    >
                      {service}
                    </button>
                  );
                })}
              </div>
              </div>
            </div>
          )}

          {showOpenModal && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/45 p-3 sm:items-center">
              <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-2xl sm:px-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 sm:text-4xl">Choisir • Ouvert</h3>
                <button type="button" onClick={() => setShowOpenModal(false)} className="text-3xl text-slate-500">×</button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filterOptions.openModes.map((option) => {
                  const active = selectedOpenModes.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleSelection(option, setSelectedOpenModes)}
                      className={`rounded-2xl border p-4 text-left text-sm font-semibold transition ${active ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-slate-50"}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              </div>
            </div>
          )}

          {showDeplacementModal && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/45 p-3 sm:items-center">
              <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-2xl sm:px-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 sm:text-4xl">Choisir • Déplacement</h3>
                <button type="button" onClick={() => setShowDeplacementModal(false)} className="text-3xl text-slate-500">×</button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filterOptions.displacements.map((option) => {
                  const active = selectedDeplacements.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleSelection(option, setSelectedDeplacements)}
                      className={`rounded-2xl border p-4 text-left text-sm font-semibold transition ${active ? "border-violet-300 bg-violet-50 text-violet-800" : "border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-slate-50"}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_1fr]">
            <aside className="h-fit rounded-[24px] border border-white/80 bg-white/95 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)] space-y-5">
              <form className="space-y-3" onSubmit={handleSearchSubmit}>
              <label className="text-sm font-semibold text-[#334155] block">Recherche</label>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-xl border border-[#dbe2ec] bg-white px-3 py-2 text-sm text-[#1e293b] outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Nom, adresse, email..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <button type="submit" className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-bold text-white shadow transition hover:bg-[#1e40af]">OK</button>
              </div>
              </form>

              <div className="space-y-3 rounded-2xl border border-[#dbe2ec] bg-[#f8fbff] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#334155]">Filtres rapides</p>
                <button type="button" onClick={clearQuickFilters} className="text-xs font-semibold text-[#1d4ed8] hover:underline">
                  Réinitialiser
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {renderFilterButton("Marques", selectedBrand ? 1 : 0, () => setShowBrandsModal(true))}
                {renderFilterButton("Spécialités", selectedSpecialties.length, () => setShowSpecialtiesModal(true))}
                {renderFilterButton("Services", selectedServices.length, () => setShowServicesModal(true))}
                {renderFilterButton("Ouvert", selectedOpenModes.length, () => setShowOpenModal(true))}
                {renderFilterButton(
                  "Déplacement",
                  selectedDeplacements.length,
                  () => setShowDeplacementModal(true),
                  selectedBrand === "" && selectedSpecialties.length === 0 && selectedServices.length === 0
                )}
              </div>
              {(selectedBrand || selectedSpecialties.length > 0 || selectedServices.length > 0) && (
                <p className="text-xs text-[#617089]">Déplacement sélectionné: {selectedDeplacements.length > 0 ? selectedDeplacements.join(", ") : "Aucun jour"}</p>
              )}
              </div>

              <div className="space-y-3">
              <label className="text-sm font-semibold text-[#334155] block">Note minimale</label>
              <select className="vb-input w-full px-3 py-2" value={minRating} onChange={(event) => setMinRating(Number(event.target.value))}>
                <option value={0}>Toutes</option>
                <option value={2}>2+</option>
                <option value={3}>3+</option>
                <option value={4}>4+</option>
              </select>
              </div>

              <button type="button" className="w-full rounded-xl bg-[#1d4ed8] py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#1e40af]" onClick={handleApplyFilters}>
              Appliquer les filtres
              </button>

              <div className="border-t border-[#dbe2ec] pt-4">
              <p className="text-sm font-semibold text-[#334155] mb-2">Resultats ({garages.length})</p>
              {isLoadingList ? (
                <p className="text-sm text-[#617089]">Chargement...</p>
              ) : garages.length === 0 ? (
                <p className="text-sm text-[#617089]">Aucun garage trouve avec ces filtres.</p>
              ) : (
                <ul className="space-y-2 max-h-[350px] overflow-auto pr-1">
                  {garages.map((garage) => {
                    const hasDistance = garage.distance_km !== null && garage.distance_km !== undefined;
                    const distance = hasDistance ? Number(garage.distance_km) : null;
                    const distanceColor = distance !== null ? getDistanceColor(distance) : "";
                    const distanceLabel = distance !== null ? getDistanceLabel(distance) : "";
                    
                    return (
                      <li key={garage.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectGarage(garage)}
                          className={`w-full rounded-lg border px-3 py-3 text-left transition ${selectedGarageId === garage.id ? "border-blue-400 bg-blue-50" : "border-[#dbe2ec] bg-white hover:bg-slate-50"}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-bold text-[#1a2b4b] truncate">{garage.name}</p>
                              <p className="text-xs text-[#617089] truncate">{garage.adresse || "Adresse non precisee"}</p>
                            </div>
                            {hasDistance && (
                              <div className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold border ${distanceColor}`}>
                                {formatDistance(distance)}
                              </div>
                            )}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-semibold text-[#334155]">{garage.rating ?? "-"}</span>
                              <span className="text-xs text-[#9ca3af]">({garage.reviews_count || 0})</span>
                            </div>
                            {distanceLabel && (
                              <span className="text-xs text-[#617089] italic">{distanceLabel}</span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              </div>
            </aside>

            <section className="space-y-5">
              <div className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMapSpecialty("")}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${selectedMapSpecialty ? "border-slate-200 bg-white text-slate-600" : "border-amber-300 bg-amber-50 text-amber-700"}`}
                  >
                    Toutes spécialités
                  </button>
                  {filterOptions.specialties.slice(0, 10).map((specialty) => {
                    const active = selectedMapSpecialty === specialty;
                    return (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => setSelectedMapSpecialty(active ? "" : specialty)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-600 hover:border-amber-200"}`}
                      >
                        {specialty}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-[#64748b]">
                  {selectedMapSpecialty ? `Spécialité sélectionnée: ${selectedMapSpecialty}` : "Sélectionnez une spécialité pour filtrer les garages sur la carte"}
                  {` • ${garagesForMap.length} garage(s) affiché(s)`}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] h-[600px]">
                <GoogleMapGarages 
                  center={mapCenter} 
                  userPosition={userPosition}
                  garages={garagesForMap}
                  featuredGarages={featuredGarages}
                  selectedGarageId={selectedGarageId}
                  onMarkerClick={handleMarkerClick}
                />
              </div>

              {!selectedGarageId ? (
                <div className="rounded-[24px] border border-white/80 bg-white/95 p-6 text-sm text-[#617089] shadow-[0_14px_35px_rgba(15,23,42,0.08)]">Choisissez une spécialité puis cliquez sur un garage sur la carte pour afficher sa présentation.</div>
              ) : isLoadingDetails ? (
                <div className="rounded-[24px] border border-white/80 bg-white/95 p-6 text-sm text-[#617089] shadow-[0_14px_35px_rgba(15,23,42,0.08)]">Chargement des details...</div>
              ) : (
                <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.1fr_1fr]">
                  <article className="rounded-[24px] border border-amber-100 bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.08)] 2xl:col-span-2">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-bold uppercase tracking-[0.12em] text-amber-600">Présentation</p>
                        <h2 className="text-3xl font-black text-[#0f172a]">{selectedGarage?.name}</h2>
                        <p className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-bold text-amber-700">
                          {selectedMapSpecialty || selectedSpecialties[0] || "Garage automobile"}
                        </p>
                        <p className="flex items-center gap-2 text-base font-semibold text-[#1e293b]">
                          <MapPin className="h-4 w-4 text-amber-500" />
                          {selectedGarage?.adresse || "Adresse non précisée"}
                        </p>
                      </div>

                      <div className="grid w-full gap-2 sm:grid-cols-3 md:w-auto">
                        <button
                          type="button"
                          onClick={handleOpenDirections}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                        >
                          <Navigation className="h-4 w-4" />
                          Itinéraires
                        </button>
                        <button
                          type="button"
                          onClick={handleBookAppointment}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                        >
                          <CalendarCheck2 className="h-4 w-4" />
                          RDV
                        </button>
                        <button
                          type="button"
                          onClick={handleShareGarage}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600"
                        >
                          <Share2 className="h-4 w-4" />
                          Partager
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-[#0f172a]">
                          <Clock3 className="h-5 w-5 text-amber-500" />
                          Horaires de Travail
                        </h3>
                        {selectedGarageWorkSchedule.length === 0 ? (
                          <p className="text-sm text-slate-500">Horaires non renseignés.</p>
                        ) : (
                          <ul className="space-y-1">
                            {selectedGarageWorkSchedule.map((item) => (
                              <li key={`${item.day}-${item.timeLabel}`} className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-slate-700">{item.day}</span>
                                <span className={`${item.enabled ? "text-slate-900" : "text-slate-400"}`}>
                                  {item.enabled ? item.timeLabel : "Fermé"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-lg font-extrabold text-[#0f172a]">
                          <Clock3 className="h-5 w-5 text-amber-500" />
                          Horaires de Déplacement
                        </h3>
                        {selectedGarageTravelSchedule.length === 0 ? (
                          <p className="text-sm text-slate-500">Pas de déplacement déclaré.</p>
                        ) : (
                          <ul className="space-y-1">
                            {selectedGarageTravelSchedule.map((item) => (
                              <li key={`${item.day}-${item.timeLabel}`} className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-slate-700">{item.day}</span>
                                <span className={`${item.enabled ? "text-slate-900" : "text-slate-400"}`}>
                                  {item.enabled ? item.timeLabel : "Non disponible"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </article>

                  <article className="rounded-[24px] border border-white/80 bg-white/95 p-6 space-y-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1a2b4b]">{selectedGarage?.name}</h2>
                    <p className="mt-1 text-sm text-[#617089]">{selectedGarage?.adresse || "Adresse non precisee"}</p>
                    <p className="mt-1 text-sm text-[#617089]">Contact: {selectedGarage?.telephone || "N/A"} • {selectedGarage?.email || "N/A"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-[#f4f8ff] p-3 text-center">
                      <p className="text-xs text-[#617089]">Note moyenne</p>
                      <p className="text-xl font-extrabold text-[#12223d]">{summary.average_rating || 0}</p>
                    </div>
                    <div className="rounded-lg bg-[#f4f8ff] p-3 text-center">
                      <p className="text-xs text-[#617089]">Nombre d'avis</p>
                      <p className="text-xl font-extrabold text-[#12223d]">{summary.reviews_count || 0}</p>
                    </div>
                  </div>

                  {selectedGarage?.distance_km !== null && selectedGarage?.distance_km !== undefined && userPosition && (
                    <div className={`rounded-lg border-2 p-4 ${getDistanceColor(Number(selectedGarage.distance_km))}`}>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">Distance from vous</p>
                          <p className="text-xs opacity-75">{getDistanceLabel(Number(selectedGarage.distance_km))}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{formatDistance(Number(selectedGarage.distance_km))}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="mb-3 text-lg font-bold text-[#1a2b4b]">Services disponibles</h3>
                    {garageServices.length === 0 ? (
                      <p className="text-sm text-[#617089]">Ce garage n'a pas encore publie de services.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {garageServices.map((service) => (
                          <div key={service.id} className="rounded-lg border border-[#dbe2ec] bg-white p-4">
                            <p className="font-bold text-[#1a2b4b]">{service.name}</p>
                            <p className="mt-1 text-sm text-[#617089]">{service.description || "Sans description"}</p>
                            <p className="mt-2 text-sm text-[#334155]">
                              {service.base_price !== null ? `${service.base_price} TND` : "Prix non precise"}
                              {" • "}
                              {service.duration_minutes !== null ? `${service.duration_minutes} min` : "Duree non precisee"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </article>

                  <article className="rounded-[24px] border border-white/80 bg-white/95 p-6 space-y-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]">
                  <div>
                    <h3 className="mb-3 text-lg font-bold text-[#1a2b4b]">Votre avis</h3>
                    <form className="space-y-3" onSubmit={handleSubmitReview}>
                      <label className="block text-sm font-semibold text-[#334155]">
                        Note
                        <select name="rating" className="vb-input mt-1 w-full px-3 py-2" value={reviewForm.rating} onChange={handleReviewFieldChange}>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                        </select>
                      </label>
                      <label className="block text-sm font-semibold text-[#334155]">
                        Commentaire
                        <textarea
                          name="comment"
                          className="vb-input mt-1 w-full px-3 py-2"
                          rows={4}
                          value={reviewForm.comment}
                          onChange={handleReviewFieldChange}
                          placeholder="Partagez votre experience..."
                        />
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <button type="submit" className="vb-btn-primary px-4 py-2">
                          {editingReviewId ? "Mettre a jour mon avis" : "Publier mon avis"}
                        </button>
                        {editingReviewId && (
                          <button
                            type="button"
                            className="rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
                            onClick={handleDeleteMyReview}
                          >
                            Supprimer mon avis
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div>
                    <h3 className="mb-3 text-lg font-bold text-[#1a2b4b]">Avis recents</h3>
                    {garageReviews.length === 0 ? (
                      <p className="text-sm text-[#617089]">Aucun avis public pour ce garage.</p>
                    ) : (
                      <ul className="space-y-3 max-h-[320px] overflow-auto pr-1">
                        {garageReviews.map((review) => (
                          <li key={review.id} className="rounded-lg border border-[#dbe2ec] bg-white p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-bold text-[#1a2b4b]">{review.reviewer?.name || "Utilisateur"}</p>
                                <p className="text-sm text-[#617089]">Note: {review.rating}/5</p>
                                <p className="mt-1 text-sm text-[#334155]">{review.comment || "Sans commentaire"}</p>
                              </div>
                              <p className="text-xs text-[#617089]">{new Date(review.created_at).toLocaleDateString("fr-FR")}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  </article>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
};

export default GaragesPage;

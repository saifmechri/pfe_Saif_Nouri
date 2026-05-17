import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bell, ChevronDown, ChevronRight, Clock3, Heart, Home, ImagePlus, Lock, MapPin, Menu, MinusCircle, PlusCircle, Search, Settings, Truck, Wrench } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import PlatformLayout from "../../components/PlatformLayout";
import {
  createGarage,
  createGarageService,
  deleteGarageService,
  getMyGarage,
  getMyGarageReviews,
  getMyGarageServices,
  uploadGaragePhotos,
  updateGarage,
  updateGarageReview,
  updateGarageService
} from "../../services/garage";
import { getCompleteProfile, updateProfile } from "../../services/user";
import GarageDashboardAppointments from "../../components/dashboard/GarageDashboardAppointments";
import { calculateDistance, formatDistance, getDistanceColor, getDistanceLabel } from "../../utils/distanceCalculator";

const emptyGarageForm = {
  name: "",
  description: "",
  adresse: "",
  telephone: "",
  email: "",
  specialties: "",
  services_catalog: "",
  keywords: "",
  photo_urls: "",
  work_hours: "",
  travel_hours: "",
  vehicle_brands: "",
  latitude: "",
  longitude: "",
  is_open: true
};

const emptyServiceForm = {
  name: "",
  description: "",
  base_price: "",
  duration_minutes: "",
  is_active: true
};

const getPayload = (response) => response?.data?.data ?? response?.data;
const fallbackCenter = [35.8256, 10.6369];

const garageBrands = [
  "Audi", "BMW", "BYD", "Changan", "Chery", "Chevrolet", "Citroen", "Cupra",
  "Daewoo", "Dacia", "DFM", "FAW", "Fiat", "Ford", "Foton", "Geely", "Great Wall",
  "Haval", "Honda", "Hyundai", "Isuzu", "JAC", "Jeep", "Kia", "Lada", "Land Rover",
  "Lexus", "Mahindra", "Mazda", "Mercedes", "MG", "Mitsubishi", "Nissan", "Opel",
  "Peugeot", "Porsche", "Renault", "Seat", "Skoda", "SsangYong", "Suzuki", "Tesla",
  "Toyota", "Volkswagen", "Volvo"
].sort((a, b) => a.localeCompare(b));

const garageSpecialtyCatalog = [
  {
    name: "Mécanique générale",
    services: ["Réparation moteur", "Entretien mécanique", "Remplacement moteur", "Spécialiste camion"]
  },
  {
    name: "Tôlerie et Peinture",
    services: ["Débosselage et carrosserie", "Peinture au four", "Lustrage et polissage", "Peinture jantes"]
  },
  {
    name: "Électricité auto",
    services: ["Diagnostic électrique", "Alternateur / Démarreur", "Batterie", "Câblage et fusibles"]
  },
  {
    name: "Services pneumatiques",
    services: ["Montage et équilibrage", "Parallélisme / Géométrie", "Réparation crevaison", "Gonflage azote"]
  },
  {
    name: "Diagnostic auto",
    services: ["Passage à la valise", "Lecture/Effacement défauts", "Programmation calculateurs", "Test de composants"]
  },
  {
    name: "Services rapides",
    services: ["Vidange et filtres", "Freinage (Plaquettes/Disques)", "Amortisseurs", "Révision saisonnière"]
  },
  {
    name: "Vitrage auto",
    services: ["Remplacement pare-brise", "Réparation d'impact", "Vitres teintées / Film solaire", "Rénovation optiques"]
  },
  {
    name: "Climatisation auto",
    services: ["Recharge climatisation", "Détection de fuites", "Remplacement compresseur", "Traitement antibactérien"]
  },
  {
    name: "Clé et multimédia",
    services: ["Double de clé / Programmation", "Installation autoradio / Écrans", "Caméra de recul", "Alarmes"]
  },
  {
    name: "Sellerie auto",
    services: ["Sellerie intérieure", "Réparation sièges", "Rénovation cuir", "Housses sur mesure"]
  },
  {
    name: "Maintenance Calculateurs",
    services: ["Diagnostic ECU", "Reprogrammation", "Réparation ECU", "Codage modules"]
  },
  {
    name: "Tourneur",
    services: ["Usinage pièces", "Fabrication sur mesure", "Rectification", "Ajustement"]
  },
  {
    name: "Spécialiste crémaillère",
    services: ["Réparation crémaillère", "Remplacement crémaillère", "Réglage direction", "Diagnostic direction"]
  },
  {
    name: "Spécialiste radiateur",
    services: ["Réparation radiateur", "Nettoyage circuit", "Remplacement radiateur", "Purge système"]
  },
  {
    name: "Spécialiste injection",
    services: ["Nettoyage injecteurs", "Test injecteurs", "Remplacement injecteurs", "Codage injecteurs"]
  },
  {
    name: "Échappement / catalyseur",
    services: ["Réparation ligne échappement", "Remplacement catalyseur", "Soudure échappement", "Diagnostic pollution"]
  },
  {
    name: "Optiques auto",
    services: ["Rénovation phares", "Remplacement optiques", "Polissage optiques", "Réglage feux"]
  },
  {
    name: "Spécialiste boîtes de vitesses",
    services: ["Réparation boîte manuelle", "Réparation boîte automatique", "Vidange boîte", "Diagnostic transmission"]
  },
  {
    name: "Conversions véhicules",
    services: ["Passage au GPL / Éthanol", "Aménagement utilitaire", "Adaptation handicap", "Conversion électrique"]
  },
  {
    name: "Tuning auto",
    services: ["Kit carrosserie", "Rabaissement (Combinés filetés)", "Éclairage personnalisé", "Optimisation performance"]
  },
  {
    name: "Station lavage",
    services: ["Lavage haute pression", "Nettoyage intérieur / Shampoing", "Lavage moteur", "Traitement céramique"]
  },
  {
    name: "Vente pièces auto neuves",
    services: ["Pièces moteur", "Consommables (Filtres/Freins)", "Lubrifiants", "Outillage"]
  },
  {
    name: "Vente pièces détachées d’occasion",
    services: ["Pièces de casse auto", "Moteurs d'occasion", "Portières / Capots", "Jantes occasion"]
  },
  {
    name: "Vente accessoires",
    services: ["Tapis et housses", "Coffres de toit", "Produits d'entretien", "Gadgets auto"]
  },
  {
    name: "Station service",
    services: ["Carburant (Essence/Diesel)", "Gonflage pneus", "Boutique de dépannage", "Lavage automatique"]
  },
  {
    name: "Expert automobile",
    services: ["Expertise après sinistre", "Estimation valeur véhicule", "Conseil à l'achat", "Litiges mécaniques"]
  },
  {
    name: "Auto-école",
    services: ["Permis B (Voiture)", "Code de la route", "Conduite accompagnée", "Perfectionnement"]
  },
  {
    name: "Centre contrôle technique",
    services: ["Visite périodique", "Contre-visite", "Contrôle pollution", "Contrôle spécifique (VTC/Taxi)"]
  },
  {
    name: "Concessionnaire auto neuf",
    services: ["Vente véhicules neufs", "Essai routier", "Reprise ancien véhicule", "Financement / Garantie"]
  },
  {
    name: "Concessionnaire auto occasion",
    services: ["Vente occasions révisées", "Essai routier", "Reprise ancien véhicule", "Garantie occasion"]
  },
  {
    name: "Remorquage et dépannage",
    services: ["Dépannage sur place", "Remorquage 24h/24", "Transport longue distance", "Sortie de fourrière"]
  },
  {
    name: "Leasing",
    services: ["Location Longue Durée (LLD)", "LOA (Location avec Option d'Achat)", "Gestion de flotte", "Location courte durée"]
  },
  {
    name: "Vente de motos & Pièces détachées",
    services: ["Vente motos", "Pièces détachées moto", "Accessoires motard", "Casques et équipements"]
  },
  {
    name: "Entretien & réparation Moto",
    services: ["Révision moto", "Pneumatiques moto", "Kit chaîne et carburation", "Entretien mécanique moto"]
  },
  {
    name: "Personnalisation & préparation Moto",
    services: ["Personnalisation moto", "Préparation moteur", "Éclairage personnalisé", "Aménagement esthétique"]
  }
];

const garageSpecialties = garageSpecialtyCatalog.map((item) => item.name);

const garageServicesCatalog = garageSpecialtyCatalog.flatMap((item) => item.services);

const garageServicesBySpecialty = Object.fromEntries(
  garageSpecialtyCatalog.map((item) => [item.name, item.services])
);

const openingDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const displacementOptions = ["Tous les jours", ...openingDays];

const normalizeForSlug = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getMarqueInitials = (brand) =>
  String(brand || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

const brandLogoDomains = {
  Audi: "audi.com",
  BMW: "bmw.com",
  BYD: "byd.com",
  Changan: "changan.com",
  Chery: "cheryinternational.com",
  Chevrolet: "chevrolet.com",
  Citroen: "citroen.com",
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
  Lexus: "lexus.com",
  Mahindra: "mahindra.com",
  Mazda: "mazda.com",
  Mercedes: "mercedes-benz.com",
  MG: "mgmotor.eu",
  Mitsubishi: "mitsubishi-motors.com",
  Nissan: "nissan-global.com",
  Opel: "opel.com",
  Peugeot: "peugeot.com",
  Porsche: "porsche.com",
  Renault: "renault.com",
  Seat: "seat.com",
  Skoda: "skoda-auto.com",
  SsangYong: "kg-mobility.com",
  Suzuki: "suzuki.com",
  Tesla: "tesla.com",
  Toyota: "toyota.com",
  Volkswagen: "volkswagen.com",
  Volvo: "volvocars.com"
};

const buildSvgDataUrl = ({ top = "#f8fafc", bottom = "#ffffff", title = "", subtitle = "", accent = "#1e293b" }) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='220' viewBox='0 0 320 220'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='${top}'/>
        <stop offset='100%' stop-color='${bottom}'/>
      </linearGradient>
    </defs>
    <rect width='320' height='220' rx='22' fill='url(#g)'/>
    <rect x='24' y='26' width='272' height='116' rx='18' fill='rgba(255,255,255,0.74)'/>
    <circle cx='64' cy='84' r='22' fill='${accent}' opacity='0.14'/>
    <circle cx='254' cy='84' r='18' fill='${accent}' opacity='0.12'/>
    <text x='160' y='98' text-anchor='middle' font-family='Segoe UI, Arial' font-size='40' font-weight='700' fill='${accent}'>${title}</text>
    <text x='160' y='178' text-anchor='middle' font-family='Segoe UI, Arial' font-size='22' font-weight='600' fill='#1f2937'>${subtitle}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const buildMarqueImage = (brand) => {
  const initials = getMarqueInitials(brand);
  const palette = ["#e0f2fe", "#e0e7ff", "#ffe4e6", "#fef3c7"][garageBrands.indexOf(brand) % 4];

  return buildSvgDataUrl({
    top: palette,
    bottom: "#ffffff",
    title: initials,
    subtitle: brand,
    accent: "#0f172a"
  });
};

const brandDomainMap = {
  Audi: "audi.com",
  BMW: "bmw.com",
  BYD: "byd.com",
  Changan: "changan.com",
  Chery: "cheryinternational.com",
  Chevrolet: "chevrolet.com",
  Citroen: "citroen.com",
  Cupra: "cupraofficial.com",
  Dacia: "dacia.com",
  Fiat: "fiat.com",
  Ford: "ford.com",
  Geely: "global.geely.com",
  Honda: "honda.com",
  Hyundai: "hyundai.com",
  Isuzu: "isuzu.com",
  JAC: "jac.com.cn",
  Jeep: "jeep.com",
  Kia: "kia.com",
  Mazda: "mazda.com",
  Mercedes: "mercedes-benz.com",
  MG: "mgmotor.com",
  Mitsubishi: "mitsubishi-motors.com",
  Nissan: "nissan-global.com",
  Opel: "opel.com",
  Peugeot: "peugeot.com",
  Porsche: "porsche.com",
  Renault: "renault.com",
  Seat: "seat.com",
  Skoda: "skoda-auto.com",
  Suzuki: "suzuki.com",
  Tesla: "tesla.com",
  Toyota: "toyota.com",
  Volkswagen: "volkswagen.com",
  Volvo: "volvocars.com"
};

const getBrandLogoCandidates = (brand) => {
  const slug = normalizeForSlug(brand);
  const normalized = String(brand || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const fileBaseCandidates = Array.from(new Set([
    slug,
    slug.replace(/-/g, ""),
    normalized,
    normalized.toLowerCase(),
    normalized.replace(/\s+/g, "-"),
    normalized.replace(/\s+/g, "_"),
    normalized.replace(/[\s-]+/g, ""),
    brand,
    String(brand || "").toLowerCase()
  ])).filter(Boolean);

  const extensions = ["png", "jpg", "jpeg", "webp", "svg", "PNG", "JPG", "JPEG", "WEBP", "SVG"];
  const localCandidates = fileBaseCandidates.flatMap((base) =>
    extensions.map((ext) => `/logos/marques/${encodeURIComponent(base)}.${ext}`)
  );

  const domain = brandLogoDomains[brand];
  if (!domain) {
    return [...localCandidates, buildMarqueImage(brand)];
  }

  return [...localCandidates, buildMarqueImage(brand)];
};

const splitBySeparators = (value) =>
  String(value || "")
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);

const splitLines = (value, fallback = []) => {
  const lines = String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length > 0 ? lines : fallback;
};

const createDefaultSchedule = () =>
  openingDays.map((day) => ({
    day,
    enabled: false,
    start: "08:00",
    end: "18:00"
  }));

const parseScheduleText = (value) => {
  const byDay = new Map(
    openingDays.map((day) => [day, { day, enabled: false, start: "08:00", end: "18:00" }])
  );

  splitBySeparators(value).forEach((line) => {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length === 4) {
      const [day, enabled, start, end] = parts;
      if (byDay.has(day)) {
        byDay.set(day, {
          day,
          enabled: enabled === "1" || enabled.toLowerCase() === "true",
          start: start || "08:00",
          end: end || "18:00"
        });
      }
      return;
    }

    const match = line.match(/^([^:]+):\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
    if (match) {
      const [, day, start, end] = match;
      if (byDay.has(day.trim())) {
        byDay.set(day.trim(), {
          day: day.trim(),
          enabled: true,
          start,
          end
        });
      }
    }
  });

  return openingDays.map((day) => byDay.get(day) || { day, enabled: false, start: "08:00", end: "18:00" });
};

const serializeScheduleText = (schedule) =>
  schedule
    .map((item) => `${item.day}|${item.enabled ? 1 : 0}|${item.start || "08:00"}|${item.end || "18:00"}`)
    .join("\n");

const GarageDashboard = () => {
  const [activePanel, setActivePanel] = useState("garage");
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();

  const { user } = useContext(AuthContext);

  const [garage, setGarage] = useState(null);
  const [garageForm, setGarageForm] = useState(emptyGarageForm);
  const [isGarageLoading, setIsGarageLoading] = useState(false);

  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [isServicesLoading, setIsServicesLoading] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({
    reviews_count: 0,
    average_rating: 0,
    min_rating: 0,
    max_rating: 0
  });
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);

  const [userPosition, setUserPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState(fallbackCenter);
  const [isLocating, setIsLocating] = useState(false);
  const [chipFilters, setChipFilters] = useState({
    onlyActiveServices: false,
    onlyOpen: false,
    deplacement: false
  });
  const [showBrandsModal, setShowBrandsModal] = useState(false);
  const [showSpecialtiesModal, setShowSpecialtiesModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [serviceModalSpecialty, setServiceModalSpecialty] = useState("");
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showDeplacementModal, setShowDeplacementModal] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedOpenModes, setSelectedOpenModes] = useState([]);
  const [selectedDeplacement, setSelectedDeplacement] = useState("");
  const [workSchedule, setWorkSchedule] = useState(createDefaultSchedule);
  const [travelSchedule, setTravelSchedule] = useState(createDefaultSchedule);
  const [doesTravel, setDoesTravel] = useState(false);
  const [serviceActivities, setServiceActivities] = useState([{ title: "", description: "" }]);
  const [localPhotoFiles, setLocalPhotoFiles] = useState([]);
  const [localPhotoPreviews, setLocalPhotoPreviews] = useState([]);
  const mapContainerRef = useRef(null);
  const photoFileInputRef = useRef(null);
  const googleMapRef = useRef(null);
  const garageMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [presentationForm, setPresentationForm] = useState({
    store_name: "",
    store_address: "",
    store_description: ""
  });
  const [presentationSaving, setPresentationSaving] = useState(false);
  const [presentationMessage, setPresentationMessage] = useState("");
  const [presentationError, setPresentationError] = useState("");

  useEffect(() => {
    const requestedPanel = searchParams.get("panel");
    if (requestedPanel === "garage" || requestedPanel === "presentation") {
      setActivePanel(requestedPanel);
    }
  }, [searchParams]);

  const hasGarageProfile = Boolean(garage?.id);

  const getApiErrorMessage = (err, fallback) => {
    const data = err?.response?.data;
    const directMessage = data?.message;
    const details = Array.isArray(data?.error?.details) ? data.error.details : [];

    if (details.length > 0) {
      const detailMessage = details
        .map((item) => item?.message)
        .filter(Boolean)
        .join(" | ");
      if (detailMessage) {
        return detailMessage;
      }
    }

    if (!err?.response) {
      return "Serveur API inaccessible. Vérifiez que le backend tourne sur http://localhost:3000.";
    }

    if (typeof directMessage === "string" && directMessage.trim().length > 0) {
      return directMessage;
    }

    return fallback;
  };

  const existingPhotoUrls = useMemo(() => splitBySeparators(garageForm.photo_urls).slice(0, 9), [garageForm.photo_urls]);
  const photoItems = useMemo(() => [...localPhotoPreviews, ...existingPhotoUrls].slice(0, 9), [existingPhotoUrls, localPhotoPreviews]);

  const clearLocalPhotoSelection = () => {
    localPhotoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setLocalPhotoFiles([]);
    setLocalPhotoPreviews([]);
  };

  const handlePhotoPickerChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const remainingSlots = Math.max(0, 9 - (existingPhotoUrls.length + localPhotoFiles.length));
    const selectedFiles = imageFiles.slice(0, remainingSlots);

    if (selectedFiles.length === 0) {
      setError("Vous avez deja atteint la limite de 9 photos.");
      return;
    }

    setLocalPhotoFiles((current) => [...current, ...selectedFiles]);
    setLocalPhotoPreviews((current) => [
      ...current,
      ...selectedFiles.map((file) => URL.createObjectURL(file))
    ]);
  };

  const removePhotoAt = (index) => {
    if (index < localPhotoPreviews.length) {
      const removedPreview = localPhotoPreviews[index];
      if (removedPreview) {
        URL.revokeObjectURL(removedPreview);
      }

      setLocalPhotoFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
      setLocalPhotoPreviews((current) => current.filter((_, itemIndex) => itemIndex !== index));
      return;
    }

    const existingIndex = index - localPhotoPreviews.length;
    const updatedExisting = existingPhotoUrls.filter((_, itemIndex) => itemIndex !== existingIndex);
    setGarageForm((prev) => ({
      ...prev,
      photo_urls: updatedExisting.join("\n")
    }));
  };

  const initializeGoogleMap = () => {
    if (!mapContainerRef.current || !window.google?.maps) {
      return;
    }

    const center = Array.isArray(mapCenter) && mapCenter.length === 2 ? { lat: Number(mapCenter[0]), lng: Number(mapCenter[1]) } : { lat: fallbackCenter[0], lng: fallbackCenter[1] };

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center,
      zoom: 10,
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false,
      zoomControl: true
    });

    googleMapRef.current = map;

    map.addListener("click", (event) => {
      const latitude = Number(event.latLng.lat().toFixed(6));
      const longitude = Number(event.latLng.lng().toFixed(6));

      setGarageForm((prev) => ({
        ...prev,
        latitude,
        longitude
      }));

      map.panTo({ lat: latitude, lng: longitude });
    });
  };

  const createMapMarker = ({ map, position, title, draggable = false, accentColor = null }) => {
    const markerApi = window.google?.maps?.marker;
    const AdvancedMarkerElement = markerApi?.AdvancedMarkerElement;

    if (AdvancedMarkerElement) {
      const advancedOptions = {
        map,
        position,
        title,
        gmpDraggable: draggable
      };

      if (accentColor && markerApi?.PinElement) {
        const pin = new markerApi.PinElement({
          background: accentColor,
          borderColor: "#ffffff",
          glyphColor: "#ffffff"
        });
        advancedOptions.content = pin.element;
      }

      return new AdvancedMarkerElement(advancedOptions);
    }

    return new window.google.maps.Marker({
      map,
      position,
      title,
      draggable,
      ...(accentColor
        ? {
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: accentColor,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2
            }
          }
        : {})
    });
  };

  const setMarkerMap = (marker, map) => {
    if (!marker) return;
    if (typeof marker.setMap === "function") {
      marker.setMap(map);
      return;
    }
    marker.map = map;
  };

  const setMarkerPosition = (marker, position) => {
    if (!marker) return;
    if (typeof marker.setPosition === "function") {
      marker.setPosition(position);
      return;
    }
    marker.position = position;
  };

  const readMarkerPosition = (marker) => {
    if (!marker) return null;

    if (typeof marker.getPosition === "function") {
      return marker.getPosition();
    }

    return marker.position || null;
  };

  const syncGoogleMapMarkers = () => {
    const map = googleMapRef.current;
    if (!map || !window.google?.maps) {
      return;
    }

    const garageLat = garageForm.latitude === "" ? null : Number(garageForm.latitude);
    const garageLng = garageForm.longitude === "" ? null : Number(garageForm.longitude);

    if (Number.isFinite(garageLat) && Number.isFinite(garageLng)) {
      const position = { lat: garageLat, lng: garageLng };

      if (!garageMarkerRef.current) {
        garageMarkerRef.current = createMapMarker({
          map,
          position,
          draggable: true,
          title: "Position du garage"
        });

        garageMarkerRef.current.addListener("dragend", () => {
          const markerPosition = readMarkerPosition(garageMarkerRef.current);
          const nextLatValue = typeof markerPosition?.lat === "function" ? markerPosition.lat() : markerPosition?.lat;
          const nextLngValue = typeof markerPosition?.lng === "function" ? markerPosition.lng() : markerPosition?.lng;

          if (!Number.isFinite(nextLatValue) || !Number.isFinite(nextLngValue)) {
            return;
          }

          const nextLat = Number(nextLatValue.toFixed(6));
          const nextLng = Number(nextLngValue.toFixed(6));
          setGarageForm((prev) => ({
            ...prev,
            latitude: nextLat,
            longitude: nextLng
          }));
        });
      } else {
        setMarkerPosition(garageMarkerRef.current, position);
        setMarkerMap(garageMarkerRef.current, map);
      }
    } else if (garageMarkerRef.current) {
      setMarkerMap(garageMarkerRef.current, null);
    }

    if (userPosition) {
      const userPositionObject = { lat: Number(userPosition[0]), lng: Number(userPosition[1]) };

      if (!userMarkerRef.current) {
        userMarkerRef.current = createMapMarker({
          map,
          position: userPositionObject,
          title: "Ma localisation",
          accentColor: "#f59e0b"
        });
      } else {
        setMarkerPosition(userMarkerRef.current, userPositionObject);
        setMarkerMap(userMarkerRef.current, map);
      }
    } else if (userMarkerRef.current) {
      setMarkerMap(userMarkerRef.current, null);
    }

    if (Number.isFinite(garageLat) && Number.isFinite(garageLng)) {
      map.panTo({ lat: garageLat, lng: garageLng });
    } else if (userPosition) {
      map.panTo({ lat: Number(userPosition[0]), lng: Number(userPosition[1]) });
    }
  };

  const activeServicesCount = useMemo(() => {
    const isActive = (value) => value === true || value === 1 || value === "1" || value === "true";
    return services.filter((service) => isActive(service?.is_active)).length;
  }, [services]);

  const visibleServices = useMemo(() => {
    if (!chipFilters.onlyActiveServices) {
      return services;
    }
    return services.filter((service) => service.is_active);
  }, [services, chipFilters.onlyActiveServices]);

  useEffect(() => {
    loadGarageProfile();
  }, [user]);

  useEffect(() => {
    if (hasGarageProfile) {
      loadMyServices();
      loadMyReviews();
    }
  }, [hasGarageProfile]);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const response = await getCompleteProfile();
        const profile = response?.data?.data?.user || response?.data?.user || null;
        if (!isMounted) {
          return;
        }

        setMyProfile(profile);
        setPresentationForm({
          store_name: profile?.store_name || "",
          store_address: profile?.store_address || "",
          store_description: profile?.store_description || ""
        });
      } catch (_err) {
        if (isMounted) {
          setMyProfile(null);
        }
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        setUserPosition(coords);
        if (!garage?.latitude || !garage?.longitude) {
          setMapCenter(coords);
        }
      },
      () => {
        setUserPosition(null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [garage?.latitude, garage?.longitude]);

  useEffect(() => {
    if (window.google?.maps && mapContainerRef.current && !googleMapRef.current) {
      initializeGoogleMap();
    }
  }, [mapCenter]);

  useEffect(() => {
    if (googleMapRef.current) {
      syncGoogleMapMarkers();
    }
  }, [garageForm.latitude, garageForm.longitude, userPosition, mapCenter]);

  const normalizeGarageForm = (source) => ({
    name: source?.name || "",
    description: source?.description || "",
    adresse: source?.adresse || "",
    telephone: source?.telephone || "",
    email: source?.email || "",
    specialties: source?.specialties || "",
    services_catalog: source?.services_catalog || "",
    keywords: source?.keywords || "",
    photo_urls: source?.photo_urls || "",
    work_hours: source?.work_hours || "",
    travel_hours: source?.travel_hours || "",
    vehicle_brands: source?.vehicle_brands || "",
    latitude: source?.latitude ?? "",
    longitude: source?.longitude ?? "",
    is_open: source?.is_open ?? true
  });

  const loadGarageProfile = async () => {
    setIsGarageLoading(true);
    setError("");

    try {
      const response = await getMyGarage();
      const payload = getPayload(response);
      setGarage(payload);
      setGarageForm(normalizeGarageForm(payload));
      clearLocalPhotoSelection();

      const parsedBrands = splitBySeparators(payload?.vehicle_brands);
      setSelectedBrands(parsedBrands.filter((brand) => garageBrands.includes(brand)));

      const parsedSpecialties = splitBySeparators(payload?.specialties);
      setSelectedSpecialties(parsedSpecialties);

      const parsedServices = splitBySeparators(payload?.services_catalog);
      setSelectedServices(parsedServices);

      const parsedOpenModes = splitBySeparators(payload?.work_hours).filter((item) => item === "Ouvert maintenant" || openingDays.includes(item));
      setSelectedOpenModes(parsedOpenModes);

      const parsedDeplacement = splitBySeparators(payload?.travel_hours);
      setSelectedDeplacement(parsedDeplacement[0] || "");

      const parsedWorkSchedule = parseScheduleText(payload?.work_hours);
      setWorkSchedule(parsedWorkSchedule);

      const parsedTravelSchedule = parseScheduleText(payload?.travel_hours);
      setTravelSchedule(parsedTravelSchedule);
      setDoesTravel(parsedTravelSchedule.some((item) => item.enabled));

      if (payload?.latitude !== null && payload?.latitude !== undefined && payload?.longitude !== null && payload?.longitude !== undefined) {
        setMapCenter([Number(payload.latitude), Number(payload.longitude)]);
      }
    } catch (err) {
      const isNotFound = err?.response?.status === 404;

      if (isNotFound) {
        setGarage(null);
        setGarageForm({
          ...emptyGarageForm,
          name: user?.role === "admin" ? `Garage ${user?.name || user?.email || "administrateur"}` : ""
        });
        clearLocalPhotoSelection();
      } else {
        setError(getApiErrorMessage(err, "Erreur lors du chargement du profil garage."));
      }
    } finally {
      setIsGarageLoading(false);
    }
  };

  const loadMyServices = async () => {
    setIsServicesLoading(true);

    try {
      const response = await getMyGarageServices();
      const payload = getPayload(response);
      setServices(Array.isArray(payload?.items) ? payload.items : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erreur lors du chargement des services."));
    } finally {
      setIsServicesLoading(false);
    }
  };

  const loadMyReviews = async () => {
    setIsReviewsLoading(true);

    try {
      const response = await getMyGarageReviews({ includeHidden: true, limit: 50, page: 1 });
      const payload = getPayload(response);
      const items = Array.isArray(payload?.items) ? payload.items : [];
      setReviews(items);

      const publishedItems = items.filter((item) => item?.is_published === true);
      if (publishedItems.length === 0) {
        setReviewSummary({ reviews_count: 0, average_rating: 0, min_rating: 0, max_rating: 0 });
      } else {
        const ratings = publishedItems.map((item) => Number(item.rating || 0));
        const sum = ratings.reduce((acc, value) => acc + value, 0);
        setReviewSummary({
          reviews_count: ratings.length,
          average_rating: Number((sum / ratings.length).toFixed(2)),
          min_rating: Math.min(...ratings),
          max_rating: Math.max(...ratings)
        });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Erreur lors du chargement des avis."));
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const handleGarageFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setGarageForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSaveGarage = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      const garageName = garageForm.name.trim() || (user?.role === "admin" ? `Garage ${user?.name || user?.email || "administrateur"}` : "");

      if (!garageName) {
        setError("Le nom du garage est obligatoire.");
        return;
      }

      let uploadedPhotoUrls = [];
      if (localPhotoFiles.length > 0) {
        const uploadResponse = await uploadGaragePhotos(localPhotoFiles);
        const uploadPayload = getPayload(uploadResponse);
        uploadedPhotoUrls = Array.isArray(uploadPayload?.items) ? uploadPayload.items : [];
      }

      const mergedPhotoUrls = [...existingPhotoUrls, ...uploadedPhotoUrls].slice(0, 9);

      const payload = {
        name: garageName,
        description: garageForm.description || null,
        adresse: garageForm.adresse || null,
        telephone: garageForm.telephone || null,
        email: garageForm.email || null,
        specialties: selectedSpecialties.length > 0 ? selectedSpecialties.join("\n") : garageForm.specialties || null,
        services_catalog: selectedServices.length > 0 ? selectedServices.join("\n") : garageForm.services_catalog || null,
        keywords: garageForm.keywords || null,
        photo_urls: mergedPhotoUrls.length > 0 ? mergedPhotoUrls.join("\n") : null,
        work_hours: serializeScheduleText(workSchedule),
        travel_hours: doesTravel ? serializeScheduleText(travelSchedule) : null,
        vehicle_brands: selectedBrands.length > 0 ? selectedBrands.join("\n") : garageForm.vehicle_brands || null,
        latitude: garageForm.latitude === "" ? null : Number(garageForm.latitude),
        longitude: garageForm.longitude === "" ? null : Number(garageForm.longitude),
        is_open: Boolean(garageForm.is_open)
      };

      const response = garage?.id
        ? await updateGarage(garage.id, payload)
        : await createGarage(payload);

      const savedGarage = getPayload(response);
      setGarage(savedGarage);
      setGarageForm(normalizeGarageForm(savedGarage));
      clearLocalPhotoSelection();
      if (savedGarage?.latitude !== null && savedGarage?.longitude !== null) {
        setMapCenter([Number(savedGarage.latitude), Number(savedGarage.longitude)]);
      }
      setSuccessMessage(garage?.id ? "Profil garage mis a jour." : "Profil garage cree avec succes.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible d'enregistrer le profil garage."));
    }
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lon = Number(position.coords.longitude.toFixed(6));
        setUserPosition([lat, lon]);
        setMapCenter([lat, lon]);
        setGarageForm((prev) => ({ ...prev, latitude: lat, longitude: lon }));
        setActivePanel("garage");
        handleFocusMap();
        setIsLocating(false);
      },
      () => {
        setError("Impossible de recuperer votre position actuelle. Autorisez la localisation du navigateur, puis reessayez.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleFocusMap = () => {
    setActivePanel("garage");
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const openServicesModal = (specialty = "") => {
    setServiceModalSpecialty(specialty || selectedSpecialties[0] || garageSpecialties[0] || "");
    setShowServicesModal(true);
  };

  const handleServiceFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setServiceForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const resetServiceForm = () => {
    setServiceForm(emptyServiceForm);
    setServiceActivities([{ title: "", description: "" }]);
    setEditingServiceId(null);
  };

  const handleSubmitService = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!garage?.id) {
      setError("Créez d'abord votre profil garage avant d'ajouter des services.");
      return;
    }

    try {
      const activitiesText = serviceActivities
        .filter((item) => item.title.trim() || item.description.trim())
        .map((item, index) => `Activite ${index + 1}: ${item.title.trim()}${item.description.trim() ? ` - ${item.description.trim()}` : ""}`)
        .join("\n");

      const mergedDescription = [serviceForm.description.trim(), activitiesText].filter(Boolean).join("\n");

      const payload = {
        name: serviceForm.name,
        description: mergedDescription || null,
        base_price: serviceForm.base_price === "" ? null : Number(serviceForm.base_price),
        duration_minutes: serviceForm.duration_minutes === "" ? null : Number(serviceForm.duration_minutes),
        is_active: Boolean(serviceForm.is_active)
      };

      if (editingServiceId) {
        await updateGarageService(garage.id, editingServiceId, payload);
        setSuccessMessage("Service mis a jour.");
      } else {
        await createGarageService(garage.id, payload);
        setSuccessMessage("Service ajoute.");
      }

      resetServiceForm();
      await loadMyServices();
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible d'enregistrer le service."));
    }
  };

  const handleEditService = (service) => {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name || "",
      description: service.description || "",
      base_price: service.base_price ?? "",
      duration_minutes: service.duration_minutes ?? "",
      is_active: Boolean(service.is_active)
    });
    setServiceActivities([{ title: "", description: "" }]);
  };

  const updateScheduleRow = (setter, index, patch) => {
    setter((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  const updateActivity = (index, field, value) => {
    setServiceActivities((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  };

  const addActivity = () => {
    setServiceActivities((current) => [...current, { title: "", description: "" }]);
  };

  const removeActivity = (index) => {
    setServiceActivities((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)));
  };

  const handleDeleteService = async (serviceId) => {
    if (!garage?.id) {
      return;
    }

    setError("");
    setSuccessMessage("");

    try {
      await deleteGarageService(garage.id, serviceId);
      setSuccessMessage("Service supprime.");
      await loadMyServices();
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de supprimer ce service."));
    }
  };

  const handleTogglePublished = async (review) => {
    setError("");
    setSuccessMessage("");

    try {
      await updateGarageReview(review.garage_id, review.id, { is_published: !review.is_published });
      setSuccessMessage("Statut de publication de l'avis mis a jour.");
      await loadMyReviews();
    } catch (err) {
      setError(getApiErrorMessage(err, "Impossible de modifier la publication de cet avis."));
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
      await updateProfile({
        store_name: presentationForm.store_name,
        store_address: presentationForm.store_address,
        store_description: presentationForm.store_description
      });

      const refreshed = await getCompleteProfile();
      const profile = refreshed?.data?.data?.user || refreshed?.data?.user || null;
      setMyProfile(profile);
      setPresentationMessage("Présentation enregistrée avec succès.");
    } catch (err) {
      setPresentationError(err?.response?.data?.message || "Erreur lors de l'enregistrement de la présentation");
    } finally {
      setPresentationSaving(false);
    }
  };

  const canManagePieces = user?.role === "garage" || user?.role === "admin";
  const isStoreView = false;
  const storeDisplayName = myProfile?.store_name || garageForm.name || user?.name || "Garage";
  const storeDescription = myProfile?.store_description || garageForm.description || "Spécialiste en services et entretien automobile";
  const vendorRole = myProfile?.role || user?.role || "garage";
  const vendorEmail = myProfile?.email || user?.email || "Non renseigné";
  const vendorPhone = myProfile?.phone || garageForm.telephone || "Non renseigné";
  const storeSpecialties = splitLines(garage?.specialties || garageForm.specialties || myProfile?.store_specialties, ["Aucune spécialité renseignée"]);
  const storeHours = splitLines(garage?.work_hours || garageForm.work_hours || myProfile?.store_hours, ["Horaires non renseignés"]);
  const storeServices = splitLines(
    garage?.services_catalog || garageForm.services_catalog || myProfile?.store_services,
    ["Aucun service complémentaire renseigné"]
  );

  const toggleSelection = (value, setter) => {
    setter((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const renderFilterButton = (label, count, onClick, Icon) => (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-[#dde3ec] bg-white px-4 py-2 text-sm font-semibold text-[#5e6d86] transition hover:border-blue-300 hover:text-blue-600"
    >
      <Icon className="h-4 w-4" />
      {label}{count > 0 ? ` (${count})` : ""}
    </button>
  );

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(30,64,175,0.10),_transparent_30%),linear-gradient(180deg,_#f6f9ff_0%,_#ffffff_100%)]">
        <div className="mx-auto max-w-[1400px] px-4 py-4 space-y-5 sm:px-6 sm:py-6">
          <header className="relative overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.97)_0%,rgba(243,248,255,0.96)_100%)] px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:px-6 sm:py-6">
            <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-blue-100/70 blur-3xl" />
            <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-sky-100/70 blur-3xl" />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex items-start gap-4">
                <button type="button" className="mt-1 rounded-2xl border border-blue-200 bg-white p-2.5 text-blue-500 shadow-sm transition hover:border-blue-300 hover:shadow">
                  <Menu className="h-6 w-6" />
                </button>
                <div className="space-y-2">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-[#10243f] sm:text-4xl">Gestion du garage</h1>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                      Configurez votre garage, gérez sa présentation et gardez une vue claire sur vos services et vos avis.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3">
                    <div className="rounded-2xl border border-blue-100 bg-white/90 px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-500">Services actifs</p>
                      <p className="mt-1 text-2xl font-black text-[#10243f]">{activeServicesCount}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-white/90 px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-500">Avis clients</p>
                      <p className="mt-1 text-2xl font-black text-[#10243f]">{reviewSummary.reviews_count}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-500">Note moyenne</p>
                      <p className="mt-1 text-2xl font-black text-[#10243f]">{reviewSummary.average_rating}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="relative mt-5 grid gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  className="w-full border-0 bg-transparent p-0 text-base text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0"
                  placeholder="Rechercher dans le dashboard"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {renderFilterButton("Marques", selectedBrands.length, () => setShowBrandsModal(true), Home)}
                {renderFilterButton("Spécialités", selectedSpecialties.length, () => setShowSpecialtiesModal(true), Settings)}
                {renderFilterButton("Services", selectedServices.length, () => openServicesModal(), Wrench)}
                {renderFilterButton("Ouvert", selectedOpenModes.length, () => setShowOpenModal(true), Clock3)}
                {renderFilterButton("Déplacement", selectedDeplacement ? 1 : 0, () => setShowDeplacementModal(true), Truck)}
              </div>
            </div>
          </header>

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {successMessage && <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</p>}

          {showBrandsModal && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/45 p-3 sm:items-center">
              <div className="max-h-[92vh] w-full max-w-[980px] overflow-y-auto rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-2xl sm:px-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 sm:text-4xl">Choisir • Marques</h3>
                  <button type="button" onClick={() => setShowBrandsModal(false)} className="text-3xl text-slate-500">×</button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                  {garageBrands.map((brand) => {
                    const active = selectedBrands.includes(brand);
                    const logoCandidates = getBrandLogoCandidates(brand);
                    const logoUrl = logoCandidates[0] || "";
                    const fallbackImage = buildMarqueImage(brand);

                    return (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => toggleSelection(brand, setSelectedBrands)}
                        className={`overflow-hidden rounded-[22px] border bg-white p-2 text-center transition ${active ? "border-blue-300 shadow-[0_0_0_2px_rgba(59,130,246,0.16)]" : "border-slate-200"}`}
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
                  {garageSpecialties.map((specialty) => {
                    const active = selectedSpecialties.includes(specialty);
                    return (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => toggleSelection(specialty, setSelectedSpecialties)}
                        className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"}`}
                      >
                        {specialty}
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
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Spécialité:</span>
                    <button
                      type="button"
                      onClick={() => setServiceModalSpecialty("")}
                      className={`rounded-full px-3 py-1 font-semibold ${serviceModalSpecialty === "" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      Toutes
                    </button>
                    {selectedSpecialties.map((specialty) => (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => setServiceModalSpecialty(specialty)}
                        className={`rounded-full px-3 py-1 font-semibold ${serviceModalSpecialty === specialty ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {specialty}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(serviceModalSpecialty ? garageServicesBySpecialty[serviceModalSpecialty] || [] : garageServicesCatalog).map((service) => {
                      const active = selectedServices.includes(service);
                      return (
                        <button
                          key={service}
                          type="button"
                          onClick={() => toggleSelection(service, setSelectedServices)}
                          className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"}`}
                        >
                          {service}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showOpenModal && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/45 p-3 sm:items-center">
              <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-2xl sm:px-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900 sm:text-4xl">Choisir • Ouverture</h3>
                  <button type="button" onClick={() => setShowOpenModal(false)} className="text-3xl text-slate-500">×</button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {['Ouvert maintenant', ...openingDays].map((option) => {
                    const active = selectedOpenModes.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleSelection(option, setSelectedOpenModes)}
                        className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"}`}
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
                  {displacementOptions.map((option) => {
                    const active = selectedDeplacement === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSelectedDeplacement(option)}
                        className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Utilisez le bouton de localisation pour centrer la carte sur votre position, puis choisissez le rayon de déplacement.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr]">
            <section className="vb-card p-4">
              <div ref={mapContainerRef} className="garage-map" />

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleLocateMe}
                  className="rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-blue-500"
                >
                  {isLocating ? "Localisation..." : "Position GPS"}
                </button>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => openServicesModal()} className="rounded-lg border border-[#dbe2ec] bg-white p-2 text-[#45556f]">
                    <Wrench className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => setActivePanel("presentation")} className="rounded-lg border border-[#dbe2ec] bg-white p-2 text-[#45556f]">
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="grid grid-cols-1 gap-3 rounded-[24px] border border-slate-200 bg-white/90 p-2 shadow-[0_16px_32px_rgba(15,23,42,0.06)] sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setActivePanel("garage")}
                  className={`rounded-2xl px-4 py-3 text-center text-base font-extrabold transition ${activePanel === "garage" ? "bg-[linear-gradient(135deg,#1e3a8a_0%,#2563eb_100%)] text-white shadow-md shadow-blue-900/15" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Garage
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel("presentation")}
                  className={`rounded-2xl px-4 py-3 text-center text-base font-extrabold transition ${activePanel === "presentation" ? "bg-[linear-gradient(135deg,#1e3a8a_0%,#2563eb_100%)] text-white shadow-md shadow-blue-900/15" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Présentation
                </button>
              </div>

              {activePanel === "garage" && (
                <article className="vb-card p-6">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">Espace garage</p>
                      <h2 className="text-3xl font-black text-[#1a2b4b]">Gérer le garage</h2>
                    </div>
                    <p className="max-w-xl text-sm leading-6 text-[#617089]">
                      Mettez à jour votre fiche, vos spécialités, vos photos et votre position pour une présentation plus claire côté utilisateur.
                    </p>
                  </div>
                  {isGarageLoading ? (
                    <p className="text-sm text-[#617089]">Chargement du profil...</p>
                  ) : (
                    <form className="grid grid-cols-1 gap-4" onSubmit={handleSaveGarage}>
                      <label className="text-sm font-semibold text-[#334155]">
                        Titre Poi
                        <input name="name" className="vb-input mt-1 w-full px-3 py-2" value={garageForm.name} onChange={handleGarageFieldChange} required />
                      </label>

                      <label className="text-sm font-semibold text-[#334155]">
                        Description
                        <textarea name="description" className="vb-input mt-1 w-full px-3 py-2" value={garageForm.description} onChange={handleGarageFieldChange} rows={3} placeholder="Décrivez votre point d'intérêt" />
                      </label>

                      <div className="rounded-xl border border-[#ebedf2] bg-[#f8f9fb] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#334155]">Choisir spécialité</p>
                          <button type="button" onClick={() => setShowSpecialtiesModal(true)} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600">Sélectionner</button>
                        </div>
                        {selectedSpecialties.length === 0 ? (
                          <p className="text-xs text-[#6d7482]">Aucune spécialité choisie.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {selectedSpecialties.map((item) => (
                              <span key={item} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{item}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-[#ebedf2] bg-[#f8f9fb] p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[#334155]">Services de la spécialité</p>
                          <button type="button" onClick={() => openServicesModal()} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600">Sélectionner</button>
                        </div>
                        {selectedSpecialties.length === 0 ? (
                          <p className="text-xs text-[#6d7482]">Choisis d'abord une spécialité pour afficher ses services.</p>
                        ) : (
                          <div className="space-y-4">
                            {selectedSpecialties.map((specialty) => {
                              const servicesForSpecialty = garageServicesBySpecialty[specialty] || [];
                              const chosenForSpecialty = selectedServices.filter((service) => servicesForSpecialty.includes(service));

                              return (
                                <div key={specialty} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                                  <div className="mb-3 flex items-center justify-between gap-3">
                                    <p className="text-sm font-bold text-blue-600">{specialty}</p>
                                    <button type="button" onClick={() => openServicesModal(specialty)} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600">
                                      Voir services
                                    </button>
                                  </div>
                                  {chosenForSpecialty.length === 0 ? (
                                    <p className="text-xs text-[#6d7482]">Aucun service sélectionné pour cette spécialité.</p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {chosenForSpecialty.map((item) => (
                                        <span key={item} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{item}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <label className="text-sm font-semibold text-[#334155]">
                        Numero de telephone
                        <input name="telephone" className="vb-input mt-1 w-full px-3 py-2" value={garageForm.telephone} onChange={handleGarageFieldChange} />
                      </label>

                      <label className="text-sm font-semibold text-[#334155]">
                        Adresse
                        <input name="adresse" className="vb-input mt-1 w-full px-3 py-2" value={garageForm.adresse} onChange={handleGarageFieldChange} />
                      </label>

                      <label className="text-sm font-semibold text-[#334155]">
                        Mots cles (nom affiche sur la carte)
                        <input name="keywords" className="vb-input mt-1 w-full px-3 py-2" value={garageForm.keywords} onChange={handleGarageFieldChange} placeholder="Nom visible sur la carte" />
                      </label>

                      <div className="rounded-xl border border-[#ebedf2] bg-[#f8f9fb] p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#334155]">Ajouter des photos (galerie PC)</p>
                          <button
                            type="button"
                            onClick={() => photoFileInputRef.current?.click()}
                            className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600"
                          >
                            Choisir des photos
                          </button>
                        </div>
                        <input
                          ref={photoFileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoPickerChange}
                          className="hidden"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          {Array.from({ length: 9 }).map((_, index) => {
                            const src = photoItems[index];
                            return (
                              <div
                                key={`photo-slot-${index}`}
                                className="group relative flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-[#e5e7eb] bg-white"
                              >
                                {src ? (
                                  <>
                                    <img src={src} alt={`Photo ${index + 1}`} className="h-full w-full rounded-2xl object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => removePhotoAt(index)}
                                      className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white"
                                    >
                                      X
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => photoFileInputRef.current?.click()}
                                    className="flex h-full w-full items-center justify-center"
                                  >
                                    <ImagePlus className="h-8 w-8 text-blue-400" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-xl border border-[#ebedf2] bg-[#f8f9fb] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#334155]">Horaire de travail</p>
                          <button type="button" onClick={() => updateScheduleRow(setWorkSchedule, 0, { enabled: true })} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600">
                            Remplir par défaut
                          </button>
                        </div>
                        <div className="space-y-3">
                          {workSchedule.map((row, index) => (
                            <div key={row.day} className="grid grid-cols-[30px_1fr_110px_110px] items-center gap-2">
                              <input
                                type="checkbox"
                                checked={row.enabled}
                                onChange={(event) => updateScheduleRow(setWorkSchedule, index, { enabled: event.target.checked })}
                                className="h-6 w-6 accent-blue-500"
                              />
                              <span className="text-2xl font-semibold text-[#1f2937]">{row.day}</span>
                              <input
                                type="time"
                                value={row.start}
                                onChange={(event) => updateScheduleRow(setWorkSchedule, index, { start: event.target.value })}
                                disabled={!row.enabled}
                                className="rounded-2xl border-2 border-blue-400 bg-white px-3 py-2 text-center text-lg font-semibold text-[#6b7280] disabled:border-[#a1a1aa] disabled:bg-[#f3f4f6]"
                              />
                              <input
                                type="time"
                                value={row.end}
                                onChange={(event) => updateScheduleRow(setWorkSchedule, index, { end: event.target.value })}
                                disabled={!row.enabled}
                                className="rounded-2xl border-2 border-blue-400 bg-white px-3 py-2 text-center text-lg font-semibold text-[#6b7280] disabled:border-[#a1a1aa] disabled:bg-[#f3f4f6]"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-[#ebedf2] bg-[#f8f9fb] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#334155]">Horaire de déplacement (jour)</p>
                          <button type="button" onClick={() => setShowOpenModal(true)} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600">Choisir jours</button>
                        </div>
                        {selectedOpenModes.length === 0 ? (
                          <p className="text-xs text-[#6d7482]">Aucun jour sélectionné.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {selectedOpenModes.map((item) => (
                              <span key={item} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{item}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-[#ebedf2] bg-[#f8f9fb] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#334155]">Déplacement</p>
                          <button type="button" onClick={() => setShowDeplacementModal(true)} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600">Choisir</button>
                        </div>
                        <p className="text-xs font-semibold text-[#334155]">Sélection actuelle: {selectedDeplacement || "-"}</p>
                      </div>

                      <div className="rounded-xl border border-[#ebedf2] bg-[#f8f9fb] p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#334155]">Véhicules (marques avec logo)</p>
                          <button type="button" onClick={() => setShowBrandsModal(true)} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600">Choisir marques</button>
                        </div>
                        {selectedBrands.length === 0 ? (
                          <p className="text-xs text-[#6d7482]">Aucune marque sélectionnée.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {selectedBrands.map((brand) => {
                              const logoCandidates = getBrandLogoCandidates(brand);
                              const logoUrl = logoCandidates[0] || "";
                              const fallbackImage = buildMarqueImage(brand);
                              return (
                                <div key={brand} className="rounded-xl border border-slate-200 bg-white p-2 text-center">
                                  <div className="mx-auto mb-2 flex h-14 w-full items-center justify-center rounded-lg bg-slate-50 p-1">
                                    <img
                                      src={logoUrl || fallbackImage}
                                      alt={brand}
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
                                  <p className="truncate text-xs font-semibold text-slate-700">{brand}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="rounded-[22px] border border-[#ebedf2] bg-[linear-gradient(180deg,#f8f9fb_0%,#ffffff_100%)] p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-500">Publier point d'interet</p>
                            <h3 className="mt-1 text-lg font-black text-[#1a2b4b]">Informations avancées</h3>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-[#64748b]">
                              Utilise la carte pour placer ton point d'intérêt avec précision, puis publie-le quand tout est prêt.
                            </p>
                          </div>

                          <label className="inline-flex items-center gap-3 rounded-full border border-[#dbe2ec] bg-white px-4 py-2 text-sm font-semibold text-[#334155] shadow-sm">
                            <input type="checkbox" name="is_open" checked={Boolean(garageForm.is_open)} onChange={handleGarageFieldChange} />
                            <span>{garageForm.is_open ? "Publié" : "Brouillon"}</span>
                          </label>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <button type="button" onClick={handleLocateMe} className="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50">
                            Utiliser ma position GPS
                          </button>
                          <button type="button" onClick={handleFocusMap} className="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-50">
                            Ouvrir la carte pour choisir
                          </button>
                        </div>

                        <div className="mt-4 rounded-2xl border border-dashed border-[#dbe2ec] bg-white px-4 py-3 text-sm text-[#475569]">
                          Astuce: clique sur la carte Google Maps pour définir la position GPS exacte de ton point d'intérêt.
                          <div className="mt-2 font-semibold text-[#1e293b]">
                            Position actuelle: {garageForm.latitude || "-"}, {garageForm.longitude || "-"}
                          </div>
                        </div>
                      </div>

                      <button type="submit" className="rounded-xl bg-[linear-gradient(135deg,#1e3a8a_0%,#2563eb_100%)] px-5 py-3 text-base font-bold text-white shadow-[0_12px_22px_rgba(30,64,175,0.18)] hover:brightness-105">
                        Enregistrer le garage
                      </button>
                    </form>
                  )}
                </article>
              )}

              {activePanel === "presentation" && (
                <section className="space-y-5">
                  {canManagePieces && !isStoreView && (
                    <form onSubmit={handlePresentationSave} className="rounded-3xl border border-[#ececec] bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-2xl font-black text-slate-900">Éditer la présentation</h3>
                        {presentationSaving && <span className="text-sm font-semibold text-blue-700">Enregistrement...</span>}
                      </div>

                      {presentationError && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{presentationError}</div>}
                      {presentationMessage && <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{presentationMessage}</div>}

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input name="store_name" value={presentationForm.store_name} onChange={handlePresentationChange} placeholder="Nom du garage" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-blue-300" />
                        <input name="store_address" value={presentationForm.store_address} onChange={handlePresentationChange} placeholder="Adresse" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-blue-300" />
                        <textarea name="store_description" value={presentationForm.store_description} onChange={handlePresentationChange} placeholder="Description" rows={3} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-blue-300 sm:col-span-2" />
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button type="submit" disabled={presentationSaving} className="rounded-full bg-[linear-gradient(135deg,#1e3a8a_0%,#2563eb_100%)] px-5 py-3 text-base font-bold text-white shadow-[0_12px_22px_rgba(30,64,175,0.18)] disabled:opacity-60">
                          {presentationSaving ? "Sauvegarde..." : "Enregistrer la présentation"}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">{storeDisplayName}</h2>
                    <p className="mt-2 text-lg text-slate-700">{storeDescription}</p>
                    <p className="mt-3 text-base font-semibold text-slate-700">Adresse: {garage?.adresse || garageForm.adresse || myProfile?.store_address || "Non renseignée"}</p>
                    <p className="text-base font-semibold text-slate-700">Role: {vendorRole}</p>
                    <p className="text-base font-semibold text-slate-700">Email: {vendorEmail}</p>
                    <p className="text-base font-semibold text-slate-700">Telephone: {vendorPhone}</p>
                    {profileLoading && <p className="mt-2 text-sm text-slate-500">Chargement du profil...</p>}
                  </div>

                  {garage?.latitude && garage?.longitude && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)] space-y-4">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                          <MapPin className="w-6 h-6 text-blue-600" />
                          Localisation du garage
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                          Latitude: {garage.latitude} • Longitude: {garage.longitude}
                        </p>
                      </div>
                      <div ref={mapContainerRef} className="w-full h-80 rounded-2xl border border-slate-200 overflow-hidden shadow-md" />
                      {userPosition && (
                        <div className={`rounded-2xl border-2 p-4 ${getDistanceColor(calculateDistance(userPosition[0], userPosition[1], Number(garage.latitude), Number(garage.longitude)))}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-5 h-5" />
                              <div>
                                <p className="font-semibold text-sm">Distance depuis vous</p>
                                <p className="text-xs opacity-75">{getDistanceLabel(calculateDistance(userPosition[0], userPosition[1], Number(garage.latitude), Number(garage.longitude)))}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black">{formatDistance(calculateDistance(userPosition[0], userPosition[1], Number(garage.latitude), Number(garage.longitude)))}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <h3 className="text-2xl font-black text-slate-900">Indicateurs en temps réel</h3>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Total services</p>
                        <p className="text-3xl font-black text-slate-900">{services.length}</p>
                      </div>
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-center">
                        <p className="text-xs uppercase tracking-wide text-blue-700">Services actifs</p>
                        <p className="text-3xl font-black text-blue-700">{activeServicesCount}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Avis publiés</p>
                        <p className="text-3xl font-black text-slate-900">{reviewSummary.reviews_count}</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-blue-100 bg-[linear-gradient(135deg,rgba(239,246,255,1)_0%,rgba(219,234,254,0.8)_100%)] p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                            Réception de RDV
                          </p>
                          <h4 className="mt-1 text-lg font-black text-slate-900">
                            Recevoir RDV
                          </h4>
                          <p className="mt-1 text-sm text-slate-600">
                            Ouvre l’interface pour recevoir, valider ou refuser les demandes de rendez-vous.
                          </p>
                        </div>
                        <Link
                          to="/garage/appointments"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Recevoir RDV
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Appointments panel: receive and handle incoming requests */}
                  {hasGarageProfile && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                      <h3 className="text-2xl font-black text-slate-900">Demandes de rendez-vous</h3>
                      <div className="mt-4">
                        <GarageDashboardAppointments garageId={garage.id} />
                      </div>
                    </div>
                  )}

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <h3 className="text-2xl font-black text-slate-900">Spécialités</h3>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {storeSpecialties.map((item) => (
                        <span key={item} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-center text-sm font-bold text-slate-800">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <h3 className="text-2xl font-black text-slate-900">Horaires de travail</h3>
                    <div className="mt-3 space-y-1 text-lg text-slate-700">
                      {storeHours.map((line, index) => (
                        <p key={line} className={index === 5 ? "font-bold text-blue-700" : ""}>{line}</p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <h3 className="text-2xl font-black text-slate-900">Services complémentaires</h3>
                    <ul className="mt-3 space-y-2 text-lg text-slate-700">
                      {storeServices.map((service) => (
                        <li key={service}>✅ {service}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-2xl font-black text-slate-900">Avis clients</h3>
                      <p className="text-sm text-slate-500">Les avis restent disponibles depuis cette vue de présentation.</p>
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <article className="rounded-lg border border-[#dbe2ec] bg-white p-3 text-center">
                        <p className="text-xs text-[#617089]">Total avis</p>
                        <p className="text-xl font-black text-[#12223d]">{reviewSummary.reviews_count}</p>
                      </article>
                      <article className="rounded-lg border border-[#dbe2ec] bg-white p-3 text-center">
                        <p className="text-xs text-[#617089]">Moyenne</p>
                        <p className="text-xl font-black text-[#12223d]">{reviewSummary.average_rating}</p>
                      </article>
                      <article className="rounded-lg border border-[#dbe2ec] bg-white p-3 text-center">
                        <p className="text-xs text-[#617089]">Note min</p>
                        <p className="text-xl font-black text-[#12223d]">{reviewSummary.min_rating}</p>
                      </article>
                      <article className="rounded-lg border border-[#dbe2ec] bg-white p-3 text-center">
                        <p className="text-xs text-[#617089]">Note max</p>
                        <p className="text-xl font-black text-[#12223d]">{reviewSummary.max_rating}</p>
                      </article>
                    </div>

                    {isReviewsLoading ? (
                      <p className="text-sm text-[#617089]">Chargement des avis...</p>
                    ) : reviews.length === 0 ? (
                      <p className="text-sm text-[#617089]">Aucun avis disponible pour ce garage.</p>
                    ) : (
                      <ul className="space-y-3">
                        {reviews.map((review) => (
                          <li key={review.id} className="rounded-lg border border-[#dbe2ec] bg-white p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-base font-bold text-[#1a2b4b]">{review.reviewer?.name || "Client"}</p>
                                <p className="text-sm text-[#617089]">Note: {review.rating}/5</p>
                                <p className="mt-1 text-sm text-[#334155]">{review.comment || "Aucun commentaire"}</p>
                              </div>
                              <div className="text-right">
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${review.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                  {review.is_published ? "Publie" : "Cache"}
                                </span>
                                <p className="mt-2 text-xs text-[#617089]">{new Date(review.created_at).toLocaleDateString("fr-FR")}</p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <button
                                type="button"
                                className="vb-btn-outline px-3 py-1.5 text-sm"
                                onClick={() => handleTogglePublished(review)}
                              >
                                {review.is_published ? "Masquer" : "Publier"}
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              )}
            </section>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
};

export default GarageDashboard;



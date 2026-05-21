// =====================================
// REACT COMPONENT: CataloguePieces.jsx
// FOLDER: vendeur
// =====================================

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, Navigation2, Package, TrendingDown } from "lucide-react";
import { comparePieceAcrossVendors, createPiece, deletePiece, getMyPieces, getPieceById, getPieces, updatePiece } from "../../services/pieces";
import { extractConversationAndMessages, startChatConversation } from "../../services/chat";
import { getCompleteProfile, getCompleteProfileById, updateProfile } from "../../services/user";
import PlatformLayout from "../../components/PlatformLayout";
import { AuthContext } from "../../context/AuthContext";
import { calculateDistance, formatDistance, getDistanceColor, getDistanceLabel } from "../../utils/distanceCalculator";

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = "AIzaSyCojlT8OsuCl0W4b0Pto2m1GbfUl9FF1pE";

const initialFilters = {
  search: "",
  sortBy: "created_at",
  sortOrder: "desc",
  limit: 12,
  stockFilter: "all",
  condition: "all",
  zone: "all"
};

const quickFilters = [
  { label: "Marques", value: "all" },
  { label: "Modeles", value: "in_stock" },
  { label: "Categories", value: "out_of_stock" }
];

const conditionFilters = [
  { label: "Neuf", value: "Neuf" },
  { label: "Occasion", value: "Occasion" }
];

const zoneFilters = [
  { label: "Nord", value: "Nord" },
  { label: "Sud", value: "Sud" },
  { label: "Est", value: "Est" },
  { label: "Ouest", value: "Ouest" },
  { label: "Centre", value: "Centre" }
];

const marques = [
  "Audi", "BMW", "BYD", "Changan", "Chery", "Chevrolet", "Citroën", "Cupra",
  "Daewoo", "Dacia", "DFM", "FAW", "Fiat", "Ford", "Foton", "Geely", "Great Wall",
  "Haval", "Honda", "Hyundai", "Isuzu", "JAC", "Jeep", "Kia", "Lada", "Land Rover",
  "MG", "Mitsubishi", "Nissan", "Peugeot", "Renault", "Rolls-Royce", "Seat", "Skoda",
  "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo", "Wuling", "Xpeng", "Zotye"
].sort();

const modelsByMarque = {
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8", "e-tron"],
  "BMW": ["Serie 1", "Serie 2", "Serie 3", "Serie 4", "Serie 5", "Serie 7", "X1", "X3", "X5", "X6", "X7", "i4", "iX"],
  "BYD": ["Atto 3", "Dolphin", "Han", "Qin", "Seal", "Song Plus", "Tang", "Yuan Plus"],
  "Changan": ["Alsvin", "CS15", "CS35", "CS55", "CS75", "Eado", "Hunter", "UNI-T"],
  "Chery": ["Arrizo 5", "Arrizo 8", "Tiggo 2", "Tiggo 3", "Tiggo 4", "Tiggo 7", "Tiggo 8"],
  "Chevrolet": ["Aveo", "Camaro", "Captiva", "Cruze", "Malibu", "Spark", "Tahoe", "Trailblazer"],
  "Citroën": ["C1", "C3", "C4", "C5", "C-Elysee", "Berlingo", "Jumpy", "Jumper"],
  "Cupra": ["Ateca", "Born", "Formentor", "Leon", "Tavascan", "Terramar"],
  "Daewoo": ["Cielo", "Espero", "Kalos", "Lanos", "Leganza", "Matiz", "Nubira"],
  "Dacia": ["Duster", "Jogger", "Lodgy", "Logan", "Sandero", "Spring"],
  "DFM": ["AX3", "AX4", "AX7", "Glory 330", "Glory 500", "Rich 6", "S50"],
  "FAW": ["Bestune B30", "Bestune T33", "Bestune T77", "Oley", "V2", "V5", "X40"],
  "Fiat": ["500", "500X", "Doblo", "Ducato", "Egea", "Panda", "Punto", "Tipo"],
  "Ford": ["EcoSport", "Fiesta", "Focus", "Kuga", "Mondeo", "Mustang", "Ranger", "Transit"],
  "Foton": ["Aumark", "Gratour", "Sauvana", "Toano", "Tunland", "View", "View CS2"],
  "Geely": ["Atlas", "Coolray", "Emgrand", "GC6", "Geometry C", "Monjaro", "Tugella"],
  "Great Wall": ["C30", "C50", "Florid", "H3", "H5", "Poer", "Wingle 5", "Wingle 7"],
  "Haval": ["Dargo", "H2", "H6", "H7", "H9", "Jolion", "M6"],
  "Honda": ["Accord", "BR-V", "CR-V", "Civic", "City", "Fit", "HR-V", "Pilot"],
  "Hyundai": ["Accent", "Creta", "Elantra", "i10", "i20", "i30", "Santa Fe", "Sonata", "Tucson"],
  "Isuzu": ["D-Max", "MU-X", "NPR", "NQR", "Trooper", "VehiCROSS"],
  "JAC": ["J4", "J5", "JS2", "JS3", "JS4", "JS6", "T6", "T8"],
  "Jeep": ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Liberty", "Renegade", "Wrangler"],
  "Kia": ["Carens", "Carnival", "Ceed", "Cerato", "Picanto", "Rio", "Sorento", "Sportage"],
  "Lada": ["Granta", "Kalina", "Niva", "Priora", "Samara", "Vesta", "XRAY"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  "MG": ["MG3", "MG4", "MG5", "MG6", "HS", "Marvel R", "RX5", "ZS"],
  "Mitsubishi": ["ASX", "Eclipse Cross", "L200", "Lancer", "Montero", "Outlander", "Pajero"],
  "Nissan": ["Almera", "Altima", "Juke", "Leaf", "Micra", "Navara", "Pathfinder", "Qashqai", "Sentra", "X-Trail"],
  "Peugeot": ["2008", "206", "207", "208", "3008", "301", "307", "308", "405", "408", "5008", "Partner"],
  "Renault": ["Captur", "Clio", "Express", "Kadjar", "Kangoo", "Koleos", "Master", "Megane", "Symbol", "Talisman", "Twingo"],
  "Rolls-Royce": ["Cullinan", "Dawn", "Ghost", "Phantom", "Spectre", "Wraith"],
  "Seat": ["Alhambra", "Arona", "Ateca", "Ibiza", "Leon", "Mii", "Toledo"],
  "Skoda": ["Fabia", "Kamiq", "Karoq", "Kodiaq", "Octavia", "Rapid", "Scala", "Superb"],
  "Suzuki": ["Alto", "Baleno", "Celerio", "Dzire", "Ertiga", "Jimny", "Swift", "Vitara"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck", "Roadster"],
  "Toyota": ["Auris", "Avensis", "C-HR", "Camry", "Corolla", "Fortuner", "Hilux", "Land Cruiser", "Prius", "RAV4", "Yaris"],
  "Volkswagen": ["Amarok", "Arteon", "Beetle", "Golf", "Jetta", "Passat", "Polo", "T-Cross", "T-Roc", "Tiguan", "Touareg"],
  "Volvo": ["C40", "S60", "S90", "V40", "V60", "V90", "XC40", "XC60", "XC90"],
  "Wuling": ["Almaz", "Confero", "Cortez", "Formo", "Hongguang", "Victory", "Yangguang"],
  "Xpeng": ["G3", "G6", "G9", "P5", "P7", "X9"],
  "Zotye": ["T300", "T500", "T600", "Z100", "Z300", "Z500"]
};

const categories = [
  "Moteur",
  "Échappement",
  "Intérieur",
  "Refroidissement et Climatisation",
  "Freinage",
  "Train Avant-Arrière",
  "Roue",
  "Carrosserie latérale gauche",
  "Pièces latérale droite",
  "Toit voiture",
  "Carrosserie Arrière",
  "Pièces Face Avant",
  "Accessoires",
  "Huiles et Fluides",
  "Batterie"
].sort();

const chatRouteByRole = {
  automobiliste: "/automobiliste/messages",
  garage: "/garage/messages",
  vendeur: "/vendeur/messages",
  admin: "/vendeur/messages"
};

const marqueStyleByName = {
  Audi: "from-slate-100 to-white",
  BMW: "from-sky-100 to-white",
  Citroën: "from-red-100 to-white",
  Ford: "from-blue-100 to-white",
  Hyundai: "from-indigo-100 to-white",
  Peugeot: "from-zinc-100 to-white",
  Renault: "from-amber-100 to-white",
  Toyota: "from-rose-100 to-white",
  Volkswagen: "from-cyan-100 to-white"
};

const categoryVisual = {
  Moteur: { icon: "⚙", color: "from-zinc-100 to-white" },
  "Échappement": { icon: "🛠", color: "from-slate-100 to-white" },
  "Intérieur": { icon: "🪑", color: "from-stone-100 to-white" },
  "Refroidissement et Climatisation": { icon: "❄", color: "from-cyan-100 to-white" },
  Freinage: { icon: "🛑", color: "from-rose-100 to-white" },
  "Train Avant-Arrière": { icon: "🧩", color: "from-violet-100 to-white" },
  Roue: { icon: "⭕", color: "from-slate-100 to-white" },
  "Carrosserie latérale gauche": { icon: "🚘", color: "from-indigo-100 to-white" },
  "Pièces latérale droite": { icon: "🚗", color: "from-blue-100 to-white" },
  "Toit voiture": { icon: "â¬’", color: "from-zinc-100 to-white" },
  "Carrosserie Arrière": { icon: "🔧", color: "from-gray-100 to-white" },
  "Pièces Face Avant": { icon: "🚙", color: "from-emerald-100 to-white" },
  Accessoires: { icon: "🧰", color: "from-amber-100 to-white" },
  "Huiles et Fluides": { icon: "🧴", color: "from-yellow-100 to-white" },
  Batterie: { icon: "🔋", color: "from-lime-100 to-white" }
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
  "Rolls-Royce": "rolls-roycemotorcars.com",
  Seat: "seat.com",
  Skoda: "skoda-auto.com",
  SsangYong: "kg-mobility.com",
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
  const normalized = marque
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

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
  const remoteCandidates = domain
    ? [
        `https://logo.clearbit.com/${encodeURIComponent(domain)}`,
        `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
      ]
    : [];

  return [...localCandidates, ...remoteCandidates];
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
    <rect x='24' y='26' width='272' height='116' rx='18' fill='rgba(255,255,255,0.72)'/>
    <circle cx='64' cy='84' r='22' fill='${accent}' opacity='0.14'/>
    <circle cx='254' cy='84' r='18' fill='${accent}' opacity='0.12'/>
    <text x='160' y='98' text-anchor='middle' font-family='Segoe UI, Arial' font-size='40' font-weight='700' fill='${accent}'>${title}</text>
    <text x='160' y='178' text-anchor='middle' font-family='Segoe UI, Arial' font-size='22' font-weight='600' fill='#1f2937'>${subtitle}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const buildMarqueImage = (marque) => {
  const initials = getMarqueInitials(marque);
  const palette = marqueStyleByName[marque] || "from-slate-50 to-white";
  const top = palette.includes("sky")
    ? "#e0f2fe"
    : palette.includes("indigo")
      ? "#e0e7ff"
      : palette.includes("rose")
        ? "#ffe4e6"
        : palette.includes("amber")
          ? "#fef3c7"
          : "#e2e8f0";

  return buildSvgDataUrl({
    top,
    bottom: "#ffffff",
    title: initials,
    subtitle: marque,
    accent: "#0f172a"
  });
};

const buildCategoryImage = (categorie) => {
  const visual = categoryVisual[categorie] || { icon: "PK", color: "from-slate-50 to-white" };
  const color = visual.color || "from-slate-50 to-white";
  const top = color.includes("cyan")
    ? "#cffafe"
    : color.includes("rose")
      ? "#ffe4e6"
      : color.includes("violet")
        ? "#ede9fe"
        : color.includes("lime")
          ? "#ecfccb"
          : color.includes("amber")
            ? "#fef3c7"
            : "#e2e8f0";

  return buildSvgDataUrl({
    top,
    bottom: "#ffffff",
    title: visual.icon,
    subtitle: "Catégorie",
    accent: "#1e293b"
  });
};

const getCompatibleVehiclesForPiece = (piece) => {
  const marque = piece?.marque;
  const modele = piece?.modele;
  const modeles = marque ? (modelsByMarque[marque] || []) : [];

  if (modele) {
    return [
      `${marque || "Véhicule"} ${modele}`,
      ...modeles.filter((item) => item !== modele).slice(0, 4).map((item) => `${marque} ${item}`)
    ].filter(Boolean);
  }

  if (marque && modeles.length > 0) {
    return modeles.slice(0, 5).map((item) => `${marque} ${item}`);
  }

  return [];
};

const getPieceImageFallback = (piece) => {
  if (piece?.categorie) {
    return buildCategoryImage(piece.categorie);
  }

  if (piece?.marque) {
    return buildMarqueImage(piece.marque);
  }

  return buildSvgDataUrl({
    top: "#f1f5f9",
    bottom: "#ffffff",
    title: "PI",
    subtitle: "Piece",
    accent: "#1e293b"
  });
};

const getPieceImageUrl = (piece, backendBaseUrl) => {
  if (piece?.photo_url) {
    return piece.photo_url.startsWith("http") ? piece.photo_url : `${backendBaseUrl}${piece.photo_url}`;
  }

  return getPieceImageFallback(piece);
};

const presentationSpecialites = [
  "Pieces consommables",
  "Batterie",
  "Huiles",
  "Pieces d'origine / adaptables",
  "Accessoires interieurs et exterieurs",
  "Produits d'entretien automobile",
  "Carrosserie et pare-chocs",
  "Optiques",
  "Moteurs",
  "Cremaillere"
];

const presentationServices = [
  "Conseil technique",
  "Recherche par reference ou VIN",
  "Orientation selon modele vehicule",
  "Service client reactif",
  "Disponibilite rapide",
  "Prix competitifs"
];

const createEmptyPieceForm = () => ({
  nom: "",
  reference: "",
  description: "",
  prix_unitaire: "",
  stock: "0",
  condition: "Neuf",
  zone_geographique: "",
  marque: "",
  modele: "",
  categorie: "",
  photo_piece: null,
  latitude: null,
  longitude: null
});

const splitLines = (value, fallback) => {
  const source = typeof value === "string" ? value : "";
  const lines = source
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  return lines.length > 0 ? lines : fallback;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR");
};

const normalizeOfferGroupKey = (piece) => {
  const reference = String(piece?.reference || "").trim().toLowerCase();
  if (reference) {
    return `ref:${reference}`;
  }

  const nom = String(piece?.nom || "").trim().toLowerCase();
  return nom ? `nom:${nom}` : `piece:${piece?.id || "unknown"}`;
};

const buildGoogleMapsEmbedUrl = (query) => {
  const safeQuery = String(query || "Tunisie").trim() || "Tunisie";
  return `https://www.google.com/maps?q=${encodeURIComponent(safeQuery)}&output=embed`;
};

const buildGoogleMapsSearchUrl = (query) => {
  const safeQuery = String(query || "Tunisie").trim() || "Tunisie";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(safeQuery)}`;
};

const buildVendorLocationQuery = (vendor) => {
  if (!vendor) {
    return "";
  }

  if (vendor.latitude !== null && vendor.latitude !== undefined && vendor.longitude !== null && vendor.longitude !== undefined) {
    return `${vendor.latitude},${vendor.longitude}`;
  }

  return [vendor.magasin || vendor.nom || vendor.name, vendor.address, vendor.store_address]
    .filter(Boolean)
    .join(", ");
};

const buildVendorGoogleMapsEmbedUrl = (vendor) => buildGoogleMapsEmbedUrl(buildVendorLocationQuery(vendor));

const buildVendorGoogleMapsSearchUrl = (vendor) => buildGoogleMapsSearchUrl(buildVendorLocationQuery(vendor));

const buildPieceLocationSearchUrl = (piece) => {
  const parts = [piece?.seller_store_name, piece?.seller_name, piece?.zone_geographique, "Tunisie"].filter(Boolean);
  return buildGoogleMapsSearchUrl(parts.join(", "));
};

const getPieceVendorDisplayName = (piece) => {
  if (String(piece?.seller_role || "").toLowerCase() === "admin") {
    return "admin";
  }

  return piece?.seller_store_name || piece?.seller_name || "Vendeur";
};

const CataloguePieces = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("pieces");
  const [profileLoading, setProfileLoading] = useState(false);
  const [myProfile, setMyProfile] = useState(null);
  const [storeProfile, setStoreProfile] = useState(null);
  const [storeOwnerId, setStoreOwnerId] = useState(null);
  const [isStoreView, setIsStoreView] = useState(false);
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
  const isGarageCataloguePage = location.pathname === "/garage/catalogue" || location.pathname.startsWith("/garage/catalogue/");

  useEffect(() => {
    if (isGarageCataloguePage) {
      setActiveTab("pieces");
    }
  }, [isGarageCataloguePage]);

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalItems: 0, totalPages: 0 });

  const [selectedPiece, setSelectedPiece] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState("");
  const [comparisonData, setComparisonData] = useState(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPieceId, setEditingPieceId] = useState(null);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newPiece, setNewPiece] = useState(createEmptyPieceForm);
  const [isForSale, setIsForSale] = useState(false);

  const [showMarquesModal, setShowMarquesModal] = useState(false);
  const [showModelesModal, setShowModelesModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);

  const [selectedMarques, setSelectedMarques] = useState([]);
  const [selectedModeles, setSelectedModeles] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [selectedZone, setSelectedZone] = useState("all");
  const [catalogScope, setCatalogScope] = useState(() => ((user?.role === "vendeur" || user?.role === "admin") ? "private" : "public"));
  const [marketplaceSortBy, setMarketplaceSortBy] = useState("min_price");

  // Google Maps state
  const [showMapModal, setShowMapModal] = useState(false);
  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);

  // Google Maps handlers
  const initializeGoogleMap = () => {
    if (!mapContainerRef.current || !window.google) return;

    const center = { lat: newPiece.latitude || 35.8, lng: newPiece.longitude || 10.2 };
    
    const map = new window.google.maps.Map(mapContainerRef.current, {
      zoom: 13,
      center: center,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      fullscreenControl: true,
      zoomControl: true,
      mapTypeControl: true
    });

    googleMapRef.current = map;

    const markerApi = window.google?.maps?.marker;
    const AdvancedMarkerElement = markerApi?.AdvancedMarkerElement;

    const createMarker = (options) => {
      if (AdvancedMarkerElement) {
        return new AdvancedMarkerElement({
          map: options.map,
          position: options.position,
          title: options.title,
          gmpDraggable: Boolean(options.draggable)
        });
      }

      return new window.google.maps.Marker(options);
    };

    const setMarkerPosition = (targetMarker, position) => {
      if (!targetMarker) return;
      if (typeof targetMarker.setPosition === "function") {
        targetMarker.setPosition(position);
        return;
      }
      targetMarker.position = position;
    };

    const readMarkerPosition = (targetMarker) => {
      if (!targetMarker) return null;
      if (typeof targetMarker.getPosition === "function") {
        return targetMarker.getPosition();
      }
      return targetMarker.position || null;
    };

    // Create marker
    const marker = createMarker({
      position: center,
      map: map,
      draggable: true,
      title: "Cliquez sur la carte ou arrachez pour définir le lieu"
    });

    markerRef.current = marker;

    // Handle marker drag
    marker.addListener("dragend", () => {
      const pos = readMarkerPosition(marker);
      const latitude = typeof pos?.lat === "function" ? pos.lat() : pos?.lat;
      const longitude = typeof pos?.lng === "function" ? pos.lng() : pos?.lng;

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return;
      }

      setNewPiece(prev => ({
        ...prev,
        latitude,
        longitude
      }));
    });

    // Handle map click
    map.addListener("click", (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition(marker, { lat, lng });
      setNewPiece(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
    });
  };

  const handleOpenMapModal = () => {
    setShowMapModal(true);
  };

  const handleSaveLocation = () => {
    if (newPiece.latitude && newPiece.longitude) {
      setShowMapModal(false);
      // Localisation sauvegardée dans newPiece state
    } else {
      alert("Veuillez sélectionner un lieu sur la carte");
    }
  };

  const backendBaseUrl = useMemo(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    return apiUrl.replace(/\/api\/?$/, "");
  }, []);

  const canManagePieces = user?.role === "vendeur";
  const canSeeStoreTabs = isStoreView || user?.role === "vendeur" || user?.role === "garage";

  // Initialize Google Map when modal opens
  useEffect(() => {
    if (showMapModal && mapContainerRef.current) {
      setTimeout(() => initializeGoogleMap(), 100);
    }
  }, [showMapModal]);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await getCompleteProfile();
        const profile = res.data?.data?.user || res.data?.user || null;
        if (isMounted) {
          setMyProfile(profile);
          setPresentationForm({
            store_name: profile?.store_name || "",
            store_address: profile?.store_address || "",
            store_description: profile?.store_description || "",
            store_hours: profile?.store_hours || "",
            store_specialties: profile?.store_specialties || "",
            store_services: profile?.store_services || ""
          });
        }
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
    const fetchPieces = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          page,
          limit: appliedFilters.limit,
          sortBy: appliedFilters.sortBy,
          sortOrder: appliedFilters.sortOrder
        };

        if (appliedFilters.search.trim()) {
          params.search = appliedFilters.search.trim();
        }

        const res = canManagePieces && catalogScope === "private" && !isStoreView
          ? await getMyPieces(params)
          : await getPieces(params);
        const responseData = res.data?.data ?? res.data;

        if (Array.isArray(responseData)) {
          const totalItems = responseData.length;
          const totalPages = Math.max(1, Math.ceil(totalItems / appliedFilters.limit));
          setItems(responseData);
          setPagination({
            page,
            limit: appliedFilters.limit,
            totalItems,
            totalPages
          });
        } else {
          const payload = responseData || {};
          setItems(Array.isArray(payload.items) ? payload.items : []);
          setPagination(payload.pagination || { page: 1, limit: appliedFilters.limit, totalItems: 0, totalPages: 0 });
        }
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors du chargement du catalogue");
        setItems([]);
        setPagination({ page: 1, limit: appliedFilters.limit, totalItems: 0, totalPages: 0 });
      } finally {
        setLoading(false);
        setIsSubmitting(false);
      }
    };

    fetchPieces();
  }, [page, appliedFilters, canManagePieces, catalogScope, isStoreView, storeOwnerId]);

  useEffect(() => {
    if (!canSeeStoreTabs && activeTab !== "pieces") {
      setActiveTab("pieces");
    }
  }, [canSeeStoreTabs, activeTab]);

  useEffect(() => {
    if (!canManagePieces) {
      setCatalogScope("public");
    }
  }, [canManagePieces]);

  // Handle pieceId parameter from URL (for edit/view from Dashboard)
  useEffect(() => {
    const pieceIdParam = searchParams.get("pieceId");
    const editParam = searchParams.get("edit");
    const viewParam = searchParams.get("view");

    if (!pieceIdParam) {
      return;
    }

    const parsedPieceId = Number.parseInt(pieceIdParam, 10);
    if (!Number.isInteger(parsedPieceId) || parsedPieceId <= 0) {
      return;
    }

    // Find the piece in the current items
    const targetPiece = items.find((p) => Number(p.id) === parsedPieceId);
    
    if (targetPiece) {
      if (editParam === "true") {
        // Open edit form
        void openEditPieceModal(targetPiece);
      } else if (viewParam === "true") {
        // Show piece details
        openPieceDetails(targetPiece);
      }
      
      // Clean up the URL params
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("pieceId");
      nextParams.delete("edit");
      nextParams.delete("view");
      setSearchParams(nextParams, { replace: true });
    }
  }, [items, searchParams]);

  const openStoreViewByOwnerId = async (ownerId, options = {}) => {
    const { syncUrl = false, tab = "presentation" } = options;
    const parsedOwnerId = Number.parseInt(ownerId, 10);
    const isValidOwner = Number.isInteger(parsedOwnerId) && parsedOwnerId > 0;
    const nextTab = tab === "pieces" ? "pieces" : "presentation";

    setSelectedPiece(null);
    setIsStoreView(true);
    setStoreOwnerId(isValidOwner ? parsedOwnerId : null);
    setActiveTab(nextTab);

    if (syncUrl && isValidOwner) {
      navigate(`/vendeur/magasin?ownerId=${parsedOwnerId}&tab=${nextTab}`, { replace: true });
    }

    if (isValidOwner) {
      setProfileLoading(true);
      try {
        const res = await getCompleteProfileById(parsedOwnerId);
        const profile = res.data?.data?.user || res.data?.user || null;
        setStoreProfile(profile);
      } catch (_error) {
        setStoreProfile(null);
      } finally {
        setProfileLoading(false);
      }
    } else {
      setStoreProfile(null);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const ownerIdParam = searchParams.get("ownerId");
    const tabParam = searchParams.get("tab");
    const parsedOwnerId = Number.parseInt(ownerIdParam || "", 10);
    const hasValidOwner = Number.isInteger(parsedOwnerId) && parsedOwnerId > 0;

    if (hasValidOwner) {
      openStoreViewByOwnerId(parsedOwnerId, { tab: tabParam === "pieces" ? "pieces" : "presentation" });
      return;
    }

    if ((tabParam === "presentation" || tabParam === "pieces") && canSeeStoreTabs) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const visibleItems = useMemo(() => {
    let filtered = items;

    if (selectedMarques.length > 0) {
      filtered = filtered.filter((item) => selectedMarques.includes(item.marque));
    }

    if (selectedModeles.length > 0) {
      filtered = filtered.filter((item) => selectedModeles.includes(item.modele));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((item) => selectedCategories.includes(item.categorie));
    }

    if (selectedCondition !== "all") {
      filtered = filtered.filter((item) => item.condition === selectedCondition);
    }

    if (selectedZone !== "all") {
      filtered = filtered.filter((item) => item.zone_geographique === selectedZone);
    }

    if (isStoreView && storeOwnerId) {
      filtered = filtered.filter((item) => Number(item.user_id) === Number(storeOwnerId));
    }

    if (appliedFilters.stockFilter === "in_stock") {
      filtered = filtered.filter((item) => Number(item.stock) > 0);
    } else if (appliedFilters.stockFilter === "out_of_stock") {
      filtered = filtered.filter((item) => Number(item.stock) <= 0);
    }

    return filtered;
  }, [items, appliedFilters.stockFilter, selectedMarques, selectedModeles, selectedCategories, selectedCondition, selectedZone, isStoreView, storeOwnerId]);

  const ownSellerId = Number(user?.id || 0);
  const isPublicMarketplace = !isStoreView && catalogScope === "public";

  const scopedItems = useMemo(() => {
    if (isStoreView) {
      return visibleItems;
    }

    const hasValidOwnSellerId = Number.isInteger(ownSellerId) && ownSellerId > 0;

    if (canManagePieces && catalogScope === "private" && hasValidOwnSellerId) {
      return visibleItems.filter((item) => Number(item.user_id) === ownSellerId || item.user_id === null || item.user_id === undefined);
    }

    if (canManagePieces && catalogScope === "private") {
      if (hasValidOwnSellerId) {
        return visibleItems.filter((item) => Number(item.user_id) === ownSellerId || item.user_id === null || item.user_id === undefined);
      }
      return [];
    }

    return visibleItems;
  }, [visibleItems, isStoreView, canManagePieces, catalogScope, ownSellerId]);

  const marketplaceGroups = useMemo(() => {
    if (!isPublicMarketplace) {
      return [];
    }

    const grouped = new Map();

    scopedItems.forEach((piece) => {
      const key = normalizeOfferGroupKey(piece);
      const existing = grouped.get(key);
      if (existing) {
        existing.offers.push(piece);
        return;
      }

      grouped.set(key, {
        key,
        label: piece.reference || piece.nom || "Pièce",
        nom: piece.nom || "Pièce",
        reference: piece.reference || null,
        marque: piece.marque || null,
        modele: piece.modele || null,
        categorie: piece.categorie || null,
        imagePiece: piece,
        offers: [piece]
      });
    });

    return Array.from(grouped.values())
      .map((group) => {
        const offers = [...group.offers].sort((a, b) => {
          const priceA = Number(a.prix_unitaire);
          const priceB = Number(b.prix_unitaire);
          if (priceA === priceB) {
            return Number(b.stock || 0) - Number(a.stock || 0);
          }
          return priceA - priceB;
        });

        const totalStock = offers.reduce((acc, offer) => acc + Number(offer.stock || 0), 0);

        return {
          ...group,
          offers,
          cheapestOffer: offers[0] || null,
          offerCount: offers.length,
          totalStock
        };
      })
      .sort((a, b) => {
        if (marketplaceSortBy === "offers_count") {
          return Number(b.offerCount || 0) - Number(a.offerCount || 0);
        }

        if (marketplaceSortBy === "stock_total") {
          return Number(b.totalStock || 0) - Number(a.totalStock || 0);
        }

        if (marketplaceSortBy === "name") {
          return String(a.nom || "").localeCompare(String(b.nom || ""), "fr", { sensitivity: "base" });
        }

        return Number(a.cheapestOffer?.prix_unitaire || Number.POSITIVE_INFINITY) - Number(b.cheapestOffer?.prix_unitaire || Number.POSITIVE_INFINITY);
      });
  }, [scopedItems, isPublicMarketplace, marketplaceSortBy]);

  

  const availableModeles = useMemo(() => {
    if (selectedMarques.length === 0) return [];
    const merged = selectedMarques.flatMap((marque) => modelsByMarque[marque] || []);
    return Array.from(new Set(merged)).sort();
  }, [selectedMarques]);

  const previewImages = useMemo(() => {
    return scopedItems
      .filter((piece) => piece.photo_url)
      .slice(0, 6)
      .map((piece) => (piece.photo_url.startsWith("http") ? piece.photo_url : `${backendBaseUrl}${piece.photo_url}`));
  }, [scopedItems, backendBaseUrl]);

  const presentationSummary = useMemo(() => {
    const allItems = isStoreView ? scopedItems : scopedItems;
    const inStock = allItems.filter((piece) => Number(piece.stock) > 0).length;
    const outOfStock = allItems.filter((piece) => Number(piece.stock) <= 0).length;

    return {
      totalPieces: allItems.length,
      inStock,
      outOfStock
    };
  }, [scopedItems, isStoreView]);

  const canEditSelectedPiece = Boolean(
    selectedPiece
    && canManagePieces
    && !isPublicMarketplace
    && Number(selectedPiece.user_id) === ownSellerId
  );

  const comparisonOffers = comparisonData?.offres || comparisonData?.offers || [];
  const comparisonSummary = comparisonData?.summary || {};

  const openComparisonView = async (piece) => {
    const targetPiece = piece || selectedPiece;
    const pieceId = targetPiece?.id;
    const name = targetPiece?.reference || targetPiece?.nom;

    if (!pieceId && !name) {
      setComparisonError("Aucune pièce cible disponible pour comparaison.");
      setShowComparisonModal(true);
      return;
    }

    setComparisonLoading(true);
    setComparisonError("");
    setComparisonData(null);
    setShowComparisonModal(true);

    try {
      const res = await comparePieceAcrossVendors({
        pieceId,
        name,
        includeOutOfStock: false
      });

      setComparisonData(res.data?.data || res.data || null);
      setComparisonError("");
    } catch (err) {
      setComparisonError(err.response?.data?.message || "Erreur lors du chargement de la comparaison multi-vendeurs.");
    } finally {
      setComparisonLoading(false);
    }
  };

  const openComparisonPage = (piece) => {
    const targetPiece = piece || selectedPiece;
    if (!targetPiece) {
      return;
    }

    const params = new URLSearchParams();
    if (targetPiece.reference || targetPiece.nom) {
      params.set("name", String(targetPiece.reference || targetPiece.nom));
    }

    navigate(`/vendeur/comparaison?${params.toString()}`);
  };

  const activeProfile = isStoreView ? storeProfile : myProfile;
  const vendorDisplayName = activeProfile?.name || (isStoreView ? "Vendeur" : (user?.name || "Vendeur"));
  const vendorPhone = activeProfile?.phone || "Non renseigne";
  const vendorEmail = activeProfile?.email || (isStoreView ? "Non renseigne" : (user?.email || "Non renseigne"));
  const vendorRole = activeProfile?.role || (isStoreView ? "vendeur" : (user?.role || "professionnel"));
  const storeDisplayName = activeProfile?.store_name || vendorDisplayName;
  const storeAddress = activeProfile?.store_address || "Adresse non renseignee";
  const storeDescription = activeProfile?.store_description || "Specialiste en pieces de rechange automobiles";
  const storeHours = splitLines(activeProfile?.store_hours, [
    "Lundi: 08:00 - 17:00",
    "Mardi: 08:00 - 17:00",
    "Mercredi: 08:00 - 17:00",
    "Jeudi: 08:00 - 17:00",
    "Vendredi: 08:00 - 17:00",
    "Samedi: 08:00 - 13:00",
    "Dimanche: Ferme"
  ]);
  const storeSpecialties = splitLines(activeProfile?.store_specialties, presentationSpecialites);
  const storeServices = splitLines(activeProfile?.store_services, presentationServices);

  const pieceLocationQuery = useMemo(() => {
    const zone = String(newPiece.zone_geographique || "").trim();
    const baseAddress = String(myProfile?.store_address || "").trim();

    if (zone && baseAddress) {
      return `${zone}, ${baseAddress}, Tunisie`;
    }

    if (zone) {
      return `${zone}, Tunisie`;
    }

    if (baseAddress) {
      return `${baseAddress}, Tunisie`;
    }

    return "Tunisie";
  }, [newPiece.zone_geographique, myProfile?.store_address]);

  const googleMapsEmbedUrl = useMemo(() => buildGoogleMapsEmbedUrl(pieceLocationQuery), [pieceLocationQuery]);
  const googleMapsSearchUrl = useMemo(() => buildGoogleMapsSearchUrl(pieceLocationQuery), [pieceLocationQuery]);
  const selectedPieceVendor = selectedPiece?.vendeur || selectedPiece?.offers?.[0]?.vendeur || null;
  const selectedPieceVendorOffers = useMemo(() => {
    const offers = Array.isArray(selectedPiece?.offers) ? selectedPiece.offers : [];

    return offers;
  }, [selectedPiece]);

  function getVendorOwnerId(vendorOffer) {
    if (!vendorOffer) {
      return null;
    }

    const vendorProfile = vendorOffer.vendeur && typeof vendorOffer.vendeur === "object" ? vendorOffer.vendeur : null;
    if (vendorProfile?.id) {
      const vendorProfileId = Number.parseInt(vendorProfile.id, 10);
      if (Number.isFinite(vendorProfileId) && vendorProfileId > 0) {
        return vendorProfileId;
      }
    }

    if (vendorOffer.user_id !== undefined && vendorOffer.user_id !== null) {
      const pieceOwnerId = Number.parseInt(vendorOffer.user_id, 10);
      if (Number.isFinite(pieceOwnerId) && pieceOwnerId > 0) {
        return pieceOwnerId;
      }
    }

    const looksLikePiece =
      vendorOffer.reference !== undefined ||
      vendorOffer.prix_unitaire !== undefined ||
      vendorOffer.stock !== undefined ||
      vendorOffer.categorie !== undefined ||
      vendorOffer.marque !== undefined ||
      vendorOffer.modele !== undefined;

    if (!looksLikePiece && Number.isInteger(Number(vendorOffer.id)) && (vendorOffer.store_name || vendorOffer.magasin || vendorOffer.name || vendorOffer.email)) {
      return Number(vendorOffer.id);
    }

    const ownerIdCandidates = [
      vendorOffer?.user_id,
      vendorOffer?.vendeur?.id,
      vendorOffer?.vendeur_user_id,
      vendorOffer?.vendor_user_id,
      vendorOffer?.seller_user_id,
      vendorOffer?.owner_id,
      vendorOffer?.vendeur_id,
      vendorOffer?.vendor_id,
      vendorOffer?.seller_id
    ];

    return ownerIdCandidates
      .map((value) => Number.parseInt(value, 10))
      .find((value) => Number.isFinite(value) && value > 0) || null;
  }

  function resolveOwnerIdForStore(vendorOffer) {
    return (
      getVendorOwnerId(vendorOffer) ||
      getVendorOwnerId(selectedPieceVendor) ||
      getVendorOwnerId(selectedPieceVendorOffers[0]) ||
      getVendorOwnerId(selectedPieceVendorOffers[0]?.vendeur) ||
      getVendorOwnerId(selectedPiece)
    );
  }

  const selectedPieceOwnerId = resolveOwnerIdForStore(selectedPieceVendor || selectedPiece);
  const canContactSelectedPieceVendor = Boolean(
    selectedPiece
    && selectedPieceOwnerId
    && Number(user?.id) !== Number(selectedPieceOwnerId)
  );

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
        store_description: presentationForm.store_description,
        store_hours: presentationForm.store_hours,
        store_specialties: presentationForm.store_specialties,
        store_services: presentationForm.store_services
      });

      setPresentationMessage("Presentation enregistree avec succes.");

      const refreshed = await getCompleteProfile();
      const profile = refreshed.data?.data?.user || refreshed.data?.user || null;
      setMyProfile(profile);
    } catch (err) {
      setPresentationError(err.response?.data?.message || "Erreur lors de l'enregistrement de la presentation");
    } finally {
      setPresentationSaving(false);
    }
  };

  const handleSearchInput = (event) => {
    const { value } = event.target;
    setFilters((prev) => ({
      ...prev,
      search: value
    }));
  };

  const handleQuickFilter = (nextStockFilter) => {
    setFilters((prev) => ({
      ...prev,
      stockFilter: nextStockFilter
    }));
  };

  const toggleMarque = (marque) => {
    setSelectedMarques((prev) =>
      prev.includes(marque) ? prev.filter((item) => item !== marque) : [...prev, marque]
    );
  };

  const toggleModele = (modele) => {
    setSelectedModeles((prev) =>
      prev.includes(modele) ? prev.filter((item) => item !== modele) : [...prev, modele]
    );
  };

  const toggleCategorie = (categorie) => {
    setSelectedCategories((prev) =>
      prev.includes(categorie) ? prev.filter((item) => item !== categorie) : [...prev, categorie]
    );
  };

  const applyFilters = () => {
    setIsSubmitting(true);
    setPage(1);
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setSelectedMarques([]);
    setSelectedModeles([]);
    setSelectedCategories([]);
    setSelectedCondition("all");
    setSelectedZone("all");
    setPage(1);
  };

  const canGoPrev = (pagination.page || page) > 1;
  const canGoNext = (pagination.page || page) < (pagination.totalPages || 0);
  const displayedCount = isPublicMarketplace ? marketplaceGroups.length : scopedItems.length;

  const handleCreateInput = (event) => {
    const { name, value } = event.target;
    setNewPiece((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateFile = (event) => {
    const file = event.target.files?.[0] || null;
    setNewPiece((prev) => ({
      ...prev,
      photo_piece: file
    }));
  };

  const openCreatePieceModal = () => {
    setEditingPieceId(null);
    setCreateError("");
    setCreateSuccess("");
    setNewPiece(createEmptyPieceForm());
    setIsForSale(false);
    setShowCreateModal(true);
  };

  const openEditPieceModal = async (piece) => {
    const pieceId = Number(piece?.id);
    if (!Number.isInteger(pieceId) || pieceId <= 0) {
      setCreateError("Impossible de charger cette piece pour modification.");
      return;
    }

    let targetPiece = piece;
    if (!targetPiece?.nom || !targetPiece?.reference) {
      try {
        const response = await getPieceById(pieceId);
        targetPiece = response?.data?.data ?? response?.data ?? targetPiece;
      } catch (_error) {
        // Keep the local snapshot if the refresh fails.
      }
    }

    if (!targetPiece) {
      setCreateError("Impossible de charger cette piece pour modification.");
      return;
    }

    setEditingPieceId(pieceId);
    setCreateError("");
    setCreateSuccess("");
    setNewPiece({
      nom: targetPiece.nom || "",
      reference: targetPiece.reference || "",
      description: targetPiece.description || "",
      prix_unitaire: targetPiece.prix_unitaire !== undefined && targetPiece.prix_unitaire !== null ? String(targetPiece.prix_unitaire) : "",
      stock: targetPiece.stock !== undefined && targetPiece.stock !== null ? String(targetPiece.stock) : "0",
      condition: targetPiece.condition || "Neuf",
      zone_geographique: targetPiece.zone_geographique || "",
      marque: targetPiece.marque || "",
      modele: targetPiece.modele || "",
      categorie: targetPiece.categorie || "",
      photo_piece: null,
      latitude: targetPiece.latitude || null,
      longitude: targetPiece.longitude || null
    });
    // Initialize sale flag based on stock
    const parsedStock = Number(targetPiece.stock || 0);
    setIsForSale(Number.isFinite(parsedStock) && parsedStock > 0);
    setSelectedPiece(null);
    setShowCreateModal(true);
  };

  const closePieceForm = () => {
    setShowCreateModal(false);
    setEditingPieceId(null);
    setCreateError("");
    setCreateSuccess("");
  };

  const syncPiecesList = () => {
    // Réinitialiser à la page 1 et forcer un refresh complet
    setPage(1);
    // Déclencher un refresh en changeant appliedFilters
    setAppliedFilters((prev) => ({
      ...prev,
      _refreshToken: Date.now() // Force React à voir un changement
    }));
  };

  const handleSubmitPiece = async (event) => {
    event.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setIsCreating(true);

    try {
      const normalizedNom = String(newPiece.nom || "").trim();
      const normalizedReference = String(newPiece.reference || "").trim();
      const normalizedPrice = String(newPiece.prix_unitaire || "").trim().replace(",", ".");
      const normalizedStock = String(newPiece.stock || "0").trim();

      if (!normalizedNom) {
        setCreateError("Le nom de la piece est obligatoire.");
        return;
      }

      if (!normalizedReference) {
        setCreateError("La reference de la piece est obligatoire.");
        return;
      }

      const parsedPrice = Number(normalizedPrice);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        setCreateError("Le prix unitaire doit etre un nombre superieur a 0.");
        return;
      }

      const parsedStock = Number(normalizedStock);
      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        setCreateError("Le stock doit etre un entier superieur ou egal a 0.");
        return;
      }

      if (editingPieceId) {
        // The update endpoint expects a JSON body (no multipart). Build a plain payload.
        const payload = {
          nom: normalizedNom,
          reference: normalizedReference,
          description: String(newPiece.description || "").trim(),
          prix_unitaire: parsedPrice,
          stock: parsedStock,
          condition: newPiece.condition || "Neuf",
          zone_geographique: String(newPiece.zone_geographique || "").trim(),
          marque: String(newPiece.marque || "").trim(),
          modele: String(newPiece.modele || "").trim(),
          categorie: String(newPiece.categorie || "").trim()
        };

        await updatePiece(editingPieceId, payload);
        setCreateSuccess("Piece modifiee avec succes.");
      } else {
        const formData = new FormData();
        formData.append("nom", normalizedNom);
        formData.append("reference", normalizedReference);
        formData.append("description", String(newPiece.description || "").trim());
        formData.append("prix_unitaire", String(parsedPrice));
        formData.append("stock", String(parsedStock));
        formData.append("condition", newPiece.condition || "Neuf");
        formData.append("zone_geographique", String(newPiece.zone_geographique || "").trim());
        formData.append("marque", String(newPiece.marque || "").trim());
        formData.append("modele", String(newPiece.modele || "").trim());
        formData.append("categorie", String(newPiece.categorie || "").trim());

        if (newPiece.latitude) formData.append("latitude", newPiece.latitude);
        if (newPiece.longitude) formData.append("longitude", newPiece.longitude);

        if (newPiece.photo_piece) {
          formData.append("photo_piece", newPiece.photo_piece);
        }

        await createPiece(formData);
        setCreateSuccess("Piece ajoutee avec succes.");
      }

      setNewPiece(createEmptyPieceForm());
      setEditingPieceId(null);
      setPage(1);
      
      // Réinitialiser les filtres de recherche pour voir la nouvelle pièce
      setFilters((prev) => ({
        ...prev,
        search: ""
      }));
      setAppliedFilters((prev) => ({
        ...prev,
        search: ""
      }));
      
      // Forcer l'affichage en scope "private" pour voir les pièces du vendeur
      if (canManagePieces) {
        setCatalogScope("private");
      }
      
      syncPiecesList();
      
      // Fermer la modale après 1.5 secondes
      setTimeout(() => {
        setShowCreateModal(false);
      }, 1500);
    } catch (err) {
      try {
        const errorResponse = err.response?.data;
        const details = errorResponse?.error?.details;
        
        if (Array.isArray(details) && details.length > 0) {
          const formatted = details
            .map((item) => {
              if (!item || typeof item !== 'object') return "Erreur de validation";
              return `${item.field || "champ"}: ${item.message || "valeur invalide"}`;
            })
            .join(" | ");
          setCreateError(formatted);
        } else {
          setCreateError(errorResponse?.message || "Erreur lors de la modification de la piece");
        }
      } catch (parseErr) {
        setCreateError(err.message || "Erreur lors de la modification de la piece");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePiece = async (piece) => {
    if (!piece?.id) {
      return;
    }

    const confirmed = window.confirm(`Supprimer la piece \"${piece.nom || piece.reference || ""}\" ?`);
    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await deletePiece(piece.id);
      setSelectedPiece(null);
      syncPiecesList();
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la suppression de la piece");
    }
  };

  const openStoreFallbackTab = (tab = "pieces") => {
    const nextTab = tab === "presentation" ? "presentation" : "pieces";
    setSelectedPiece(null);
    setIsStoreView(true);
    setStoreOwnerId(null);
    setStoreProfile(null);
    setActiveTab(nextTab);
    navigate(`/vendeur/magasin?tab=${nextTab}`, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenVendorStore = async (vendorOffer = selectedPieceVendorOffers[0]?.vendeur || selectedPieceVendorOffers[0] || selectedPiece) => {
    const ownerId = resolveOwnerIdForStore(vendorOffer);

    if (!ownerId) {
      openStoreFallbackTab("pieces");
      return;
    }

    await openStoreViewByOwnerId(ownerId, { syncUrl: true, tab: "pieces" });
  };

  const handleOpenVendorPresentation = async (vendorOffer = selectedPieceVendorOffers[0]?.vendeur || selectedPieceVendorOffers[0] || selectedPiece) => {
    const ownerId = resolveOwnerIdForStore(vendorOffer);

    if (!ownerId) {
      openStoreFallbackTab("presentation");
      return;
    }

    await openStoreViewByOwnerId(ownerId, { syncUrl: true, tab: "presentation" });
  };

  const handleContactVendorChat = async () => {
    const sellerUserId = resolveOwnerIdForStore(selectedPieceVendor || selectedPiece);
    // determine stock for the specific seller offer or fallback to piece stock
    const vendorOfferForSeller = (Array.isArray(selectedPiece?.offers) ? selectedPiece.offers : []).find((off) => {
      try {
        return Number(resolveOwnerIdForStore(off)) === Number(sellerUserId);
      } catch (e) {
        return false;
      }
    }) || null;
    const stockForSeller = Number(vendorOfferForSeller?.stock ?? selectedPiece?.stock ?? 0);
    const allowedRolesForChat = ["automobiliste", "vendeur", "garage", "admin"];
    const targetMessagesPath = chatRouteByRole[user?.role] || "/login";

    if (!user?.role || !allowedRolesForChat.includes(user.role)) {
      navigate("/login");
      return;
    }

    if (!sellerUserId) {
      setError("Impossible de trouver le vendeur pour demarrer le chat.");
      return;
    }

    // If the item is out of stock for this seller, ask the user to confirm contacting anyway
    if (stockForSeller <= 0) {
      const proceed = window.confirm("Attention : cette pièce semble hors stock chez ce vendeur. Voulez-vous malgré tout le contacter ?");
      if (!proceed) return;
    }

    try {
      setError("");
      const conversationType = user?.role === "garage" ? "garage_vendeur" : "automobiliste_vendeur";
      const response = await startChatConversation({
        conversationType,
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

  const handleOpenPieceLocation = (piece) => {
    if (!piece) {
      return;
    }

    openPieceDetails(piece);
  };

  const openPieceDetails = async (piece) => {
    if (!piece?.id) {
      return;
    }

    setSelectedPiece(piece);

    try {
      const response = await getPieceById(piece.id);
      const refreshedPiece = response?.data?.data ?? response?.data ?? null;
      if (refreshedPiece) {
        setSelectedPiece(refreshedPiece);
      }
    } catch (_error) {
      // Keep the local snapshot if the refresh fails.
    }
  };

  const handleExitVendorStore = () => {
    setIsStoreView(false);
    setStoreOwnerId(null);
    setStoreProfile(null);
    setActiveTab("pieces");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("ownerId");
    nextParams.delete("tab");
    setSearchParams(nextParams, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(244,158,95,0.14),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(30,64,175,0.10),_transparent_30%),linear-gradient(180deg,_#f7f2ea_0%,_#fffdf9_100%)]">
        <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
          <div className="mb-5 text-center">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Magasin du Vendeur</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Gérez les pièces, les photos et les compatibilités dans un espace cohérent avec l’identité visuelle de la plateforme.
            </p>
            {isStoreView && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleExitVendorStore}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Quitter magasin vendeur
                </button>
              </div>
            )}
          </div>

          {canSeeStoreTabs && (
            <div className="mb-6 grid grid-cols-2 rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-1 shadow-[0_16px_32px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setActiveTab("pieces")}
                className={`rounded-xl px-3 py-2 text-lg font-extrabold transition ${
                  activeTab === "pieces" ? "bg-[linear-gradient(135deg,#1e3a8a_0%,#2563eb_100%)] text-white shadow-md shadow-blue-900/15" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Pieces Vendeur
              </button>
              {!isGarageCataloguePage && (
                <button
                  type="button"
                  onClick={() => setActiveTab("presentation")}
                  className={`rounded-xl px-3 py-2 text-lg font-extrabold transition ${
                    activeTab === "presentation" ? "bg-[linear-gradient(135deg,#1e3a8a_0%,#2563eb_100%)] text-white shadow-md shadow-blue-900/15" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Presentation
                </button>
              )}
            </div>
          )}

          {activeTab === "pieces" && (
            <>
              {canManagePieces && !isStoreView && (
                <div className="mb-4 inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setCatalogScope("private")}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${catalogScope === "private" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Mon espace vendeur
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogScope("public")}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${catalogScope === "public" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Marketplace public
                  </button>
                </div>
              )}

              {isPublicMarketplace && (
                <div className="mb-4 flex items-center gap-2">
                  <label htmlFor="marketplace-sort" className="text-sm font-semibold text-slate-700">Tri marketplace:</label>
                  <select
                    id="marketplace-sort"
                    value={marketplaceSortBy}
                    onChange={(event) => setMarketplaceSortBy(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    <option value="min_price">Prix minimum</option>
                    <option value="offers_count">Nombre d'offres</option>
                    <option value="stock_total">Stock total</option>
                    <option value="name">Nom produit</option>
                  </select>
                </div>
              )}

              <div className="mb-4 flex gap-2">
                <div className="flex flex-1 items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_10px_20px_rgba(15,23,42,0.05)] focus-within:border-blue-300">
                  <span className="mr-2 text-lg text-slate-500">🔍</span>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={handleSearchInput}
                    placeholder="Entrer reference, piece, modele..."
                    className="w-full border-0 bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyFilters}
                  disabled={loading || isSubmitting}
                  className="rounded-2xl bg-[linear-gradient(135deg,#1e3a8a_0%,#2563eb_100%)] px-6 text-xl font-bold text-white shadow-[0_12px_22px_rgba(30,64,175,0.22)] transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  OK
                </button>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => setShowMarquesModal(true)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800">
                  Marques{selectedMarques.length > 0 ? ` (${selectedMarques.length})` : ""}
                </button>
                <button type="button" onClick={() => setShowModelesModal(true)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800">
                  Modèles{selectedModeles.length > 0 ? ` (${selectedModeles.length})` : ""}
                </button>
                <button type="button" onClick={() => setShowCategoriesModal(true)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800">
                  Catégories{selectedCategories.length > 0 ? ` (${selectedCategories.length})` : ""}
                </button>
                <button type="button" onClick={() => setShowConditionModal(true)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800">
                  Occasion/Neuf{selectedCondition !== "all" ? `: ${selectedCondition}` : ""}
                </button>
                <button type="button" onClick={() => setShowZoneModal(true)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-800">
                  Zone géographique{selectedZone !== "all" ? `: ${selectedZone}` : ""}
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-700"
                >
                  Réinitialiser
                </button>
              </div>

              {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 shadow-sm">{error}</div>}

              {loading ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600 shadow-[0_16px_30px_rgba(15,23,42,0.06)]">Chargement du catalogue...</div>
              ) : displayedCount === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600 shadow-[0_16px_30px_rgba(15,23,42,0.06)]">Aucune piece trouvee avec ces filtres.</div>
              ) : (
                <div>
                  

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {isPublicMarketplace
                    ? marketplaceGroups.map((group) => {
                      const cheapest = group.cheapestOffer;
                      const imageSrc = getPieceImageUrl(cheapest, backendBaseUrl);

                      return (
                        <article key={group.key} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_34px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_40px_rgba(15,23,42,0.12)]">
                          <button
                            type="button"
                            className="w-full"
                            onClick={() => openComparisonView(cheapest)}
                          >
                            <img src={imageSrc} alt={group.nom} className="h-52 w-full object-cover" />
                          </button>

                          <div className="p-4">
                            <p className="line-clamp-2 text-lg font-extrabold uppercase tracking-wide text-blue-700">{group.nom}</p>
                            <p className="mt-1 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-bold text-slate-600">Ref: {group.reference || "Sans reference"}</p>

                            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2">
                              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Offre la moins chère</p>
                              <p className="text-3xl font-black text-amber-700">{Number(cheapest?.prix_unitaire || 0).toFixed(2)} DT</p>
                              <p className="text-sm text-slate-600">Vendeur: {getPieceVendorDisplayName(cheapest)}</p>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{group.offerCount} offre(s)</span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Stock total: {group.totalStock}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => openComparisonView(cheapest)}
                              className="mt-3 w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300"
                            >
                              Comparer les vendeurs
                            </button>
                            
                            <div className="mt-2 grid gap-2">
                              <button
                                type="button"
                                onClick={() => openPieceDetails(cheapest)}
                                className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300"
                              >
                                Détails
                              </button>

                              <button
                                type="button"
                                onClick={() => openComparisonPage(cheapest)}
                                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300"
                              >
                                Ouvrir page complète
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })
                    : scopedItems.map((piece) => {
                      const imageSrc = getPieceImageUrl(piece, backendBaseUrl);

                      return (
                        <article key={piece.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_34px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_40px_rgba(15,23,42,0.12)]">
                          <button type="button" className="w-full" onClick={() => openPieceDetails(piece)}>
                            <img src={imageSrc} alt={piece.nom} className="h-52 w-full object-cover" />
                          </button>

                          <div className="p-4">
                            <p className="line-clamp-2 text-lg font-extrabold uppercase tracking-wide text-blue-700">{piece.nom}</p>
                            <p className="mt-1 line-clamp-2 text-2xl font-black text-slate-900">{piece.description || "Piece automobile"}</p>
                            <p className="mt-1 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-bold text-slate-600">Ref: {piece.reference}</p>

                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-3xl font-black text-blue-700">{Number(piece.prix_unitaire).toFixed(2)} DT</p>
                              <div className="flex items-center gap-3 text-2xl text-slate-400">
                               
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <span className={`rounded-full px-3 py-1 text-xs font-bold ${Number(piece.stock) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                {Number(piece.stock) > 0 ? `${piece.stock} en stock` : "Rupture"}
                              </span>
                              <button
                                type="button"
                                onClick={() => openPieceDetails(piece)}
                                className="rounded-xl border border-blue-200 bg-white px-3 py-1 text-sm font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300"
                              >
                                Details
                              </button>
                            </div>

                            
                          </div>
                        </article>
                      );
                    })}
                </div>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_30px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <p className="text-sm text-slate-600">
                    Total affiché: <span className="font-bold text-slate-900">{displayedCount}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => canGoPrev && setPage((prev) => prev - 1)}
                      disabled={!canGoPrev}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      Precedent
                    </button>
                    <span className="text-sm text-slate-500">Page {pagination.page || page} / {pagination.totalPages || 1}</span>
                    <button
                      type="button"
                      onClick={() => canGoNext && setPage((prev) => prev + 1)}
                      disabled={!canGoNext}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {!isGarageCataloguePage && activeTab === "presentation" && (
            <div className="space-y-5">
              {canManagePieces && !isStoreView && (
                <form onSubmit={handlePresentationSave} className="rounded-3xl border border-[#ececec] bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-2xl font-black text-slate-900">Editer la presentation</h3>
                    {presentationSaving && <span className="text-sm font-semibold text-blue-700">Enregistrement...</span>}
                  </div>

                  {presentationError && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{presentationError}</div>}
                  {presentationMessage && <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{presentationMessage}</div>}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input name="store_name" value={presentationForm.store_name} onChange={handlePresentationChange} placeholder="Nom du magasin" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-blue-300" />
                    <input name="store_address" value={presentationForm.store_address} onChange={handlePresentationChange} placeholder="Adresse" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-blue-300" />
                    <textarea name="store_description" value={presentationForm.store_description} onChange={handlePresentationChange} placeholder="Description" rows={3} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-blue-300 sm:col-span-2" />
                    <textarea name="store_hours" value={presentationForm.store_hours} onChange={handlePresentationChange} placeholder="Horaires, une ligne par jour" rows={4} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-blue-300 sm:col-span-2" />
                    <textarea name="store_specialties" value={presentationForm.store_specialties} onChange={handlePresentationChange} placeholder="Specialites, une ligne par item" rows={4} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-blue-300 sm:col-span-2" />
                    <textarea name="store_services" value={presentationForm.store_services} onChange={handlePresentationChange} placeholder="Services, une ligne par item" rows={4} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-blue-300 sm:col-span-2" />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button type="submit" disabled={presentationSaving} className="rounded-full bg-[linear-gradient(135deg,#1e3a8a_0%,#2563eb_100%)] px-5 py-3 text-base font-bold text-white shadow-[0_12px_22px_rgba(30,64,175,0.18)] disabled:opacity-60">
                      {presentationSaving ? "Sauvegarde..." : "Enregistrer la presentation"}
                    </button>
                  </div>
                </form>
              )}

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                <h2 className="text-4xl font-black tracking-tight text-slate-900">{storeDisplayName}</h2>
                <p className="mt-2 text-lg text-slate-700">Specialiste en pieces de rechange automobiles</p>
                <p className="mt-2 text-base leading-relaxed text-slate-600">
                  Vous recherchez des pieces fiables, disponibles et au meilleur rapport qualite/prix ?
                  {` ${storeDisplayName}`} est votre partenaire de confiance.
                </p>
                <p className="mt-3 text-base font-semibold text-slate-700">Role: {vendorRole}</p>
                <p className="text-base font-semibold text-slate-700">Email: {vendorEmail}</p>
                <p className="text-base font-semibold text-slate-700">Telephone: {vendorPhone}</p>
                {profileLoading && <p className="mt-2 text-sm text-slate-500">Chargement du profil...</p>}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                <h3 className="text-2xl font-black text-slate-900">Indicateurs en temps reel</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Total pieces</p>
                    <p className="text-3xl font-black text-slate-900">{presentationSummary.totalPieces}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-blue-700">En stock</p>
                    <p className="text-3xl font-black text-blue-700">{presentationSummary.inStock}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Rupture</p>
                    <p className="text-3xl font-black text-slate-900">{presentationSummary.outOfStock}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                <h3 className="text-2xl font-black text-slate-900">Specialites</h3>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {storeSpecialties.map((item) => (
                    <span key={item} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-center text-sm font-bold text-slate-800">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                <h3 className="text-2xl font-black text-slate-900">Horaires de Travail</h3>
                <div className="mt-3 space-y-1 text-lg text-slate-700">
                  {storeHours.map((line, index) => (
                    <p key={line} className={index === 5 ? "font-bold text-blue-700" : ""}>{line}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                <h3 className="text-2xl font-black text-slate-900">Services complementaires</h3>
                <ul className="mt-3 space-y-2 text-lg text-slate-700">
                  {storeServices.map((service) => (
                    <li key={service}>✅ {service}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                <h3 className="text-2xl font-black text-slate-900">Galerie</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {previewImages.length > 0 ? (
                    previewImages.map((src) => <img key={src} src={src} alt="Galerie vendeur" className="h-36 w-full rounded-2xl object-cover shadow-sm ring-1 ring-slate-200" />)
                  ) : (
                    <p className="col-span-full text-slate-500">Ajoute des pieces avec photo pour remplir la galerie.</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {activeTab === "pieces" && canManagePieces && !isStoreView && (
          <button
            type="button"
            onClick={openCreatePieceModal}
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[linear-gradient(135deg,#1e3a8a_0%,#2563eb_100%)] px-8 py-3 text-lg font-extrabold text-white shadow-[0_16px_30px_rgba(30,64,175,0.28)]"
          >
            + Ajouter une pièce
          </button>
        )}

        {showMarquesModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
            <div className="max-h-[92vh] w-full max-w-[980px] overflow-y-auto rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-2xl sm:px-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-900 sm:text-4xl">Choisir • Marques</h3>
                <button type="button" onClick={() => setShowMarquesModal(false)} className="text-3xl text-slate-500">×</button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
                {marques.map((marque) => {
                  const active = selectedMarques.includes(marque);
                  const logoCandidates = getBrandLogoCandidates(marque);
                  const logoUrl = logoCandidates[0] || "";
                  const fallbackImage = buildMarqueImage(marque);
                  return (
                    <button
                      key={marque}
                      type="button"
                      onClick={() => toggleMarque(marque)}
                      className={`overflow-hidden rounded-[22px] border bg-white p-2 text-center transition ${active ? "border-blue-300 shadow-[0_0_0_2px_rgba(37,99,235,0.16)]" : "border-slate-200"}`}
                    >
                      <div className={`flex h-[112px] items-center justify-center rounded-[16px] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-3 ${active ? "ring-1 ring-blue-300/40" : ""}`}>
                        <img
                          src={logoUrl || fallbackImage}
                          alt={marque}
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
                      <p className={`mt-2 truncate text-[15px] font-bold ${active ? "text-slate-900" : "text-slate-700"}`}>{marque}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showModelesModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
            <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-4xl font-black text-slate-900">Choisir • Modèles</h3>
                <button type="button" onClick={() => setShowModelesModal(false)} className="text-3xl text-slate-500">x</button>
              </div>
              {availableModeles.length === 0 ? (
                <p className="text-slate-500">Sélectionnez d'abord une marque.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {availableModeles.map((modele) => {
                    const active = selectedModeles.includes(modele);
                    return (
                      <button
                        key={modele}
                        type="button"
                        onClick={() => toggleModele(modele)}
                        className={`rounded-2xl border p-4 text-left text-base font-semibold transition ${active ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"}`}
                      >
                        {modele}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {showCategoriesModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
            <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-4xl font-black text-slate-900">Choisir • Catégories</h3>
                <button type="button" onClick={() => setShowCategoriesModal(false)} className="text-3xl text-slate-500">×</button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {categories.map((categorie) => {
                  const active = selectedCategories.includes(categorie);
                  const categoryImage = buildCategoryImage(categorie);
                  return (
                    <button
                      key={categorie}
                      type="button"
                      onClick={() => toggleCategorie(categorie)}
                      className={`rounded-2xl border p-3 text-center transition ${active ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"}`}
                    >
                      <img src={categoryImage} alt={categorie} className="mb-2 h-24 w-full rounded-xl border border-slate-100 object-cover" />
                      <p className={`text-sm font-semibold ${active ? "text-blue-800" : "text-slate-700"}`}>{categorie}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showConditionModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
            <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-4xl font-black text-slate-900">Choisir • Occasion/Neuf</h3>
                <button type="button" onClick={() => setShowConditionModal(false)} className="text-3xl text-slate-500">x</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button type="button" onClick={() => setSelectedCondition("all")} className={`rounded-2xl border p-4 text-lg font-semibold transition ${selectedCondition === "all" ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"}`}>Tous</button>
                <button type="button" onClick={() => setSelectedCondition("Occasion")} className={`rounded-2xl border p-4 text-lg font-semibold transition ${selectedCondition === "Occasion" ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"}`}>Occasion</button>
                <button type="button" onClick={() => setSelectedCondition("Neuf")} className={`rounded-2xl border p-4 text-lg font-semibold transition ${selectedCondition === "Neuf" ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"}`}>Neuf</button>
              </div>
            </div>
          </div>
        )}

        {showZoneModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
            <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-4xl font-black text-slate-900">Choisir • Zone géographique</h3>
                <button type="button" onClick={() => setShowZoneModal(false)} className="text-3xl text-slate-500">x</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setSelectedZone("all")} className={`rounded-2xl border p-4 text-lg font-semibold transition ${selectedZone === "all" ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"}`}>Toutes</button>
                {zoneFilters.map((zone) => (
                  <button key={zone.value} type="button" onClick={() => setSelectedZone(zone.value)} className={`rounded-2xl border p-4 text-lg font-semibold transition ${selectedZone === zone.value ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"}`}>{zone.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showCreateModal && canManagePieces && (
          <div className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_top_left,_rgba(244,158,95,0.14),_transparent_24%),linear-gradient(180deg,_#f7f2ea_0%,_#fffdf9_100%)]">
            <div className="mx-auto flex h-full w-full max-w-3xl flex-col bg-transparent">
              <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 px-4 pb-3 pt-4 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <button type="button" onClick={closePieceForm} className="text-4xl leading-none font-light text-blue-700">‹</button>
                  <h2 className="text-2xl font-medium text-slate-900">{editingPieceId ? "Modifier une pièce" : "Ajouter une pièce"}</h2>
                  <button
                    type="submit"
                    form="create-piece-form"
                    disabled={isCreating}
                    className="rounded-full text-lg font-bold text-blue-700 disabled:opacity-60"
                  >
                    {isCreating ? "..." : editingPieceId ? "Modifier" : "Terminé"}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
                {createError && <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{createError}</div>}
                {createSuccess && <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{createSuccess}</div>}

                <form id="create-piece-form" onSubmit={handleSubmitPiece} className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>Référence de la pièce</span>
                      <span className="text-blue-700">{newPiece.reference || (editingPieceId ? "Référence conservée" : "Auto / saisie manuelle")}</span>
                    </div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Titre</label>
                    <input
                      type="text"
                      name="nom"
                      value={newPiece.nom}
                      onChange={handleCreateInput}
                      placeholder="Entrer le titre"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-blue-300"
                      required
                    />
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        name="reference"
                        value={newPiece.reference}
                        onChange={handleCreateInput}
                        placeholder="Référence de la pièce"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300"
                        required
                      />
                      <input
                        type="number"
                        name="prix_unitaire"
                        value={newPiece.prix_unitaire}
                        onChange={handleCreateInput}
                        placeholder="0 DT"
                        min="0.01"
                        step="0.01"
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-lg font-semibold text-slate-800">Entrer nom pièce</p>
                      <span className="text-xs text-slate-500">Marque / Modèle / Catégorie</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <select
                        name="marque"
                        value={newPiece.marque || ""}
                        onChange={handleCreateInput}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-700 outline-none focus:border-blue-300"
                      >
                        <option value="">Marque</option>
                        {marques.map((marque) => (
                          <option key={marque} value={marque}>{marque}</option>
                        ))}
                      </select>
                      <select
                        name="modele"
                        value={newPiece.modele || ""}
                        onChange={handleCreateInput}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-700 outline-none focus:border-blue-300"
                      >
                        <option value="">Modèle</option>
                        {(modelsByMarque[newPiece.marque] || []).map((modele) => (
                          <option key={modele} value={modele}>{modele}</option>
                        ))}
                      </select>
                      <select
                        name="categorie"
                        value={newPiece.categorie || ""}
                        onChange={handleCreateInput}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-700 outline-none focus:border-blue-300"
                      >
                        <option value="">Catégorie</option>
                        {categories.map((categorie) => (
                          <option key={categorie} value={categorie}>{categorie}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <label className="mb-2 block text-lg font-semibold text-slate-800">Etat</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewPiece((prev) => ({ ...prev, condition: "Neuf" }))}
                        className={`rounded-2xl border px-4 py-4 text-base font-semibold transition ${newPiece.condition === "Neuf" ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"}`}
                      >
                        Neuf
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPiece((prev) => ({ ...prev, condition: "Occasion" }))}
                        className={`rounded-2xl border px-4 py-4 text-base font-semibold transition ${newPiece.condition === "Occasion" ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50"}`}
                      >
                        Occasion
                      </button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <label className="mb-2 block text-lg font-semibold text-slate-800">Description / Notes</label>
                    <textarea
                      name="description"
                      value={newPiece.description}
                      onChange={handleCreateInput}
                      placeholder="Ajouter une description, des notes ou des précisions sur la pièce"
                      rows={5}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-300"
                    />
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <label className="mb-2 block text-lg font-semibold text-slate-800">Ajouter des photos</label>
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCreateFile}
                        className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-[linear-gradient(135deg,#1e3a8a_0%,#2563eb_100%)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />
                      <p className="mt-2 text-sm text-slate-500">
                        {newPiece.photo_piece ? `Fichier choisi: ${newPiece.photo_piece.name}` : "Formats image acceptes: JPG, PNG, WEBP"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-800">Prix Fixe</p>
                        <p className="text-sm text-slate-500">Saisissez le tarif de vente</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="rounded-full border bg-white p-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (!isForSale) {
                                // enable sale, ensure stock at least 1
                                setNewPiece((prev) => ({ ...prev, stock: String(Math.max(Number(prev.stock || 0), 1)) }));
                              }
                              setIsForSale(true);
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${isForSale ? "bg-blue-600 text-white" : "text-slate-600"}`}
                          >
                            En stock
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsForSale(false);
                              setNewPiece((prev) => ({ ...prev, stock: "0" }));
                            }}
                            className={`ml-1 px-3 py-1 rounded-full text-sm font-semibold ${!isForSale ? "bg-rose-50 text-rose-700" : "text-slate-600"}`}
                          >
                            Hors stock
                          </button>
                        </div>

                        <input
                          type="number"
                          name="stock"
                          value={newPiece.stock}
                          onChange={handleCreateInput}
                          placeholder="Stock"
                          min="0"
                          step="1"
                          disabled={!isForSale}
                          className={`w-24 rounded-2xl border border-slate-200 ${isForSale ? "bg-white" : "bg-gray-50"} px-3 py-3 text-center text-base text-slate-700 outline-none focus:border-blue-300 disabled:opacity-60`}
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {selectedPiece && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-3">
            <div className="max-h-[96vh] w-full max-w-6xl overflow-y-auto rounded-none bg-[linear-gradient(180deg,#fffdf9_0%,#faf7f2_100%)] shadow-2xl sm:rounded-3xl">
              <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 pb-3 pt-4 backdrop-blur-xl sm:px-6">
                <div className="mb-3 flex items-center justify-between">
                  <button type="button" onClick={() => setSelectedPiece(null)} className="text-4xl leading-none font-light text-blue-700">‹</button>
                  <h2 className="text-2xl font-medium text-slate-900">Détails Pièce</h2>
                  <div className="w-8" />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-slate-700">{formatDate(selectedPiece.created_at)}</p>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">Fiche produit</span>
                </div>
              </div>

              <div className="grid gap-6 px-4 pb-8 pt-4 lg:grid-cols-[1.1fr_0.9fr] lg:px-6">
                <div className="space-y-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <button type="button" onClick={handleOpenVendorStore} className="group flex flex-1 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1e3a8a_0%,#2563eb_100%)] px-5 py-3 text-white shadow-[0_10px_18px_rgba(30,64,175,0.18)]">
                      <span className="mr-3 text-2xl">🏪</span>
                      <span className="flex flex-col items-start leading-tight">
                        <span className="text-lg font-semibold">Voir magasin de vendeur</span>
                        <span className="text-xs text-blue-100">Pieces + Presentation</span>
                      </span>
                      <span className="ml-3 text-xl transition-transform group-hover:translate-x-0.5">›</span>
                    </button>
                    {canContactSelectedPieceVendor ? (
                      <button
                        type="button"
                        onClick={handleContactVendorChat}
                        className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-700 shadow-[0_8px_16px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700"
                        aria-label="Contacter le vendeur"
                        title="Contacter le vendeur"
                      >
                        <span>💬</span>
                        <span>Contacter le vendeur</span>
                      </button>
                    ) : (
                      <div className="hidden h-14 flex-1" aria-hidden="true" />
                    )}
                  </div>

                  

                  {canEditSelectedPiece && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => void openEditPieceModal(selectedPiece)}
                        className="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-base font-semibold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300"
                      >
                        Modifier la piece
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePiece(selectedPiece)}
                        className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-base font-semibold text-rose-700 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300"
                      >
                        Supprimer la piece
                      </button>
                    </div>
                  )}

                  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <div className="space-y-4 text-slate-900">
                      <div className="flex items-start gap-4">
                        <span className="mt-1 text-2xl">ⓘ</span>
                        <p className="text-2xl font-black tracking-wide">{selectedPiece.reference || "Référence non renseignée"}</p>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="mt-1 text-2xl">🏷</span>
                        <div>
                          <p className="text-2xl font-black">{selectedPiece.nom || "Pièce sans nom"}</p>
                          <p className="text-base text-slate-500">{selectedPiece.description || "Pas de description"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="mt-1 text-2xl">⚙</span>
                        <div className="space-y-1">
                          <p className="text-xl font-bold">{selectedPiece.categorie || "Pièce automobile"}</p>
                          <p className="text-base text-slate-500">{selectedPiece.marque ? `${selectedPiece.marque}${selectedPiece.modele ? ` ${selectedPiece.modele}` : ""}` : "Marque non renseignée"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="mt-1 text-2xl">⚠</span>
                        <p className="text-xl font-bold">{selectedPiece.condition || "Neuf"}</p>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="mt-1 text-2xl">📞</span>
                        <p className="text-xl font-bold">{vendorPhone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[26px] border border-[#e8e0d1] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.05)]">
                    <img
                      src={selectedPiece.photo_url ? (selectedPiece.photo_url.startsWith("http") ? selectedPiece.photo_url : `${backendBaseUrl}${selectedPiece.photo_url}`) : getPieceImageFallback(selectedPiece)}
                      alt={selectedPiece.nom || "Pièce"}
                      className="h-[420px] w-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <div className="mb-4 rounded-2xl bg-blue-50 px-4 py-3">
                      <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Prix</p>
                      <p className="text-3xl font-black text-blue-700">{Number(selectedPiece.prix_unitaire).toFixed(2)} DT</p>
                      <div className="mt-1 flex items-center gap-3">
                        <p className="text-sm text-slate-600">Stock: {Number(selectedPiece.stock ?? 0)}</p>
                        {Number(selectedPiece.stock ?? 0) > 0 ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">✅ Disponible</span>
                        ) : (
                          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">⚠️ Hors stock</span>
                        )}
                      </div>
                    </div>

                    

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm font-bold uppercase tracking-wide text-slate-500">Magasin du vendeur</p>
                      <p className="mt-1 text-lg font-black text-slate-900">{getPieceVendorDisplayName(selectedPiece) || vendorDisplayName}</p>
                      <p className="text-sm text-slate-600">Email: {selectedPiece.seller_email || vendorEmail}</p>
                      <p className="text-sm text-slate-600">Telephone: {selectedPiece.seller_phone || vendorPhone}</p>
                    </div>
                  </div>

                  {Array.isArray(selectedPiece.offers) && selectedPiece.offers.length > 1 && (
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                      <h3 className="mb-3 text-2xl font-black text-slate-900">Comparaison des offres</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="px-2 py-2">Vendeur</th>
                              <th className="px-2 py-2">Prix</th>
                              <th className="px-2 py-2">Stock</th>
                              <th className="px-2 py-2">Zone</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...selectedPiece.offers]
                              .sort((a, b) => Number(a.prix_unitaire) - Number(b.prix_unitaire))
                              .map((offer, index) => (
                                <tr key={offer.id || `${offer.reference}-${index}`} className={`border-b border-slate-100 ${index === 0 ? "bg-emerald-50" : ""}`}>
                                  <td className="px-2 py-2 font-semibold text-slate-800">{getPieceVendorDisplayName(offer)}</td>
                                  <td className="px-2 py-2 font-black text-blue-700">{Number(offer.prix_unitaire).toFixed(2)} DT {index === 0 ? "(moins cher)" : ""}</td>
                                  <td className="px-2 py-2 text-slate-700">{offer.stock}</td>
                                  <td className="px-2 py-2 text-slate-700">{offer.zone_geographique || "-"}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
                    <h3 className="mb-3 text-2xl font-black text-slate-900">Véhicules Compatibles</h3>
                    <div className="space-y-3">
                      {getCompatibleVehiclesForPiece(selectedPiece).length > 0 ? (
                        getCompatibleVehiclesForPiece(selectedPiece).map((vehicle, index) => (
                          <div key={`${vehicle}-${index}`} className="flex items-center gap-4 rounded-2xl bg-slate-50 px-3 py-3">
                            <span className="text-3xl">🚗</span>
                            <p className="text-lg font-semibold text-slate-800">{vehicle}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500">Aucun véhicule compatible renseigné.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showComparisonModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Vue comparative dynamique</h3>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowComparisonModal(false);
                }} 
                className="text-3xl text-slate-500"
              >×</button>
            </div>

            {comparisonLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">Chargement de la comparaison...</div>
            ) : comparisonError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{comparisonError}</div>
            ) : comparisonData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Vendeurs</p>
                    <p className="mt-1 text-3xl font-black text-slate-900">{comparisonSummary.vendeurs_count ?? comparisonOffers.length ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Prix minimum</p>
                    <p className="mt-1 text-3xl font-black text-emerald-700">{Number(comparisonSummary.prix_min || comparisonData.best_offer?.prix_unitaire || 0).toFixed(2)} DT</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Économie max</p>
                    <p className="mt-1 text-3xl font-black text-amber-700">{Number(comparisonSummary.economie_max || 0).toFixed(2)} DT</p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h4 className="mb-3 text-lg font-black text-slate-900">{comparisonData.piece?.nom || comparisonData.best_offer?.nom || "Pièce"}</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="px-2 py-2">Vendeur</th>
                          <th className="px-2 py-2">Prix</th>
                          <th className="px-2 py-2">Stock</th>
                          <th className="px-2 py-2">Zone</th>
                          <th className="px-2 py-2">Téléphone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonOffers.map((offer, index) => (
                          <tr key={offer.id || `${offer.vendeur_id}-${index}`} className={`border-b border-slate-100 ${index === 0 ? "bg-emerald-50" : ""}`}>
                            <td className="px-2 py-2 font-semibold text-slate-800">{getPieceVendorDisplayName(offer)}</td>
                            <td className="px-2 py-2 font-black text-slate-900">{Number(offer.prix_unitaire || offer.price || 0).toFixed(2)} DT {index === 0 ? "(prix minimum)" : ""}</td>
                            <td className="px-2 py-2 text-slate-700">{offer.stock ?? "-"}</td>
                            <td className="px-2 py-2 text-slate-700">{offer.zone_geographique || "-"}</td>
                            <td className="px-2 py-2 text-slate-700">{offer.vendeur_telephone || offer.seller_phone || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">Aucune donnée de comparaison disponible.</div>
            )}
          </div>
        </div>
      )}
    </PlatformLayout>
  );
};

export default CataloguePieces;


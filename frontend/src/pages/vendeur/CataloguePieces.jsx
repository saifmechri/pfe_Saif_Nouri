import { useContext, useEffect, useMemo, useState } from "react";
import { createPiece, getPieces } from "../../services/pieces";
import { getCompleteProfile, getCompleteProfileById, updateProfile } from "../../services/user";
import PlatformLayout from "../../components/PlatformLayout";
import { AuthContext } from "../../context/AuthContext";

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
  "Toit voiture": { icon: "⬒", color: "from-zinc-100 to-white" },
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
  if (!domain) {
    return localCandidates;
  }

  const encodedDomain = encodeURIComponent(domain);
  return [...localCandidates, `https://logo.clearbit.com/${encodedDomain}`];
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

const CataloguePieces = () => {
  const { user } = useContext(AuthContext);
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

  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalItems: 0, totalPages: 0 });

  const [selectedPiece, setSelectedPiece] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newPiece, setNewPiece] = useState({
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
    photo_piece: null
  });

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

  const backendBaseUrl = useMemo(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    return apiUrl.replace(/\/api\/?$/, "");
  }, []);

  const canManagePieces = user?.role === "vendeur" || user?.role === "admin";
  const canSeeStoreTabs = isStoreView || user?.role === "vendeur" || user?.role === "admin" || user?.role === "garage";

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

        const res = await getPieces(params);
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
  }, [page, appliedFilters]);

  useEffect(() => {
    if (!canSeeStoreTabs && activeTab !== "pieces") {
      setActiveTab("pieces");
    }
  }, [canSeeStoreTabs, activeTab]);

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

  const availableModeles = useMemo(() => {
    if (selectedMarques.length === 0) return [];
    const merged = selectedMarques.flatMap((marque) => modelsByMarque[marque] || []);
    return Array.from(new Set(merged)).sort();
  }, [selectedMarques]);

  const previewImages = useMemo(() => {
    return visibleItems
      .filter((piece) => piece.photo_url)
      .slice(0, 6)
      .map((piece) => (piece.photo_url.startsWith("http") ? piece.photo_url : `${backendBaseUrl}${piece.photo_url}`));
  }, [visibleItems, backendBaseUrl]);

  const presentationSummary = useMemo(() => {
    const allItems = isStoreView ? visibleItems : (Array.isArray(items) ? items : []);
    const inStock = allItems.filter((piece) => Number(piece.stock) > 0).length;
    const outOfStock = allItems.filter((piece) => Number(piece.stock) <= 0).length;

    return {
      totalPieces: isStoreView ? allItems.length : (pagination.totalItems || allItems.length),
      inStock,
      outOfStock
    };
  }, [items, visibleItems, pagination.totalItems, isStoreView]);

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

  const handleCreatePiece = async (event) => {
    event.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setIsCreating(true);

    try {
      const formData = new FormData();
      formData.append("nom", newPiece.nom);
      formData.append("reference", newPiece.reference);
      formData.append("description", newPiece.description);
      formData.append("prix_unitaire", newPiece.prix_unitaire);
      formData.append("stock", newPiece.stock || "0");
      formData.append("condition", newPiece.condition || "Neuf");
      formData.append("zone_geographique", newPiece.zone_geographique || "");
      formData.append("marque", newPiece.marque || "");
      formData.append("modele", newPiece.modele || "");
      formData.append("categorie", newPiece.categorie || "");

      if (newPiece.photo_piece) {
        formData.append("photo_piece", newPiece.photo_piece);
      }

      await createPiece(formData);

      setCreateSuccess("Piece ajoutee avec succes.");
      setNewPiece({
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
        photo_piece: null
      });
      setPage(1);
      setAppliedFilters((prev) => ({ ...prev }));
    } catch (err) {
      setCreateError(err.response?.data?.message || "Erreur lors de l'ajout de la piece");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenVendorStore = async () => {
    const ownerIdCandidates = [
      selectedPiece?.user_id,
      selectedPiece?.vendeur_id,
      selectedPiece?.vendor_id,
      selectedPiece?.seller_id,
      selectedPiece?.owner_id
    ];

    const ownerId = ownerIdCandidates
      .map((value) => Number.parseInt(value, 10))
      .find((value) => Number.isFinite(value) && value > 0);

    setSelectedPiece(null);
    setIsStoreView(true);
    setStoreOwnerId(ownerId || null);
    setActiveTab("presentation");

    if (ownerId) {
      setProfileLoading(true);
      try {
        const res = await getCompleteProfileById(ownerId);
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

  const handleExitVendorStore = () => {
    setIsStoreView(false);
    setStoreOwnerId(null);
    setStoreProfile(null);
    setActiveTab("pieces");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-[#f8f8f8]">
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-6">
          <div className="mb-4 text-center">
            <h1 className="text-3xl font-black text-[#111111]">Magasin du Vendeur</h1>
            {isStoreView && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleExitVendorStore}
                  className="rounded-full border border-[#d8d8d8] bg-white px-4 py-2 text-sm font-semibold text-[#2d2d2d]"
                >
                  Quitter magasin vendeur
                </button>
              </div>
            )}
          </div>

          {canSeeStoreTabs && (
            <div className="mb-6 grid grid-cols-2 rounded-2xl border border-[#ececec] bg-white p-1">
              <button
                type="button"
                onClick={() => setActiveTab("pieces")}
                className={`rounded-xl px-3 py-2 text-lg font-extrabold transition ${
                  activeTab === "pieces" ? "bg-[#fff3e0] text-[#f29a00]" : "text-[#a0a0a0]"
                }`}
              >
                Pieces Vendeur
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("presentation")}
                className={`rounded-xl px-3 py-2 text-lg font-extrabold transition ${
                  activeTab === "presentation" ? "bg-[#fff3e0] text-[#f29a00]" : "text-[#a0a0a0]"
                }`}
              >
                Presentation
              </button>
            </div>
          )}

          {activeTab === "pieces" && (
            <>
              <div className="mb-4 flex gap-2">
                <div className="flex flex-1 items-center rounded-2xl border-2 border-[#ff9d00] bg-white px-3 py-2">
                  <span className="mr-2 text-lg text-[#676767]">🔍</span>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={handleSearchInput}
                    placeholder="Entrer reference, piece, modele..."
                    className="w-full border-0 bg-transparent text-base text-[#3b3b3b] outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyFilters}
                  disabled={loading || isSubmitting}
                  className="rounded-2xl border-2 border-[#ff9d00] bg-white px-6 text-xl font-bold text-[#ff9d00] disabled:opacity-50"
                >
                  OK
                </button>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => setShowMarquesModal(true)} className="rounded-full border border-[#d8d8d8] bg-white px-4 py-2 text-sm font-semibold text-[#2d2d2d]">
                  Marques{selectedMarques.length > 0 ? ` (${selectedMarques.length})` : ""}
                </button>
                <button type="button" onClick={() => setShowModelesModal(true)} className="rounded-full border border-[#d8d8d8] bg-white px-4 py-2 text-sm font-semibold text-[#2d2d2d]">
                  Modèles{selectedModeles.length > 0 ? ` (${selectedModeles.length})` : ""}
                </button>
                <button type="button" onClick={() => setShowCategoriesModal(true)} className="rounded-full border border-[#d8d8d8] bg-white px-4 py-2 text-sm font-semibold text-[#2d2d2d]">
                  Catégories{selectedCategories.length > 0 ? ` (${selectedCategories.length})` : ""}
                </button>
                <button type="button" onClick={() => setShowConditionModal(true)} className="rounded-full border border-[#d8d8d8] bg-white px-4 py-2 text-sm font-semibold text-[#2d2d2d]">
                  Occasion/Neuf{selectedCondition !== "all" ? `: ${selectedCondition}` : ""}
                </button>
                <button type="button" onClick={() => setShowZoneModal(true)} className="rounded-full border border-[#d8d8d8] bg-white px-4 py-2 text-sm font-semibold text-[#2d2d2d]">
                  Zone géographique{selectedZone !== "all" ? `: ${selectedZone}` : ""}
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full border border-[#d8d8d8] bg-white px-4 py-2 text-sm font-semibold text-[#7d7d7d]"
                >
                  Réinitialiser
                </button>
              </div>

              {error && <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-red-700">{error}</div>}

              {loading ? (
                <div className="rounded-3xl bg-white p-6 text-[#7d7d7d] shadow-[0_8px_20px_rgba(0,0,0,0.06)]">Chargement du catalogue...</div>
              ) : visibleItems.length === 0 ? (
                <div className="rounded-3xl bg-white p-6 text-[#7d7d7d] shadow-[0_8px_20px_rgba(0,0,0,0.06)]">Aucune piece trouvee avec ces filtres.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleItems.map((piece) => {
                    const imageSrc = piece.photo_url
                      ? piece.photo_url.startsWith("http")
                        ? piece.photo_url
                        : `${backendBaseUrl}${piece.photo_url}`
                      : "https://via.placeholder.com/640x480?text=Piece";

                    return (
                      <article key={piece.id} className="overflow-hidden rounded-[24px] border border-[#ececec] bg-white shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
                        <button type="button" className="w-full" onClick={() => setSelectedPiece(piece)}>
                          <img src={imageSrc} alt={piece.nom} className="h-52 w-full object-cover" />
                        </button>

                        <div className="p-4">
                          <p className="line-clamp-2 text-lg font-extrabold uppercase tracking-wide text-[#f49600]">{piece.nom}</p>
                          <p className="mt-1 line-clamp-2 text-2xl font-black text-[#1b1b1b]">{piece.description || "Piece automobile"}</p>
                          <p className="mt-1 inline-flex rounded-full border border-[#cfd7da] bg-[#f7fafb] px-3 py-1 text-sm font-bold text-[#4d6368]">Ref: {piece.reference}</p>

                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-3xl font-black text-[#ff9800]">{Number(piece.prix_unitaire).toFixed(2)} DT</p>
                            <div className="flex items-center gap-3 text-2xl text-[#ff9800]">
                              <button type="button" aria-label="Favori">♡</button>
                              <button type="button" aria-label="Partager">↗</button>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${Number(piece.stock) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {Number(piece.stock) > 0 ? `${piece.stock} en stock` : "Rupture"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedPiece(piece)}
                              className="rounded-xl border border-[#ff9d00] px-3 py-1 text-sm font-bold text-[#ff9d00]"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 rounded-2xl bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
                <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <p className="text-sm text-[#6a6a6a]">
                    Total: <span className="font-bold text-[#1d1d1d]">{pagination.totalItems || 0}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => canGoPrev && setPage((prev) => prev - 1)}
                      disabled={!canGoPrev}
                      className="rounded-xl border border-[#d3d3d3] px-3 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      Precedent
                    </button>
                    <span className="text-sm text-[#585858]">Page {pagination.page || page} / {pagination.totalPages || 1}</span>
                    <button
                      type="button"
                      onClick={() => canGoNext && setPage((prev) => prev + 1)}
                      disabled={!canGoNext}
                      className="rounded-xl border border-[#d3d3d3] px-3 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "presentation" && (
            <div className="space-y-5">
              {canManagePieces && !isStoreView && (
                <form onSubmit={handlePresentationSave} className="rounded-3xl border border-[#ececec] bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-2xl font-black text-[#141414]">Editer la presentation</h3>
                    {presentationSaving && <span className="text-sm font-semibold text-[#f59a00]">Enregistrement...</span>}
                  </div>

                  {presentationError && <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{presentationError}</div>}
                  {presentationMessage && <div className="mb-3 rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-700">{presentationMessage}</div>}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input name="store_name" value={presentationForm.store_name} onChange={handlePresentationChange} placeholder="Nom du magasin" className="rounded-xl border border-[#d9d9d9] px-3 py-2" />
                    <input name="store_address" value={presentationForm.store_address} onChange={handlePresentationChange} placeholder="Adresse" className="rounded-xl border border-[#d9d9d9] px-3 py-2" />
                    <textarea name="store_description" value={presentationForm.store_description} onChange={handlePresentationChange} placeholder="Description" rows={3} className="rounded-xl border border-[#d9d9d9] px-3 py-2 sm:col-span-2" />
                    <textarea name="store_hours" value={presentationForm.store_hours} onChange={handlePresentationChange} placeholder="Horaires, une ligne par jour" rows={4} className="rounded-xl border border-[#d9d9d9] px-3 py-2 sm:col-span-2" />
                    <textarea name="store_specialties" value={presentationForm.store_specialties} onChange={handlePresentationChange} placeholder="Specialites, une ligne par item" rows={4} className="rounded-xl border border-[#d9d9d9] px-3 py-2 sm:col-span-2" />
                    <textarea name="store_services" value={presentationForm.store_services} onChange={handlePresentationChange} placeholder="Services, une ligne par item" rows={4} className="rounded-xl border border-[#d9d9d9] px-3 py-2 sm:col-span-2" />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button type="submit" disabled={presentationSaving} className="rounded-full bg-[#f59a00] px-5 py-3 text-base font-bold text-white disabled:opacity-60">
                      {presentationSaving ? "Sauvegarde..." : "Enregistrer la presentation"}
                    </button>
                  </div>
                </form>
              )}

              <div className="rounded-3xl border border-[#ececec] bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                <h2 className="text-4xl font-black text-[#101010]">{storeDisplayName}</h2>
                <p className="mt-2 text-lg text-[#3b3b3b]">Specialiste en pieces de rechange automobiles</p>
                <p className="mt-2 text-base leading-relaxed text-[#565656]">
                  Vous recherchez des pieces fiables, disponibles et au meilleur rapport qualite/prix ?
                  {` ${storeDisplayName}`} est votre partenaire de confiance.
                </p>
                <p className="mt-3 text-base font-semibold text-[#323232]">Role: {vendorRole}</p>
                <p className="text-base font-semibold text-[#323232]">Email: {vendorEmail}</p>
                <p className="text-base font-semibold text-[#323232]">Telephone: {vendorPhone}</p>
                {profileLoading && <p className="mt-2 text-sm text-[#787878]">Chargement du profil...</p>}
              </div>

              <div className="rounded-3xl border border-[#ececec] bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                <h3 className="text-2xl font-black text-[#141414]">Indicateurs en temps reel</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#efefef] bg-[#fafafa] p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-[#7a7a7a]">Total pieces</p>
                    <p className="text-3xl font-black text-[#1b1b1b]">{presentationSummary.totalPieces}</p>
                  </div>
                  <div className="rounded-2xl border border-[#e0f2e8] bg-[#f4fff8] p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-[#5c7a66]">En stock</p>
                    <p className="text-3xl font-black text-[#1f8f4b]">{presentationSummary.inStock}</p>
                  </div>
                  <div className="rounded-2xl border border-[#f7e1e1] bg-[#fff6f6] p-3 text-center">
                    <p className="text-xs uppercase tracking-wide text-[#855f5f]">Rupture</p>
                    <p className="text-3xl font-black text-[#c44b4b]">{presentationSummary.outOfStock}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#ececec] bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                <h3 className="text-2xl font-black text-[#141414]">Specialites</h3>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {storeSpecialties.map((item) => (
                    <span key={item} className="rounded-2xl border border-[#f0a326] px-4 py-2 text-center text-sm font-bold text-[#1e1e1e]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#ececec] bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                <h3 className="text-2xl font-black text-[#141414]">Horaires de Travail</h3>
                <div className="mt-3 space-y-1 text-lg text-[#252525]">
                  {storeHours.map((line, index) => (
                    <p key={line} className={index === 5 ? "font-bold text-[#f59a00]" : ""}>{line}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#ececec] bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                <h3 className="text-2xl font-black text-[#141414]">Services complementaires</h3>
                <ul className="mt-3 space-y-2 text-lg text-[#272727]">
                  {storeServices.map((service) => (
                    <li key={service}>✓ {service}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-[#ececec] bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                <h3 className="text-2xl font-black text-[#141414]">Galerie</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {previewImages.length > 0 ? (
                    previewImages.map((src) => <img key={src} src={src} alt="Galerie vendeur" className="h-36 w-full rounded-xl object-cover" />)
                  ) : (
                    <p className="col-span-full text-[#666]">Ajoute des pieces avec photo pour remplir la galerie.</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-[#ececec] bg-[#fff7ea] p-4 text-sm font-semibold text-[#825516] shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
                La section map est volontairement desactivee pour le moment.
              </div>
            </div>
          )}
        </div>

        {activeTab === "pieces" && canManagePieces && !isStoreView && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-[#f59a00] px-8 py-3 text-lg font-extrabold text-white shadow-[0_16px_30px_rgba(245,154,0,0.35)]"
          >
            ＋ Ajouter une piece
          </button>
        )}

        {showMarquesModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
            <div className="max-h-[92vh] w-full max-w-[980px] overflow-y-auto rounded-3xl bg-white px-4 py-5 shadow-2xl sm:px-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-black text-[#111] sm:text-4xl">Choisir • Marques</h3>
                <button type="button" onClick={() => setShowMarquesModal(false)} className="text-3xl text-[#777]">×</button>
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
                      className={`overflow-hidden rounded-[22px] border bg-white p-2 text-center transition ${active ? "border-[#f59a00] shadow-[0_0_0_2px_rgba(245,154,0,0.18)]" : "border-[#e2e2e2]"}`}
                    >
                      <div className={`flex h-[112px] items-center justify-center rounded-[16px] border border-[#edf0f2] bg-gradient-to-b from-[#fbfbfb] to-white p-3 ${active ? "ring-1 ring-[#f59a00]/25" : ""}`}>
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
                      <p className={`mt-2 truncate text-[15px] font-bold ${active ? "text-[#111]" : "text-[#1e1e1e]"}`}>{marque}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showModelesModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
            <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-4xl font-black text-[#111]">Choisir • Modèles</h3>
                <button type="button" onClick={() => setShowModelesModal(false)} className="text-3xl text-[#777]">x</button>
              </div>
              {availableModeles.length === 0 ? (
                <p className="text-[#666]">Sélectionnez d'abord une marque.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {availableModeles.map((modele) => {
                    const active = selectedModeles.includes(modele);
                    return (
                      <button
                        key={modele}
                        type="button"
                        onClick={() => toggleModele(modele)}
                        className={`rounded-2xl border p-4 text-left text-base font-semibold ${active ? "border-[#f59a00] bg-[#fff3df] text-[#a86a00]" : "border-[#e2e2e2] bg-white text-[#222]"}`}
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
            <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-4xl font-black text-[#111]">Choisir • Catégories</h3>
                <button type="button" onClick={() => setShowCategoriesModal(false)} className="text-3xl text-[#777]">×</button>
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
                      className={`rounded-2xl border p-3 text-center transition ${active ? "border-[#f59a00] bg-[#fff3df]" : "border-[#e2e2e2] bg-white"}`}
                    >
                      <img src={categoryImage} alt={categorie} className="mb-2 h-24 w-full rounded-xl border border-[#edf0f2] object-cover" />
                      <p className={`text-sm font-semibold ${active ? "text-[#a86a00]" : "text-[#222]"}`}>{categorie}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showConditionModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
            <div className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-4xl font-black text-[#111]">Choisir • Occasion/Neuf</h3>
                <button type="button" onClick={() => setShowConditionModal(false)} className="text-3xl text-[#777]">x</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button type="button" onClick={() => setSelectedCondition("all")} className={`rounded-2xl border p-4 text-lg font-semibold ${selectedCondition === "all" ? "border-[#f59a00] bg-[#fff3df]" : "border-[#e2e2e2]"}`}>Tous</button>
                <button type="button" onClick={() => setSelectedCondition("Occasion")} className={`rounded-2xl border p-4 text-lg font-semibold ${selectedCondition === "Occasion" ? "border-[#f59a00] bg-[#fff3df]" : "border-[#e2e2e2]"}`}>Occasion</button>
                <button type="button" onClick={() => setSelectedCondition("Neuf")} className={`rounded-2xl border p-4 text-lg font-semibold ${selectedCondition === "Neuf" ? "border-[#f59a00] bg-[#fff3df]" : "border-[#e2e2e2]"}`}>Neuf</button>
              </div>
            </div>
          </div>
        )}

        {showZoneModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center">
            <div className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-4xl font-black text-[#111]">Choisir • Zone géographique</h3>
                <button type="button" onClick={() => setShowZoneModal(false)} className="text-3xl text-[#777]">x</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setSelectedZone("all")} className={`rounded-2xl border p-4 text-lg font-semibold ${selectedZone === "all" ? "border-[#f59a00] bg-[#fff3df]" : "border-[#e2e2e2]"}`}>Toutes</button>
                {zoneFilters.map((zone) => (
                  <button key={zone.value} type="button" onClick={() => setSelectedZone(zone.value)} className={`rounded-2xl border p-4 text-lg font-semibold ${selectedZone === zone.value ? "border-[#f59a00] bg-[#fff3df]" : "border-[#e2e2e2]"}`}>{zone.label}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showCreateModal && canManagePieces && (
          <div className="fixed inset-0 z-50 bg-[#f6f2eb]">
            <div className="mx-auto flex h-full w-full max-w-3xl flex-col bg-[#f6f2eb]">
              <div className="sticky top-0 z-10 border-b border-[#d7d0c5] bg-[#f6f2eb]/95 px-4 pb-3 pt-4 backdrop-blur">
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="text-4xl leading-none font-light text-[#f59a00]">‹</button>
                  <h2 className="text-2xl font-medium text-[#111]">Ajouter une pièce</h2>
                  <button
                    type="submit"
                    form="create-piece-form"
                    disabled={isCreating}
                    className="rounded-full text-lg font-bold text-[#f59a00] disabled:opacity-60"
                  >
                    {isCreating ? "..." : "Terminé"}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
                {createError && <div className="mb-3 rounded-2xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{createError}</div>}
                {createSuccess && <div className="mb-3 rounded-2xl border border-green-300 bg-green-50 p-3 text-sm text-green-700">{createSuccess}</div>}

                <form id="create-piece-form" onSubmit={handleCreatePiece} className="space-y-6">
                  <div className="rounded-3xl bg-white px-4 py-4 shadow-[0_8px_22px_rgba(0,0,0,0.05)]">
                    <div className="mb-3 flex items-center justify-between text-sm font-semibold text-[#222]">
                      <span>Référence de la pièce</span>
                      <span className="text-[#f59a00]">{newPiece.reference || "Auto / saisie manuelle"}</span>
                    </div>
                    <label className="mb-2 block text-sm font-semibold text-[#222]">Titre</label>
                    <input
                      type="text"
                      name="nom"
                      value={newPiece.nom}
                      onChange={handleCreateInput}
                      placeholder="Entrer le titre"
                      className="w-full rounded-2xl border border-[#e3dfd6] bg-white px-4 py-4 text-base outline-none ring-0 placeholder:text-[#9a9a9a]"
                      required
                    />
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        name="reference"
                        value={newPiece.reference}
                        onChange={handleCreateInput}
                        placeholder="Référence de la pièce"
                        className="rounded-2xl border border-[#e3dfd6] bg-white px-4 py-4 text-base outline-none placeholder:text-[#9a9a9a]"
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
                        className="rounded-2xl border border-[#e3dfd6] bg-white px-4 py-4 text-base outline-none placeholder:text-[#9a9a9a]"
                        required
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white px-4 py-4 shadow-[0_8px_22px_rgba(0,0,0,0.05)]">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-lg font-semibold text-[#222]">Entrer nom pièce</p>
                      <span className="text-xs text-[#8c8c8c]">Marque / Modèle / Catégorie</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <select
                        name="marque"
                        value={newPiece.marque || ""}
                        onChange={handleCreateInput}
                        className="rounded-2xl border-0 border-b border-[#d8d2c7] bg-transparent px-1 py-3 text-base outline-none"
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
                        className="rounded-2xl border-0 border-b border-[#d8d2c7] bg-transparent px-1 py-3 text-base outline-none"
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
                        className="rounded-2xl border-0 border-b border-[#d8d2c7] bg-transparent px-1 py-3 text-base outline-none"
                      >
                        <option value="">Catégorie</option>
                        {categories.map((categorie) => (
                          <option key={categorie} value={categorie}>{categorie}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white px-4 py-4 shadow-[0_8px_22px_rgba(0,0,0,0.05)]">
                    <label className="mb-2 block text-lg font-semibold text-[#222]">Etat</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewPiece((prev) => ({ ...prev, condition: "Neuf" }))}
                        className={`rounded-2xl border px-4 py-4 text-base font-semibold transition ${newPiece.condition === "Neuf" ? "border-[#f59a00] bg-[#fff3df] text-[#a86a00]" : "border-[#e3dfd6] bg-white text-[#222]"}`}
                      >
                        Neuf
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPiece((prev) => ({ ...prev, condition: "Occasion" }))}
                        className={`rounded-2xl border px-4 py-4 text-base font-semibold transition ${newPiece.condition === "Occasion" ? "border-[#f59a00] bg-[#fff3df] text-[#a86a00]" : "border-[#e3dfd6] bg-white text-[#222]"}`}
                      >
                        Occasion
                      </button>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white px-4 py-4 shadow-[0_8px_22px_rgba(0,0,0,0.05)]">
                    <label className="mb-2 block text-lg font-semibold text-[#222]">Description / Notes</label>
                    <textarea
                      name="description"
                      value={newPiece.description}
                      onChange={handleCreateInput}
                      placeholder="Ajouter une description, des notes ou des précisions sur la pièce"
                      rows={5}
                      className="w-full rounded-2xl border border-[#e3dfd6] bg-white px-4 py-4 text-base outline-none placeholder:text-[#9a9a9a]"
                    />
                  </div>

                  <div className="rounded-3xl bg-white px-4 py-4 shadow-[0_8px_22px_rgba(0,0,0,0.05)]">
                    <label className="mb-2 block text-lg font-semibold text-[#222]">Ajouter des photos</label>
                    <div className="rounded-2xl border border-dashed border-[#e3dfd6] bg-[#faf8f4] px-4 py-5">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCreateFile}
                        className="block w-full text-sm text-[#444] file:mr-4 file:rounded-full file:border-0 file:bg-[#f59a00] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />
                      <p className="mt-2 text-sm text-[#7b7b7b]">
                        {newPiece.photo_piece ? `Fichier choisi: ${newPiece.photo_piece.name}` : "Formats image acceptes: JPG, PNG, WEBP"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white px-4 py-4 shadow-[0_8px_22px_rgba(0,0,0,0.05)]">
                    <label className="mb-2 block text-lg font-semibold text-[#222]">Lieu</label>
                    <div className="flex items-center justify-between rounded-2xl border border-[#e3dfd6] px-4 py-4">
                      <div>
                        <p className="text-base text-[#222]">Ajouter une localisation</p>
                        <p className="text-sm text-[#868686]">(approximative)</p>
                      </div>
                      <select
                        name="zone_geographique"
                        value={newPiece.zone_geographique || ""}
                        onChange={handleCreateInput}
                        className="rounded-full border border-[#e3dfd6] bg-white px-3 py-2 text-sm font-semibold text-[#333]"
                      >
                        <option value="">Zone</option>
                        <option value="Nord">Nord</option>
                        <option value="Sud">Sud</option>
                        <option value="Est">Est</option>
                        <option value="Ouest">Ouest</option>
                        <option value="Centre">Centre</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white px-4 py-4 shadow-[0_8px_22px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-[#222]">Prix Fixe</p>
                        <p className="text-sm text-[#8b8b8b]">Saisissez le tarif de vente</p>
                      </div>
                      <input
                        type="number"
                        name="stock"
                        value={newPiece.stock}
                        onChange={handleCreateInput}
                        placeholder="Stock"
                        min="0"
                        step="1"
                        className="w-24 rounded-2xl border border-[#e3dfd6] bg-white px-3 py-3 text-center text-base outline-none"
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {selectedPiece && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-3">
            <div className="max-h-[96vh] w-full max-w-6xl overflow-y-auto rounded-none bg-[#fbfaf6] shadow-2xl sm:rounded-3xl">
              <div className="sticky top-0 z-10 border-b border-[#eadfcf] bg-[#fbfaf6]/95 px-4 pb-3 pt-4 backdrop-blur sm:px-6">
                <div className="mb-3 flex items-center justify-between">
                  <button type="button" onClick={() => setSelectedPiece(null)} className="text-4xl leading-none font-light text-[#f59a00]">‹</button>
                  <h2 className="text-2xl font-medium text-[#121212]">Détails Pièce</h2>
                  <div className="w-8" />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-[#1d1d1d]">{formatDate(selectedPiece.created_at)}</p>
                  <a href="tel:+21621216460" className="rounded-full bg-[#f59a00] px-8 py-3 text-lg font-semibold text-white shadow-[0_10px_20px_rgba(245,154,0,0.22)]">
                    Appeler
                  </a>
                </div>
              </div>

              <div className="grid gap-6 px-4 pb-8 pt-4 lg:grid-cols-[1.1fr_0.9fr] lg:px-6">
                <div className="space-y-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <button type="button" onClick={handleOpenVendorStore} className="flex flex-1 items-center justify-center rounded-full bg-[#f59a00] px-5 py-4 text-lg font-semibold text-white shadow-[0_10px_18px_rgba(245,154,0,0.2)]">
                      <span className="mr-3 text-2xl">🏪</span>
                      Voir magasin de vendeur
                      <span className="ml-3 text-xl">›</span>
                    </button>
                    <button type="button" className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f0dfc0] bg-white text-2xl shadow-[0_8px_16px_rgba(0,0,0,0.05)]" aria-label="Partager">
                      ⤴
                    </button>
                  </div>

                  <div className="rounded-3xl border border-[#ece4d7] bg-white px-4 py-4 shadow-[0_10px_22px_rgba(0,0,0,0.04)]">
                    <div className="space-y-4 text-[#161616]">
                      <div className="flex items-start gap-4">
                        <span className="mt-1 text-2xl">ⓘ</span>
                        <p className="text-2xl font-black tracking-wide">{selectedPiece.reference}</p>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="mt-1 text-2xl">🏷</span>
                        <div>
                          <p className="text-2xl font-black">{selectedPiece.nom}</p>
                          <p className="text-base text-[#666]">{selectedPiece.description || "Pas de description"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <span className="mt-1 text-2xl">⚙</span>
                        <div className="space-y-1">
                          <p className="text-xl font-bold">{selectedPiece.categorie || "Pièce automobile"}</p>
                          <p className="text-base text-[#666]">{selectedPiece.marque ? `${selectedPiece.marque}${selectedPiece.modele ? ` ${selectedPiece.modele}` : ""}` : "Marque non renseignée"}</p>
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
                      src={selectedPiece.photo_url ? (selectedPiece.photo_url.startsWith("http") ? selectedPiece.photo_url : `${backendBaseUrl}${selectedPiece.photo_url}`) : "https://via.placeholder.com/1024x768?text=Piece"}
                      alt={selectedPiece.nom}
                      className="h-[420px] w-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-[#ece4d7] bg-white p-4">
                    <div className="mb-4 rounded-2xl bg-[#fff8ef] px-4 py-3">
                      <p className="text-sm font-bold uppercase tracking-wide text-[#a86a00]">Prix</p>
                      <p className="text-3xl font-black text-[#f59a00]">{Number(selectedPiece.prix_unitaire).toFixed(2)} DT</p>
                      <p className="mt-1 text-sm text-[#666]">Stock: {selectedPiece.stock}</p>
                    </div>

                    <div className="mb-4 rounded-2xl bg-[#fbfaf6] p-4">
                      <p className="text-sm font-bold uppercase tracking-wide text-[#8a8a8a]">Lieu</p>
                      <p className="mt-1 text-base font-semibold text-[#333]">Localisation approximative</p>
                      <p className="mt-1 text-sm text-[#666]">Maps désactivée pour le moment</p>
                    </div>

                    <div className="rounded-2xl bg-[#fbfaf6] p-4">
                      <p className="text-sm font-bold uppercase tracking-wide text-[#8a8a8a]">Magasin du vendeur</p>
                      <p className="mt-1 text-lg font-black text-[#1c1c1c]">{vendorDisplayName}</p>
                      <p className="text-sm text-[#5e5e5e]">Email: {vendorEmail}</p>
                      <p className="text-sm text-[#5e5e5e]">Telephone: {vendorPhone}</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-[#ece4d7] bg-white p-4">
                    <h3 className="mb-3 text-2xl font-black text-[#151515]">Véhicules Compatibles</h3>
                    <div className="space-y-3">
                      {getCompatibleVehiclesForPiece(selectedPiece).length > 0 ? (
                        getCompatibleVehiclesForPiece(selectedPiece).map((vehicle, index) => (
                          <div key={`${vehicle}-${index}`} className="flex items-center gap-4 rounded-2xl bg-[#fbfaf6] px-3 py-3">
                            <span className="text-3xl">🚗</span>
                            <p className="text-lg font-semibold text-[#1c1c1c]">{vehicle}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[#666]">Aucun véhicule compatible renseigné.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
};

export default CataloguePieces;

import { useEffect, useMemo, useState } from "react";
import PlatformLayout from "../../components/PlatformLayout";
import {
  createGarage,
  createGarageService,
  deleteGarageService,
  getMyGarage,
  getMyGarageReviews,
  getMyGarageServices,
  updateGarage,
  updateGarageReview,
  updateGarageService
} from "../../services/garage";

const emptyGarageForm = {
  name: "",
  adresse: "",
  telephone: "",
  email: "",
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

const GarageDashboard = () => {
  // Onglet actif de l'espace garage.
  const [activeTab, setActiveTab] = useState("profil");

  // Etats du profil garage (lecture + formulaire création/édition).
  const [garage, setGarage] = useState(null);
  const [garageForm, setGarageForm] = useState(emptyGarageForm);
  const [isGarageLoading, setIsGarageLoading] = useState(false);

  // Etats des services (liste + formulaire ajout/modification).
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [isServicesLoading, setIsServicesLoading] = useState(false);

  // Etats des avis clients pour le garage connecté.
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({
    reviews_count: 0,
    average_rating: 0,
    min_rating: 0,
    max_rating: 0
  });
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);

  // Messages UX partagés pour afficher le résultat des actions.
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasGarageProfile = Boolean(garage?.id);

  // Cette statistique est calculée une fois que la liste des services est chargée.
  const activeServicesCount = useMemo(
    () => services.filter((service) => service.is_active).length,
    [services]
  );

  useEffect(() => {
    loadGarageProfile();
  }, []);

  useEffect(() => {
    if (hasGarageProfile) {
      loadMyServices();
      loadMyReviews();
    }
  }, [hasGarageProfile]);

  const normalizeGarageForm = (source) => ({
    name: source?.name || "",
    adresse: source?.adresse || "",
    telephone: source?.telephone || "",
    email: source?.email || "",
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
    } catch (err) {
      const isNotFound = err?.response?.status === 404;

      if (isNotFound) {
        setGarage(null);
        setGarageForm(emptyGarageForm);
      } else {
        setError(err?.response?.data?.message || "Erreur lors du chargement du profil garage.");
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
      setError(err?.response?.data?.message || "Erreur lors du chargement des services.");
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

      // Si le backend ne renvoie pas de résumé ici, on le recalcule côté client.
      if (items.length === 0) {
        setReviewSummary({ reviews_count: 0, average_rating: 0, min_rating: 0, max_rating: 0 });
      } else {
        const ratings = items.map((item) => Number(item.rating || 0));
        const sum = ratings.reduce((acc, value) => acc + value, 0);
        setReviewSummary({
          reviews_count: ratings.length,
          average_rating: Number((sum / ratings.length).toFixed(2)),
          min_rating: Math.min(...ratings),
          max_rating: Math.max(...ratings)
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur lors du chargement des avis.");
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
      const payload = {
        name: garageForm.name,
        adresse: garageForm.adresse || null,
        telephone: garageForm.telephone || null,
        email: garageForm.email || null,
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
      setSuccessMessage(garage?.id ? "Profil garage mis a jour." : "Profil garage cree avec succes.");
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible d'enregistrer le profil garage.");
    }
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
      const payload = {
        name: serviceForm.name,
        description: serviceForm.description || null,
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
      setError(err?.response?.data?.message || "Impossible d'enregistrer le service.");
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
      setError(err?.response?.data?.message || "Impossible de supprimer ce service.");
    }
  };

  const handleTogglePublished = async (review) => {
    setError("");
    setSuccessMessage("");

    try {
      // Mise a jour de publication d'un avis: on inverse l'etat actuel.
      await updateGarageReview(review.garage_id, review.id, { is_published: !review.is_published });
      setSuccessMessage("Statut de publication de l'avis mis a jour.");
      await loadMyReviews();
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de modifier la publication de cet avis.");
    }
  };

  const renderStat = (title, value, tone = "default") => {
    const toneStyles = {
      default: "from-white to-[#eff4ff]",
      success: "from-[#ecfdf3] to-[#d2fce6]",
      warning: "from-[#fff8e6] to-[#ffe8b0]"
    };

    return (
      <article className={`vb-card bg-gradient-to-br ${toneStyles[tone]} p-4`}>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#617089]">{title}</p>
        <p className="mt-2 text-2xl font-extrabold text-[#12223d]">{value}</p>
      </article>
    );
  };

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-2 text-3xl font-extrabold text-[#1a2b4b]">Espace Garage</h1>
          <p className="mb-6 text-sm text-[#617089]">Gerez votre profil, vos services atelier et les avis clients depuis une seule interface.</p>

          <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {renderStat("Profil garage", hasGarageProfile ? "Actif" : "A creer")}
            {renderStat("Services actifs", activeServicesCount, "success")}
            {renderStat("Note moyenne", reviewSummary.average_rating || 0, "warning")}
          </section>

          {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {successMessage && <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</p>}

          <div className="mb-6 flex flex-wrap gap-3 border-b border-[#d5deec] pb-2">
            <button
              onClick={() => setActiveTab("profil")}
              className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "profil" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "services" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab("avis")}
              className={`rounded-lg px-4 py-2 font-semibold ${activeTab === "avis" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-white"}`}
            >
              Avis clients
            </button>
          </div>

          {activeTab === "profil" && (
            <section className="vb-card p-6">
              <h2 className="mb-4 text-xl font-bold text-[#1a2b4b]">Profil du garage</h2>
              {isGarageLoading ? (
                <p className="text-sm text-[#617089]">Chargement du profil...</p>
              ) : (
                <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSaveGarage}>
                  <label className="text-sm font-semibold text-[#334155]">
                    Nom du garage
                    <input name="name" className="vb-input mt-1 w-full px-3 py-2" value={garageForm.name} onChange={handleGarageFieldChange} required />
                  </label>
                  <label className="text-sm font-semibold text-[#334155]">
                    Telephone
                    <input name="telephone" className="vb-input mt-1 w-full px-3 py-2" value={garageForm.telephone} onChange={handleGarageFieldChange} />
                  </label>
                  <label className="text-sm font-semibold text-[#334155] md:col-span-2">
                    Adresse
                    <input name="adresse" className="vb-input mt-1 w-full px-3 py-2" value={garageForm.adresse} onChange={handleGarageFieldChange} />
                  </label>
                  <label className="text-sm font-semibold text-[#334155]">
                    Email
                    <input type="email" name="email" className="vb-input mt-1 w-full px-3 py-2" value={garageForm.email} onChange={handleGarageFieldChange} />
                  </label>
                  <label className="text-sm font-semibold text-[#334155]">
                    Latitude
                    <input type="number" step="0.000001" name="latitude" className="vb-input mt-1 w-full px-3 py-2" value={garageForm.latitude} onChange={handleGarageFieldChange} />
                  </label>
                  <label className="text-sm font-semibold text-[#334155]">
                    Longitude
                    <input type="number" step="0.000001" name="longitude" className="vb-input mt-1 w-full px-3 py-2" value={garageForm.longitude} onChange={handleGarageFieldChange} />
                  </label>
                  <label className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#334155]">
                    <input type="checkbox" name="is_open" checked={Boolean(garageForm.is_open)} onChange={handleGarageFieldChange} />
                    Garage ouvert
                  </label>
                  <div className="md:col-span-2">
                    <button type="submit" className="vb-btn-primary px-4 py-2">
                      {hasGarageProfile ? "Enregistrer les modifications" : "Creer mon profil garage"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          {activeTab === "services" && (
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="vb-card p-6">
                <h2 className="mb-4 text-xl font-bold text-[#1a2b4b]">Mes services</h2>
                {isServicesLoading ? (
                  <p className="text-sm text-[#617089]">Chargement des services...</p>
                ) : services.length === 0 ? (
                  <p className="text-sm text-[#617089]">Aucun service enregistre pour le moment.</p>
                ) : (
                  <ul className="space-y-3">
                    {services.map((service) => (
                      <li key={service.id} className="rounded-lg border border-[#dbe2ec] bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-[#1a2b4b]">{service.name}</h3>
                            <p className="text-sm text-[#617089]">{service.description || "Sans description"}</p>
                            <p className="mt-1 text-sm text-[#334155]">
                              {service.base_price !== null ? `${service.base_price} TND` : "Prix non precise"}
                              {" • "}
                              {service.duration_minutes !== null ? `${service.duration_minutes} min` : "Duree non precisee"}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${service.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                            {service.is_active ? "Actif" : "Inactif"}
                          </span>
                        </div>
                        <div className="mt-3 flex gap-3">
                          <button type="button" className="vb-btn-outline px-3 py-1.5 text-sm" onClick={() => handleEditService(service)}>
                            Modifier
                          </button>
                          <button type="button" className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={() => handleDeleteService(service.id)}>
                            Supprimer
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="vb-card p-6">
                <h2 className="mb-4 text-xl font-bold text-[#1a2b4b]">
                  {editingServiceId ? "Modifier le service" : "Ajouter un service"}
                </h2>
                <form className="space-y-4" onSubmit={handleSubmitService}>
                  <label className="block text-sm font-semibold text-[#334155]">
                    Nom
                    <input name="name" className="vb-input mt-1 w-full px-3 py-2" value={serviceForm.name} onChange={handleServiceFieldChange} required />
                  </label>
                  <label className="block text-sm font-semibold text-[#334155]">
                    Description
                    <textarea name="description" className="vb-input mt-1 w-full px-3 py-2" value={serviceForm.description} onChange={handleServiceFieldChange} rows={3} />
                  </label>
                  <label className="block text-sm font-semibold text-[#334155]">
                    Prix de base (TND)
                    <input type="number" min="0" step="0.01" name="base_price" className="vb-input mt-1 w-full px-3 py-2" value={serviceForm.base_price} onChange={handleServiceFieldChange} />
                  </label>
                  <label className="block text-sm font-semibold text-[#334155]">
                    Duree (minutes)
                    <input type="number" min="1" name="duration_minutes" className="vb-input mt-1 w-full px-3 py-2" value={serviceForm.duration_minutes} onChange={handleServiceFieldChange} />
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#334155]">
                    <input type="checkbox" name="is_active" checked={Boolean(serviceForm.is_active)} onChange={handleServiceFieldChange} />
                    Service actif
                  </label>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button type="submit" className="vb-btn-primary px-4 py-2">
                      {editingServiceId ? "Mettre a jour" : "Ajouter"}
                    </button>
                    {editingServiceId && (
                      <button type="button" className="vb-btn-outline px-4 py-2" onClick={resetServiceForm}>
                        Annuler
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </section>
          )}

          {activeTab === "avis" && (
            <section className="vb-card p-6">
              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                {renderStat("Total avis", reviewSummary.reviews_count)}
                {renderStat("Moyenne", reviewSummary.average_rating, "warning")}
                {renderStat("Note min", reviewSummary.min_rating)}
                {renderStat("Note max", reviewSummary.max_rating)}
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
            </section>
          )}
        </div>
      </div>
    </PlatformLayout>
  );
};

export default GarageDashboard;
import { useContext, useEffect, useState } from "react";
import PlatformLayout from "../../components/PlatformLayout";
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

const getPayload = (response) => response?.data?.data ?? response?.data;

const initialReviewForm = {
  rating: 5,
  comment: ""
};

const GaragesPage = () => {
  const { user } = useContext(AuthContext);

  // Cette section pilote la recherche et la liste paginée des garages.
  const [search, setSearch] = useState("");
  const [garages, setGarages] = useState([]);
  const [selectedGarageId, setSelectedGarageId] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Cette section contient les données détaillées du garage sélectionné.
  const [selectedGarage, setSelectedGarage] = useState(null);
  const [garageServices, setGarageServices] = useState([]);
  const [garageReviews, setGarageReviews] = useState([]);
  const [summary, setSummary] = useState({ reviews_count: 0, average_rating: 0 });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Cette section gère le formulaire d'avis (création ou édition de l'avis utilisateur).
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [editingReviewId, setEditingReviewId] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchGarages();
  }, []);

  useEffect(() => {
    if (selectedGarageId) {
      fetchGarageDetails(selectedGarageId);
    }
  }, [selectedGarageId]);

  const fetchGarages = async (customSearch = "") => {
    setIsLoadingList(true);
    setError("");

    try {
      const response = await listGarages({ page: 1, limit: 25, search: customSearch || undefined });
      const payload = getPayload(response);
      const items = Array.isArray(payload?.items) ? payload.items : [];
      setGarages(items);

      if (items.length > 0 && !selectedGarageId) {
        setSelectedGarageId(items[0].id);
      }
      if (items.length === 0) {
        setSelectedGarageId(null);
        setSelectedGarage(null);
        setGarageServices([]);
        setGarageReviews([]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur lors du chargement des garages.");
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

      setSelectedGarage(garagePayload || null);
      setGarageServices(Array.isArray(servicePayload?.items) ? servicePayload.items : []);
      setGarageReviews(Array.isArray(reviewPayload?.items) ? reviewPayload.items : []);
      setSummary(reviewPayload?.summary || { reviews_count: 0, average_rating: 0 });

      // Pré-remplissage du formulaire si l'utilisateur a déjà publié un avis.
      const myReview = (reviewPayload?.items || []).find((review) => Number(review.user_id) === Number(user?.id));
      if (myReview) {
        setReviewForm({ rating: Number(myReview.rating), comment: myReview.comment || "" });
        setEditingReviewId(myReview.id);
      } else {
        setReviewForm(initialReviewForm);
        setEditingReviewId(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur lors du chargement des détails du garage.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    await fetchGarages(search.trim());
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
      setError(err?.response?.data?.message || "Impossible d'enregistrer votre avis.");
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
      setError(err?.response?.data?.message || "Impossible de supprimer votre avis.");
    }
  };

  return (
    <PlatformLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-extrabold text-[#1a2b4b]">Garages partenaires</h1>
        <p className="mb-6 text-sm text-[#617089]">Recherchez un garage, consultez ses services et partagez votre avis.</p>

        {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {successMessage && <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</p>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
          <aside className="vb-card p-5">
            <form className="mb-4 flex gap-2" onSubmit={handleSearchSubmit}>
              <input
                className="vb-input w-full px-3 py-2"
                placeholder="Rechercher un garage..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="submit" className="vb-btn-primary px-4 py-2">Chercher</button>
            </form>

            {isLoadingList ? (
              <p className="text-sm text-[#617089]">Chargement...</p>
            ) : garages.length === 0 ? (
              <p className="text-sm text-[#617089]">Aucun garage trouve.</p>
            ) : (
              <ul className="space-y-2">
                {garages.map((garage) => (
                  <li key={garage.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedGarageId(garage.id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${selectedGarageId === garage.id ? "border-blue-400 bg-blue-50" : "border-[#dbe2ec] bg-white hover:bg-slate-50"}`}
                    >
                      <p className="font-bold text-[#1a2b4b]">{garage.name}</p>
                      <p className="text-xs text-[#617089]">{garage.adresse || "Adresse non precisee"}</p>
                      <p className="mt-1 text-xs text-[#334155]">Note: {garage.rating ?? "-"} • {garage.is_open ? "Ouvert" : "Ferme"}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="space-y-6">
            {!selectedGarageId ? (
              <div className="vb-card p-6 text-sm text-[#617089]">Selectionnez un garage pour voir ses details.</div>
            ) : isLoadingDetails ? (
              <div className="vb-card p-6 text-sm text-[#617089]">Chargement des details...</div>
            ) : (
              <>
                <article className="vb-card p-6">
                  <h2 className="text-2xl font-bold text-[#1a2b4b]">{selectedGarage?.name}</h2>
                  <p className="mt-2 text-sm text-[#617089]">{selectedGarage?.adresse || "Adresse non precisee"}</p>
                  <p className="mt-1 text-sm text-[#617089]">Contact: {selectedGarage?.telephone || "N/A"} • {selectedGarage?.email || "N/A"}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-lg bg-[#f4f8ff] p-3 text-center">
                      <p className="text-xs text-[#617089]">Note moyenne</p>
                      <p className="text-xl font-extrabold text-[#12223d]">{summary.average_rating || 0}</p>
                    </div>
                    <div className="rounded-lg bg-[#f4f8ff] p-3 text-center">
                      <p className="text-xs text-[#617089]">Nombre d'avis</p>
                      <p className="text-xl font-extrabold text-[#12223d]">{summary.reviews_count || 0}</p>
                    </div>
                    <div className="rounded-lg bg-[#f4f8ff] p-3 text-center">
                      <p className="text-xs text-[#617089]">Services</p>
                      <p className="text-xl font-extrabold text-[#12223d]">{garageServices.length}</p>
                    </div>
                    <div className="rounded-lg bg-[#f4f8ff] p-3 text-center">
                      <p className="text-xs text-[#617089]">Etat</p>
                      <p className="text-xl font-extrabold text-[#12223d]">{selectedGarage?.is_open ? "Ouvert" : "Ferme"}</p>
                    </div>
                  </div>
                </article>

                <article className="vb-card p-6">
                  <h3 className="mb-4 text-xl font-bold text-[#1a2b4b]">Services disponibles</h3>
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
                </article>

                <article className="vb-card p-6">
                  <h3 className="mb-4 text-xl font-bold text-[#1a2b4b]">Votre avis</h3>
                  <form className="space-y-3" onSubmit={handleSubmitReview}>
                    <label className="block text-sm font-semibold text-[#334155]">
                      Note
                      <select
                        name="rating"
                        className="vb-input mt-1 w-full px-3 py-2"
                        value={reviewForm.rating}
                        onChange={handleReviewFieldChange}
                      >
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
                        <button type="button" className="rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50" onClick={handleDeleteMyReview}>
                          Supprimer mon avis
                        </button>
                      )}
                    </div>
                  </form>
                </article>

                <article className="vb-card p-6">
                  <h3 className="mb-4 text-xl font-bold text-[#1a2b4b]">Avis recents</h3>
                  {garageReviews.length === 0 ? (
                    <p className="text-sm text-[#617089]">Aucun avis public pour ce garage.</p>
                  ) : (
                    <ul className="space-y-3">
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
                </article>
              </>
            )}
          </section>
        </div>
      </div>
    </PlatformLayout>
  );
};

export default GaragesPage;

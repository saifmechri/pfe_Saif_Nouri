import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import PlatformLayout from '../../components/PlatformLayout';
import { getVehicules } from '../../services/vehicule';
import { getMaintenanceRecommendations } from '../../services/maintenance';
import RecommendedGarages from './maintenance/RecommendedGarages';

const getGarageCoverage = (garage, recommendationType) => {
  const labels = new Set([...(garage.maintenanceLabels || [])]);
  if (recommendationType) labels.add(recommendationType);
  return Array.from(labels);
};

const buildGarageCards = (recommendations = []) => {
  const garageMap = new Map();

  recommendations.forEach((recommendation) => {
    const maintenanceType = recommendation?.intervention?.type || 'Entretien';
    const garages = recommendation?.garages || [];

    garages.forEach((garage) => {
      const id = garage.id;
      const currentScore = Number(garage.score_global ?? garage.score ?? 0);
      const existing = garageMap.get(id);
      const baseRecord = existing || {
        id,
        name: garage.name,
        address: garage.adresse,
        distance: garage.distance_km ?? garage.distance ?? null,
        rating: Number(garage.rating ?? 0),
        isOpen: Boolean(garage.isOpen ?? garage.is_open),
        score: currentScore,
        specialties: garage.specialties || [],
        maintenanceLabels: [],
        bestMatch: false,
      };

      const nextSpecialties = Array.from(new Set([...(baseRecord.specialties || []), ...(garage.specialties || [])]));
      const nextCoverage = getGarageCoverage(baseRecord, maintenanceType);

      garageMap.set(id, {
        ...baseRecord,
        name: garage.name || baseRecord.name,
        address: garage.adresse || baseRecord.address,
        distance:
          baseRecord.distance === null || baseRecord.distance === undefined
            ? garage.distance_km ?? garage.distance ?? null
            : baseRecord.distance,
        rating: Number(garage.rating ?? baseRecord.rating ?? 0),
        isOpen: Boolean(garage.isOpen ?? garage.is_open ?? baseRecord.isOpen),
        score: Math.max(baseRecord.score || 0, currentScore),
        specialties: nextSpecialties,
        maintenanceLabels: Array.from(new Set(nextCoverage)),
        bestMatch: (garageMap.size === 0 && currentScore > 0) || (existing && currentScore >= (existing.score || 0)),
      });
    });
  });

  return Array.from(garageMap.values())
    .sort((a, b) => (b.score || 0) - (a.score || 0) || (a.distance || 9999) - (b.distance || 9999))
    .slice(0, 6);
};

const Recommendations = () => {
  const navigate = useNavigate();
  const [vehicules, setVehicules] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState('');
  const [recommendationError, setRecommendationError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadVehicules = async () => {
      try {
        setLoadingVehicles(true);
        setError('');
        const res = await getVehicules();
        const list = Array.isArray(res.data?.vehicules) ? res.data.vehicules : [];

        if (!isMounted) return;

        setVehicules(list);
        setSelectedVehicleId((current) => current || (list[0] ? String(list[0].id) : ''));
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des véhicules');
      } finally {
        if (isMounted) setLoadingVehicles(false);
      }
    };

    loadVehicules();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadRecommendations = async () => {
      const parsedVehicleId = Number.parseInt(selectedVehicleId, 10);

      if (!Number.isInteger(parsedVehicleId) || parsedVehicleId <= 0) {
        setRecommendations([]);
        return;
      }

      try {
        setLoadingRecommendations(true);
        setRecommendationError('');
        const result = await getMaintenanceRecommendations(parsedVehicleId);
        if (!isMounted) return;

        setRecommendations(Array.isArray(result) ? result : []);
      } catch (err) {
        if (!isMounted) return;
        setRecommendations([]);
        setRecommendationError(err.response?.data?.message || err.message || 'Recommandations indisponibles');
      } finally {
        if (isMounted) setLoadingRecommendations(false);
      }
    };

    loadRecommendations();

    return () => {
      isMounted = false;
    };
  }, [selectedVehicleId]);

  const vehicleCards = useMemo(() => buildGarageCards(recommendations), [recommendations]);
  const selectedVehicle = vehicules.find((vehicule) => String(vehicule.id) === String(selectedVehicleId)) || null;

  const handleReserve = () => {
    navigate('/automobiliste/appointments');
  };

  return (
    <PlatformLayout>
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,0.75),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef4fb_100%)] text-slate-900">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute right-[-5rem] top-[8rem] h-64 w-64 rounded-full bg-teal-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-blue-700 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Recommandations intelligentes
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Garages recommandés pour votre véhicule
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Consultez les garages les mieux classés selon l’entretien ciblé, la distance, la note et la disponibilité.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Véhicule actif</p>
              <div className="mt-3 min-w-[16rem]">
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400" htmlFor="vehicle-select">
                  Choisir un véhicule
                </label>
                <div className="relative">
                  <select
                    id="vehicle-select"
                    value={selectedVehicleId}
                    onChange={(event) => setSelectedVehicleId(event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    {vehicules.length === 0 ? (
                      <option value="">Aucun véhicule disponible</option>
                    ) : (
                      vehicules.map((vehicule) => (
                        <option key={vehicule.id} value={vehicule.id}>
                          {vehicule.modele_voiture || vehicule.matricule_voiture || `Véhicule #${vehicule.id}`}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-600">
                  {selectedVehicle ? selectedVehicle.modele_voiture || selectedVehicle.matricule_voiture || `Véhicule #${selectedVehicle.id}` : 'Sélectionnez un véhicule pour charger les recommandations.'}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
              {error}
            </div>
          )}

          {recommendationError && (
            <div className="mb-6 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {recommendationError}
            </div>
          )}

          {loadingVehicles ? (
            <div className="flex min-h-[40vh] items-center justify-center rounded-[32px] border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-semibold text-slate-700">Chargement des véhicules...</span>
              </div>
            </div>
          ) : vehicules.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white/75 p-8 text-center shadow-sm backdrop-blur">
              <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-xl font-black text-slate-950">Aucun véhicule trouvé</h2>
              <p className="mt-2 text-sm text-slate-600">Ajoutez d’abord un véhicule depuis votre tableau de bord pour recevoir des recommandations.</p>
            </div>
          ) : loadingRecommendations ? (
            <div className="flex min-h-[40vh] items-center justify-center rounded-[32px] border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm font-semibold text-slate-700">Chargement des recommandations...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-[32px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Véhicule sélectionné</p>
                <p className="mt-2 text-lg font-black text-slate-950">
                  {selectedVehicle ? selectedVehicle.modele_voiture || selectedVehicle.matricule_voiture || `Véhicule #${selectedVehicle.id}` : 'Aucun véhicule sélectionné'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Les garages ci-dessous sont classés automatiquement pour ce véhicule.
                </p>
              </div>

              <RecommendedGarages garages={vehicleCards} onReserve={handleReserve} />
            </div>
          )}
        </div>
      </div>
    </PlatformLayout>
  );
};

export default Recommendations;

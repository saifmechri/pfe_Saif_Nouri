import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { getMaintenanceDashboard, getMaintenanceRecommendations } from '../../../services/maintenance';
import AlertCard from './AlertCard';
import MaintenanceCalendar from './MaintenanceCalendar';
import RecommendedGarages from './RecommendedGarages';

dayjs.locale('fr');

const formatDate = (value) => {
  if (!value) return 'N/A';
  return dayjs(value).locale('fr').format('DD MMMM YYYY');
};

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
        distance: baseRecord.distance === null || baseRecord.distance === undefined ? garage.distance_km ?? garage.distance ?? null : baseRecord.distance,
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

const MaintenancePage = () => {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const parsedVehicleId = Number.parseInt(vehicleId, 10);

  const [dashboard, setDashboard] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendationError, setRecommendationError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');
        setRecommendationError('');

        const [dashboardResult, recommendationResult] = await Promise.allSettled([
          getMaintenanceDashboard(parsedVehicleId),
          getMaintenanceRecommendations(parsedVehicleId),
        ]);

        if (!isMounted) return;

        if (dashboardResult.status === 'fulfilled') {
          const data = dashboardResult.value || null;
          setDashboard(data);

          const nextSelected =
            data?.schedule?.items?.find((item) => item?.date)?.date ||
            data?.nextInterventions?.find((item) => item?.date)?.date ||
            dayjs().format('YYYY-MM-DD');
          setSelectedDate(nextSelected);
        } else {
          setError(dashboardResult.reason?.response?.data?.message || dashboardResult.reason?.message || 'Erreur lors du chargement des données de maintenance');
        }

        if (recommendationResult.status === 'fulfilled') {
          setRecommendations(Array.isArray(recommendationResult.value) ? recommendationResult.value : []);
        } else {
          setRecommendationError(recommendationResult.reason?.response?.data?.message || recommendationResult.reason?.message || 'Recommandations indisponibles');
          setRecommendations([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (Number.isInteger(parsedVehicleId) && parsedVehicleId > 0) {
      loadData();
    } else {
      setLoading(false);
      setError('Identifiant de véhicule invalide');
    }

    return () => {
      isMounted = false;
    };
  }, [parsedVehicleId]);

  const garageCards = buildGarageCards(recommendations);
  const scheduleItems = dashboard?.schedule?.items || [];
  const nextInterventions = dashboard?.nextInterventions || scheduleItems;

  const handleReserveGarage = () => {
    navigate('/automobiliste/appointments');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm font-semibold text-slate-700">Chargement du tableau de bord maintenance...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-rose-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3 text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-black">Impossible de charger la page maintenance</p>
              <p className="mt-1 text-sm text-rose-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,0.8),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef4fb_100%)] text-slate-900">
      <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="absolute right-[-5rem] top-[8rem] h-64 w-64 rounded-full bg-teal-300/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-blue-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Auto Bot - Alertes & Maintenance
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Suivi intelligent de l’entretien automobile
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Vue consolidée des alertes urgentes, de l’état kilométrique, du planning des entretiens et des garages recommandés selon la situation réelle du véhicule.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Véhicule actif</p>
            <p className="mt-1 text-xl font-black text-slate-950">{dashboard?.vehicle?.modele_voiture || 'Véhicule sélectionné'}</p>
            <p className="mt-1 text-sm font-medium text-slate-600">{dashboard?.vehicle?.matricule_voiture || 'Matricule non renseigné'}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Dernière révision {formatDate(dashboard?.lastIntervention?.date)}</p>
          </div>
        </div>

        {recommendationError && (
          <div className="mb-6 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {recommendationError}
          </div>
        )}

        <div className="space-y-6">
          <AlertCard
            vehicle={dashboard?.vehicle}
            urgency={dashboard?.urgency}
            mileage={dashboard?.mileage}
            temporal={dashboard?.temporal}
            lastIntervention={dashboard?.lastIntervention}
          />

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
            <MaintenanceCalendar
              items={nextInterventions}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              title="Planning des entretiens"
            />

            <RecommendedGarages garages={garageCards} onReserve={handleReserveGarage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
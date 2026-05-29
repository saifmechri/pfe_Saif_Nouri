import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PlatformLayout from '../../components/PlatformLayout';
import RecommendedGarages from './maintenance/RecommendedGarages';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Gauge,
  Calendar,
  Loader
} from 'lucide-react';
import { getNextRevision, getMatchingGarages, calculateUrgencyLevel, formatDate } from '../../services/alerts';

const toNumberSafe = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatPercent = (value) => {
  const parsed = toNumberSafe(value);
  return parsed === null ? '0.0%' : `${parsed.toFixed(1)}%`;
};

const formatScore = (value) => {
  const parsed = toNumberSafe(value);
  return parsed === null ? '0.0' : parsed.toFixed(1);
};

const buildTopGarages = (garages = []) =>
  garages
    .filter(Boolean)
    .map((garage, index) => ({
      id: garage.garageId ?? garage.id ?? `garage-${index}`,
      name: garage.name || 'Garage sans nom',
      address: garage.adresse || garage.address || 'Adresse non renseignée',
      score: garage.scores?.total ?? garage.score ?? 0,
      rating: garage.rating ?? 0,
      distance: garage.distance ?? garage.distance_km ?? null,
      isOpen: Boolean(garage.isAvailable ?? garage.isOpen),
      specialties: Array.isArray(garage.specialties) ? garage.specialties : [],
      maintenanceLabels: Array.isArray(garage.matchedTerms) ? garage.matchedTerms : [],
    }))
    .sort((a, b) => {
      const distanceA = a.distance === null || a.distance === undefined ? Number.POSITIVE_INFINITY : Number(a.distance);
      const distanceB = b.distance === null || b.distance === undefined ? Number.POSITIVE_INFINITY : Number(b.distance);
      return distanceA - distanceB;
    })
    .slice(0, 3)
    .map((garage, index) => ({
      ...garage,
      bestMatch: index === 0
    }));

const AlertsPage = () => {
  const { vehicleId } = useParams();
  const numVehicleId = parseInt(vehicleId, 10);
  const navigate = useNavigate();
  const [revision, setRevision] = useState(null);
  const [recommendedGarages, setRecommendedGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingGarages, setLoadingGarages] = useState(false);
  const [error, setError] = useState(null);
  const [garageError, setGarageError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setLoadingGarages(true);
        const revData = await getNextRevision(numVehicleId);
        setRevision(revData);
        const garagesData = await getMatchingGarages(numVehicleId, 50);
        setRecommendedGarages(buildTopGarages(Array.isArray(garagesData) ? garagesData : []));
        setGarageError(null);
      } catch (err) {
        if (!revision) {
          setError(err.message || 'Erreur lors du chargement des alertes');
        }
        setRecommendedGarages([]);
        setGarageError(err.message || 'Erreur lors du chargement des garages recommandés');
      } finally {
        setLoading(false);
        setLoadingGarages(false);
      }
    };

    if (numVehicleId) {
      fetchAlerts();
    }
  }, [numVehicleId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-semibold">Erreur</p>
        <p>{error}</p>
      </div>
    );
  }

  const urgency = revision ? calculateUrgencyLevel(revision) : null;

  const getUrgencyIcon = (level) => {
    switch (level) {
      case 'urgent':
        return <AlertTriangle className="w-6 h-6" />;
      case 'bientot':
        return <AlertCircle className="w-6 h-6" />;
      default:
        return <CheckCircle className="w-6 h-6" />;
    }
  };

  const getUrgencyBg = (color) => {
    const bgMap = {
      red: 'bg-red-50 border-red-200',
      orange: 'bg-orange-50 border-orange-200',
      amber: 'bg-amber-50 border-amber-200',
      yellow: 'bg-yellow-50 border-yellow-200',
      green: 'bg-green-50 border-green-200'
    };
    return bgMap[color] || 'bg-gray-50 border-gray-200';
  };

  const getUrgencyTextColor = (color) => {
    const textMap = {
      red: 'text-red-700',
      orange: 'text-orange-700',
      amber: 'text-amber-700',
      yellow: 'text-yellow-700',
      green: 'text-green-700'
    };
    return textMap[color] || 'text-gray-700';
  };

  return (
    <PlatformLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Alertes & Maintenance</h1>
        <p className="text-gray-600 mt-2">Gestion des révisions et recommandation de garages</p>
      </div>

      {/* Section Alerte Principale */}
      {revision && (
        <div className={`border-l-4 border-l-${urgency?.color}-500 p-6 rounded-lg ${getUrgencyBg(urgency?.color)}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className={`${getUrgencyTextColor(urgency?.color)} mt-1`}>
                {getUrgencyIcon(urgency?.level)}
              </div>
              <div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Garages recommandés</h2>
                {garageError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                    {garageError}
                  </div>
                ) : loadingGarages ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-600">
                    Chargement des garages recommandés...
                  </div>
                ) : (
                  <RecommendedGarages garages={recommendedGarages} onReserve={() => navigate('/automobiliste/garages')} />
                )}
              </div>
                <h2 className={`text-xl font-bold ${getUrgencyTextColor(urgency?.color)}`}>
                  Urgence: {urgency?.label}
                </h2>
                <p className="text-gray-700 mt-2">
                  {urgency?.level === 'urgent' && 'Révision urgente. Une maintenance immédiate est recommandée.'}
                  {urgency?.level === 'bientot' && 'Révision bientôt nécessaire. Planifiez une visite prochainement.'}
                  {urgency?.level === 'aucun' && 'Aucune révision urgente. Votre véhicule est à jour.'}
                </p>
              </div>
            </div>
          </div>

          {/* Détails Révision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Km Section */}
            <div className="bg-white bg-opacity-70 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Gauge className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">État Kilométrique</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Km actuels</span>
                  <span className="font-semibold text-gray-900">{revision.currentKm?.toLocaleString('fr-FR')} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Prochain KM</span>
                  <span className="font-semibold text-gray-900">{revision.nextRevisionKm?.toLocaleString('fr-FR')} km</span>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        revision.kmProgressPercent > 85
                          ? 'bg-red-600'
                          : revision.kmProgressPercent > 50
                          ? 'bg-orange-600'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(revision.kmProgressPercent, 100)}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-gray-600 mt-1">
                    {formatPercent(revision.kmProgressPercent)}
                  </div>
                </div>
              </div>
            </div>

            {/* Jours Section */}
            <div className="bg-white bg-opacity-70 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">État Temporel</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dernière révision</span>
                  <span className="font-semibold text-gray-900">{formatDate(revision.lastInterventionDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Prochaine date</span>
                  <span className="font-semibold text-gray-900">{formatDate(revision.nextRevisionDate)}</span>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        revision.daysProgressPercent > 85
                          ? 'bg-red-600'
                          : revision.daysProgressPercent > 50
                          ? 'bg-orange-600'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(revision.daysProgressPercent, 100)}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-gray-600 mt-1">
                    {formatPercent(revision.daysProgressPercent)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Type d'intervention */}
          <div className="mt-4 p-3 bg-white bg-opacity-70 rounded-lg">
            <p className="text-sm text-gray-600">
              Dernière intervention: <span className="font-semibold text-gray-900">{revision.lastInterventionType}</span>
            </p>
          </div>
        </div>
      )}

      {/* Section Recommandations */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommandations</h2>
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="font-medium text-gray-700">Consultez les recommandations personnalisées pour ce véhicule.</p>
          <p className="mt-2 text-sm text-gray-500">Les correspondances de garages et le détail des scores sont disponibles sur la page de recommandations.</p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate('/automobiliste/recommendations')}
              className="inline-flex items-center gap-2 rounded-full bg-sky-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600"
            >
              Voir recommandations
            </button>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
};

export default AlertsPage;



import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Gauge,
  Calendar,
  MapPin,
  Star,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader
} from 'lucide-react';
import { getNextRevision, getMatchingGarages, calculateUrgencyLevel, formatDate } from '../../services/alerts';

const AlertsPage = () => {
  const { vehicleId } = useParams();
  const numVehicleId = parseInt(vehicleId, 10);
  const [revision, setRevision] = useState(null);
  const [garages, setGarages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGarage, setExpandedGarage] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const revData = await getNextRevision(numVehicleId);
        setRevision(revData);

        const garageData = await getMatchingGarages(numVehicleId, 50);
        setGarages(Array.isArray(garageData) ? garageData : []);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des alertes');
      } finally {
        setLoading(false);
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
                    {revision.kmProgressPercent.toFixed(1)}%
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
                    {revision.daysProgressPercent.toFixed(1)}%
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

      {/* Section Garages Recommandés */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Garages Recommandés</h2>
        {garages.length === 0 ? (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="font-medium text-gray-700">
              Aucun garage ne correspond à cette révision via spécialité ou services.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Essayez de vérifier les garages actifs ou d’ajouter des services/spécialités côté garage.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              Les garages ci-dessous sont classés selon la correspondance avec la spécialité ou les services liés à la révision.
            </div>
            {garages.map((garage, index) => (
              <div key={garage.garageId} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div
                  className="p-6 cursor-pointer flex items-between justify-between"
                  onClick={() =>
                    setExpandedGarage(expandedGarage === garage.garageId ? null : garage.garageId)
                  }
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900">{garage.name}</h3>
                        {index === 0 && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Recommandé
                          </span>
                        )}
                        {garage.matchScore > 0 && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {garage.matchLabel}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {garage.scores.total.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">/100</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{garage.adresse} ({garage.distance} km)</span>
                    </p>
                    {(garage.matchedTerms?.length > 0 || garage.specialties?.length > 0 || garage.servicesCatalog?.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {garage.matchedTerms?.slice(0, 3).map((term) => (
                          <span
                            key={`${garage.garageId}-${term}`}
                            className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                          >
                            {term}
                          </span>
                        ))}
                        {garage.matchedTerms?.length === 0 && garage.specialties?.slice(0, 2).map((specialty) => (
                          <span
                            key={`${garage.garageId}-${specialty}`}
                            className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-center justify-center">
                    {expandedGarage === garage.garageId ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>

                {/* Détails du Garage */}
                {expandedGarage === garage.garageId && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="flex items-center space-x-1 mb-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-semibold">Rating</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">{garage.rating}/5</div>
                        <div className="text-xs text-gray-600">
                          Score: {garage.scores.rating.toFixed(1)}/100
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-1 mb-1">
                          <MapPin className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-semibold">Distance</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">{garage.distance} km</div>
                        <div className="text-xs text-gray-600">
                          Score: {garage.scores.distance.toFixed(1)}/100
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-1 mb-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold">Prix moyen</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {garage.avgPrice ? `${garage.avgPrice.toFixed(2)}€` : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-600">
                          Score: {garage.scores.price.toFixed(1)}/100
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-1 mb-1">
                          {garage.isAvailable ? (
                            <Clock className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-red-600" />
                          )}
                          <span className="text-sm font-semibold">Disponibilité</span>
                        </div>
                        <div className={`text-lg font-bold ${garage.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                          {garage.isAvailable ? 'Ouvert' : 'Fermé'}
                        </div>
                        <div className="text-xs text-gray-600">
                          Score: {garage.scores.availability.toFixed(1)}/100
                        </div>
                      </div>
                    </div>

                    {garage.description && (
                      <div className="mb-4 p-3 bg-white rounded-lg">
                        <p className="text-sm text-gray-700">{garage.description}</p>
                      </div>
                    )}

                    {(garage.specialties?.length > 0 || garage.servicesCatalog?.length > 0 || garage.serviceNames?.length > 0) && (
                      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {garage.specialties?.length > 0 && (
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Spécialités</p>
                            <div className="flex flex-wrap gap-2">
                              {garage.specialties.slice(0, 6).map((item) => (
                                <span key={`${garage.garageId}-sp-${item}`} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {garage.servicesCatalog?.length > 0 && (
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Services</p>
                            <div className="flex flex-wrap gap-2">
                              {garage.servicesCatalog.slice(0, 6).map((item) => (
                                <span key={`${garage.garageId}-svc-${item}`} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {garage.telephone && (
                        <div>
                          <span className="font-semibold">Tel:</span> {garage.telephone}
                        </div>
                      )}
                      {garage.email && (
                        <div>
                          <span className="font-semibold">Email:</span> {garage.email}
                        </div>
                      )}
                    </div>

                    <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                      Prendre rendez-vous
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPage;

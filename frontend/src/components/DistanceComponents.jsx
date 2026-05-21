import React from "react";
import { MapPin } from "lucide-react";
import { formatDistance, getDistanceColor, getDistanceLabel } from "../../utils/distanceCalculator";

/**
 * Composant de badge de distance professionnel
 * @param {number} distance - Distance en kilomètres
 * @param {boolean} showLabel - Afficher le label descriptif
 */
export const DistanceBadge = ({ distance, showLabel = true }) => {
  if (distance === null || distance === undefined) {
    return null;
  }

  const distanceColor = getDistanceColor(distance);
  const distanceLabel = getDistanceLabel(distance);

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 border ${distanceColor}`}>
      <MapPin className="w-3.5 h-3.5" />
      <span className="text-xs font-bold">{formatDistance(distance)}</span>
      {showLabel && <span className="text-xs opacity-75 italic">{distanceLabel}</span>}
    </div>
  );
};

/**
 * Composant de carte de distance détaillée
 * @param {number} distance - Distance en kilomètres
 */
export const DistanceCard = ({ distance }) => {
  if (distance === null || distance === undefined) {
    return null;
  }

  const distanceColor = getDistanceColor(distance);
  const distanceLabel = getDistanceLabel(distance);

  return (
    <div className={`rounded-2xl border-2 p-4 ${distanceColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Distance depuis vous</p>
            <p className="text-xs opacity-75">{distanceLabel}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black">{formatDistance(distance)}</p>
        </div>
      </div>
    </div>
  );
};

export default DistanceBadge;



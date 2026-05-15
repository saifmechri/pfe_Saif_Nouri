const DAY_MS = 24 * 60 * 60 * 1000;

const RISK_TO_STATE = {
  LOW: 'Entretien suivi',
  MEDIUM: 'À surveiller',
  HIGH: 'Entretien urgent'
};

const RISK_TO_SCORE = {
  LOW: 25,
  MEDIUM: 60,
  HIGH: 90
};

const CRITICAL_KEYWORDS = [
  'frein',
  'brake',
  'plaquette',
  'disque',
  'moteur',
  'engine',
  'courroie',
  'distribution',
  'timing belt',
  'batterie',
  'battery',
  'amortisseur',
  'suspension',
  'transmission'
];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function toDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function isCriticalEntry(intervention) {
  const haystack = normalizeText([
    intervention?.type,
    intervention?.description,
    ...(Array.isArray(intervention?.parts) ? intervention.parts.map((part) => part?.nom || part?.name || part) : [])
  ].join(' '));

  return CRITICAL_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function computeGaps(history) {
  const gaps = [];
  for (let index = 1; index < history.length; index += 1) {
    const previous = history[index - 1];
    const current = history[index];
    gaps.push({
      days: Math.max(0, Math.floor((current.date - previous.date) / DAY_MS)),
      km: Math.max(0, current.mileage - previous.mileage)
    });
  }
  return gaps;
}

function getRuleContext({ currentKm = 0, normalizedHistory = [], vehicle = null } = {}) {
  const sortedHistory = Array.isArray(normalizedHistory)
    ? [...normalizedHistory].sort((a, b) => a.date - b.date)
    : [];

  const lastIntervention = sortedHistory[sortedHistory.length - 1] || null;
  // If there is no last intervention, DO NOT fabricate a mileage delta (avoid subtracting from 0)
  const mileageSinceLastMaintenance = lastIntervention
    ? Math.max(0, Number(currentKm) - Number(lastIntervention.mileage || 0))
    : null;
  const daysSinceLastIntervention = lastIntervention ? Math.max(0, Math.floor((Date.now() - lastIntervention.date.getTime()) / DAY_MS)) : null;
  const interventionCount = sortedHistory.length;
  const criticalEntries = sortedHistory.filter(isCriticalEntry);
  const criticalMaintenanceFound = criticalEntries.length > 0;
  const gaps = computeGaps(sortedHistory);
  const historyIsRegular = interventionCount >= 3 && gaps.length > 0 && gaps.every((gap) => gap.days <= 365 && gap.km <= 20000);
  const historyIsIrregular = interventionCount > 0 && (
    interventionCount <= 3 ||
    gaps.some((gap) => gap.days > 365 || gap.km > 20000)
  );
  // recentMaintenanceExists must require an actual last intervention
  const recentMaintenanceExists = lastIntervention !== null && mileageSinceLastMaintenance !== null && mileageSinceLastMaintenance < 20000 && (daysSinceLastIntervention === null || daysSinceLastIntervention <= 365);

  return {
    currentKm: Number(currentKm) || 0,
    mileageSinceLastMaintenance,
    daysSinceLastIntervention,
    interventionCount,
    criticalMaintenanceFound,
    criticalEntries,
    historyIsRegular,
    historyIsIrregular,
    recentMaintenanceExists,
    vehicle: vehicle || null,
    lastIntervention,
    gaps
  };
}

function buildExplanation(risk, context, matchedRules) {
  const details = [];
  const mileageLabel = context.lastIntervention === null
    ? 'aucun historique de maintenance'
    : context.mileageSinceLastMaintenance <= 0
      ? 'maintenance effectuée au kilométrage actuel'
      : `${Math.round(context.mileageSinceLastMaintenance)} km depuis la dernière maintenance`;

  if (risk === 'HIGH') {
    details.push(`Risque HIGH: ${mileageLabel}`);
    details.push(`Historique faible: ${context.interventionCount} intervention(s)`);
    if (!context.criticalMaintenanceFound) {
      details.push('Aucune maintenance critique détectée');
    }
  } else if (risk === 'LOW') {
    details.push(`Risque LOW: ${mileageLabel}`);
    details.push('Historique régulier détecté');
    details.push('Maintenance critique présente');
  } else {
    details.push(`Risque MEDIUM: ${mileageLabel}`);
    if (context.historyIsIrregular) {
      details.push('Historique irrégulier ou incomplet');
    }
  }

  return {
    summary: details.join('. ') + '.',
    details,
    mainFactors: matchedRules,
    recommendation: risk === 'HIGH'
      ? 'Visite urgente recommandée'
      : risk === 'MEDIUM'
        ? 'À surveiller'
        : 'Suivi régulier'
  };
}

function evaluateMaintenanceDecision({ currentKm = 0, normalizedHistory = [], vehicle = null } = {}) {
  const context = getRuleContext({ currentKm, normalizedHistory, vehicle });
  const matchedRules = [];

  const highMileageAndFewInterventions = context.currentKm >= 120000 && context.interventionCount <= 3;
  const highUnknownOrVeryOldMaintenance = context.lastIntervention === null || context.mileageSinceLastMaintenance > 50000;

  const lowRisk = context.historyIsRegular && context.recentMaintenanceExists && context.criticalMaintenanceFound;
  const mediumMileageBand = context.currentKm >= 80000 && context.currentKm <= 120000 && context.historyIsIrregular;
  const mediumMissingHistoryButNoCriticalFailure = context.interventionCount > 0 && context.interventionCount < 3;
  const mediumNoCriticalMaintenance = !context.criticalMaintenanceFound;

  let risk = 'MEDIUM';
  if (highMileageAndFewInterventions || highUnknownOrVeryOldMaintenance) {
    risk = 'HIGH';
    if (highMileageAndFewInterventions) matchedRules.push('mileage>=120000_and_interventions<=3');
    if (highUnknownOrVeryOldMaintenance) matchedRules.push('last_maintenance_unknown_or_very_old');
  } else if (lowRisk) {
    risk = 'LOW';
    matchedRules.push('recent_maintenance_under_20000', 'regular_history', 'critical_maintenance_present');
  } else if (mediumMileageBand || mediumMissingHistoryButNoCriticalFailure || mediumNoCriticalMaintenance || context.historyIsIrregular) {
    risk = 'MEDIUM';
    if (mediumMileageBand) {
      matchedRules.push('mileage_between_20000_and_50000');
    }
    if (mediumMissingHistoryButNoCriticalFailure) {
      matchedRules.push('missing_some_history_but_not_critical_failure');
    }
    if (mediumNoCriticalMaintenance) {
      matchedRules.push('no_critical_maintenance');
    }
    if (context.historyIsIrregular) {
      matchedRules.push('irregular_maintenance_history');
    }
  } else {
    matchedRules.push('fallback_medium');
  }

  const explanation = buildExplanation(risk, context, matchedRules);

  return {
    risk,
    score: RISK_TO_SCORE[risk],
    state: RISK_TO_STATE[risk],
    explanation: explanation.summary,
    explanationDetails: explanation.details,
    recommendation: explanation.recommendation,
    matchedRules,
    context,
    tone: risk === 'HIGH' ? 'rose' : risk === 'MEDIUM' ? 'amber' : 'emerald'
  };
}

module.exports = {
  evaluateMaintenanceDecision,
  getRuleContext,
  isCriticalEntry,
  normalizeText
};
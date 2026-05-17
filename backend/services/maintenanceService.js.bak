const { pool } = require('../db');
const { evaluateMaintenanceDecision, normalizeText } = require('./riskRules');

const DAY_MS = 24 * 60 * 60 * 1000;

const VEHICLE_PROFILE = {
  essence: { km: 1, days: 1 },
  diesel: { km: 1.1, days: 1 },
  hybride: { km: 0.95, days: 0.92 },
  electrique: { km: 0.85, days: 0.92 }
};

const BASE_RULES = [
  {
    id: 'revision-generale',
    label: 'Révision générale',
    maintenanceType: 'revision',
    intervalKm: 15000,
    intervalDays: 365,
    priority: 'high',
    description: 'Contrôle global du moteur, des fluides et des organes de sécurité.'
  },
  {
    id: 'vidange',
    label: 'Vidange',
    maintenanceType: 'vidange',
    intervalKm: 10000,
    intervalDays: 365,
    priority: 'high',
    description: 'Huile moteur et filtre Ã  huile.'
  },
  {
    id: 'filtre-air',
    label: 'Filtre Ã  air / habitacle',
    maintenanceType: 'filtre',
    intervalKm: 15000,
    intervalDays: 365,
    priority: 'medium',
    description: 'Remplacement des filtres de circulation et d’habitacle.'
  },
  {
    id: 'pneus',
    label: 'Pneus',
    maintenanceType: 'pneus',
    intervalKm: 20000,
    intervalDays: 540,
    priority: 'medium',
    description: 'Usure, pression et équilibrage.'
  },
  {
    id: 'freinage',
    label: 'Freinage',
    maintenanceType: 'frein',
    intervalKm: 30000,
    intervalDays: 730,
    priority: 'high',
    description: 'Plaquettes, disques et liquide de frein.'
  },
  {
    id: 'batterie',
    label: 'Batterie',
    maintenanceType: 'batterie',
    intervalKm: 30000,
    intervalDays: 730,
    priority: 'medium',
    description: 'Capacité de charge et état du circuit électrique.'
  },
  {
    id: 'controle-technique',
    label: 'Contrôle technique',
    maintenanceType: 'inspection',
    intervalKm: null,
    intervalDays: 365,
    priority: 'critical',
    description: 'Vérification réglementaire et sécurité globale.'
  }
];

const STATE_META = {
  NORMAL: { level: 'NORMAL', label: 'NORMAL', color: 'emerald', alertType: 'info', state: 'NORMAL' },
  BIENTOT: { level: 'BIENTOT', label: 'BIENTÃ”T', color: 'amber', alertType: 'warning', state: 'BIENTÃ”T' },
  URGENT: { level: 'URGENT', label: 'URGENT', color: 'red', alertType: 'danger', state: 'URGENT' }
};

const PRIORITY_WEIGHT = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

const STATE_WEIGHT = {
  NORMAL: 1,
  BIENTOT: 2,
  URGENT: 3
};

const normalizeMaintenanceLevel = (value) => {
  const normalized = normalizeText(value).replace(/\s+/g, '');

  if (normalized === 'urgent') return 'URGENT';
  if (normalized === 'bientot') return 'BIENTOT';
  return 'NORMAL';
};

const clampPercent = (value) => Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Number(value) : 0));

const dedupeMaintenanceItems = (items) => {
  const deduped = new Map();

  for (const item of items || []) {
    if (!item) continue;

    const key = [
      normalizeText(item.maintenanceType || item.label || item.intervention_type || item.type),
      item.date || item.scheduled_date || null,
      item.km ?? item.scheduled_km ?? null
    ].join('|');

    const currentLevel = normalizeMaintenanceLevel(item.status || item.level || item.state);
    const currentWeight = STATE_WEIGHT[currentLevel] || 0;
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, { ...item, status: currentLevel, level: currentLevel, state: currentLevel });
      continue;
    }

    const existingLevel = normalizeMaintenanceLevel(existing.status || existing.level || existing.state);
    const existingWeight = STATE_WEIGHT[existingLevel] || 0;
    const keepCurrent = currentWeight > existingWeight || (currentWeight === existingWeight && Number(item.id || 0) > Number(existing.id || 0));

    if (keepCurrent) {
      deduped.set(key, {
        ...existing,
        ...item,
        status: currentLevel,
        level: currentLevel,
        state: currentLevel
      });
    }
  }

  return Array.from(deduped.values());
};

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const addDays = (value, days) => {
  const baseDate = toDate(value);
  if (!baseDate || !Number.isFinite(Number(days))) {
    return null;
  }

  const nextDate = new Date(baseDate.getTime() + Number(days) * DAY_MS);
  return nextDate.toISOString().split('T')[0];
};

const getVehicleKind = (vehicleType) => {
  const normalized = normalizeText(vehicleType);

  if (normalized.includes('elect')) return 'electrique';
  if (normalized.includes('hybr')) return 'hybride';
  if (normalized.includes('dies')) return 'diesel';
  return 'essence';
};

const getRuleBook = (vehicleType) => {
  const kind = getVehicleKind(vehicleType);
  const profile = VEHICLE_PROFILE[kind] || VEHICLE_PROFILE.essence;

  return BASE_RULES
    .filter((rule) => !(kind === 'electrique' && rule.id === 'vidange'))
    .map((rule) => ({
      ...rule,
      intervalKm: Number.isFinite(rule.intervalKm) && rule.intervalKm !== null
        ? Math.round(rule.intervalKm * profile.km)
        : null,
      intervalDays: Number.isFinite(rule.intervalDays) && rule.intervalDays !== null
        ? Math.round(rule.intervalDays * profile.days)
        : null
    }));
};

const buildRuleMessage = (rule, evaluation) => {
  if (evaluation.level === 'URGENT') {
    const parts = [];
    if (evaluation.criticalReasonLabel) parts.push(evaluation.criticalReasonLabel);
    const suffix = parts.length > 0 ? ` (${parts.join(' et ')})` : '';
    return `${rule.label} urgente${suffix}. Une prise en charge immédiate est recommandée.`;
  }

  if (evaluation.level === 'BIENTOT') {
    const kmPart = evaluation.remainingKm !== null ? `${evaluation.remainingKm.toLocaleString('fr-FR')} km restants` : null;
    const dayPart = evaluation.remainingDays !== null ? `${evaluation.remainingDays} jour(s) restants` : null;
    const segments = [kmPart, dayPart].filter(Boolean).join(' et ');
    return segments
      ? `${rule.label} bientôt nécessaire. ${segments}.`
      : `${rule.label} bientôt nécessaire. Planifiez la prochaine visite.`;
  }

  return `${rule.label} sous contrôle. Aucun dépassement critique détecté.`;
};

const evaluateRule = (rule, { currentKm, lastServiceKm, referenceDate, today, hasHistory }) => {
  const safeCurrentKm = Number(currentKm) || 0;
  const safeLastServiceKm = Number.isFinite(Number(lastServiceKm)) ? Number(lastServiceKm) : 0;
  const nextRevisionKm = rule.intervalKm !== null ? safeLastServiceKm + Number(rule.intervalKm) : null;
  const nextRevisionDate = rule.intervalDays !== null ? addDays(referenceDate, rule.intervalDays) : null;

  const rawKmProgress = rule.intervalKm ? ((safeCurrentKm - safeLastServiceKm) / Number(rule.intervalKm)) * 100 : 0;
  const kmProgressPercent = Math.round(clampPercent(rawKmProgress) * 10) / 10;

  const rawDaysProgress = nextRevisionDate && referenceDate && rule.intervalDays
    ? (((today.getTime() - toDate(referenceDate).getTime()) / DAY_MS) / Number(rule.intervalDays)) * 100
    : 0;
  const daysProgressPercent = Math.round(clampPercent(rawDaysProgress) * 10) / 10;

  const rawRemainingKm = nextRevisionKm !== null ? Math.round(Number(nextRevisionKm) - safeCurrentKm) : null;
  const remainingKm = rawRemainingKm !== null ? Math.max(0, rawRemainingKm) : null;
  const rawRemainingDays = nextRevisionDate ? Math.ceil((toDate(nextRevisionDate).getTime() - today.getTime()) / DAY_MS) : null;
  const remainingDays = rawRemainingDays !== null ? Math.max(0, rawRemainingDays) : null;
  const isKmCritical = nextRevisionKm !== null && rawRemainingKm !== null && rawRemainingKm <= 0;
  const isDateCritical = nextRevisionDate !== null && rawRemainingDays !== null && rawRemainingDays <= 0;
  const isSoonByKm = nextRevisionKm !== null && rawRemainingKm !== null && rawRemainingKm > 0 && rawRemainingKm <= Math.max(500, Math.round(Number(rule.intervalKm) * 0.2));
  const isSoonByDate = nextRevisionDate !== null && rawRemainingDays !== null && rawRemainingDays > 0 && rawRemainingDays <= Math.max(30, Math.round(Number(rule.intervalDays) * 0.2));

  const criticalReasonLabel = isKmCritical && isDateCritical
    ? `dépassé de ${Math.abs(rawRemainingKm || 0).toLocaleString('fr-FR')} km et échéance dépassée de ${Math.abs(rawRemainingDays || 0)} jour(s)`
    : isKmCritical
      ? `dépassé de ${Math.abs(rawRemainingKm || 0).toLocaleString('fr-FR')} km`
      : isDateCritical
        ? `échéance dépassée de ${Math.abs(rawRemainingDays || 0)} jour(s)`
        : null;

  let level = 'NORMAL';
  if (isKmCritical || isDateCritical) {
    level = 'URGENT';
  } else if (isSoonByKm || isSoonByDate) {
    level = 'BIENTOT';
  } else if (!hasHistory) {
    level = 'NORMAL';
  }

  const stateInfo = STATE_META[level];
  const message = buildRuleMessage(rule, {
    level,
    isKmCritical,
    isDateCritical,
    remainingKm,
    remainingDays
  });

  return {
    id: rule.id,
    label: rule.label,
    maintenanceType: rule.maintenanceType,
    priority: rule.priority,
    priorityWeight: PRIORITY_WEIGHT[rule.priority] || 1,
    intervalKm: rule.intervalKm,
    intervalDays: rule.intervalDays,
    nextRevisionKm,
    nextRevisionDate,
    kmProgressPercent: Math.round(kmProgressPercent * 10) / 10,
    daysProgressPercent: Math.round(daysProgressPercent * 10) / 10,
    remainingKm,
    remainingDays,
    isKmCritical,
    isDateCritical,
    ...stateInfo,
    level,
    status: level,
    state: stateInfo?.state || level,
    message,
    description: rule.description,
    score: Math.round(Math.max(kmProgressPercent, daysProgressPercent) * 10) / 10,
    progressPercent: Math.max(kmProgressPercent, daysProgressPercent),
    criticalReasonLabel,
    criticalReason: isKmCritical ? 'km' : isDateCritical ? 'date' : null,
    dueReason: isKmCritical && isDateCritical ? 'km_date' : isKmCritical ? 'km' : isDateCritical ? 'date' : null
  };
};

const sortByCriticality = (left, right) => {
  const stateDiff = STATE_WEIGHT[right.level] - STATE_WEIGHT[left.level];
  if (stateDiff !== 0) return stateDiff;

  const priorityDiff = (right.priorityWeight || 0) - (left.priorityWeight || 0);
  if (priorityDiff !== 0) return priorityDiff;

  const dateLeft = left.nextRevisionDate ? toDate(left.nextRevisionDate)?.getTime() || Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
  const dateRight = right.nextRevisionDate ? toDate(right.nextRevisionDate)?.getTime() || Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
  if (dateLeft !== dateRight) return dateLeft - dateRight;

  return (right.score || 0) - (left.score || 0);
};

const buildVehicleAccessQuery = async (vehicleId, user) => {
  const vehicleResult = await pool.query(
    `SELECT id, user_id, modele_voiture, matricule_voiture, type_vehicule, kilometrage_voiture, photo_voiture, created_at
     FROM vehicules
     WHERE id = $1`,
    [vehicleId]
  );

  if (vehicleResult.rows.length === 0) {
    return { vehicle: null, authorized: false };
  }

  const vehicle = vehicleResult.rows[0];
  const currentUserId = Number(user?.id);
  const role = user?.role;
  const authorized = Boolean(
    role === 'admin' ||
    role === 'garage' ||
    (Number.isFinite(currentUserId) && Number(vehicle.user_id) === currentUserId)
  );

  return { vehicle, authorized };
};

const loadVehicleInterventions = async (vehicleId) => {
  const result = await pool.query(
    `SELECT id, vehicle_id, date_intervention, type, description, garage_nom, garage_adresse, kilometrage, cout_total, km_recommande, jours_recommandes, created_at, updated_at
     FROM interventions
     WHERE vehicle_id = $1
     ORDER BY date_intervention ASC, created_at ASC, id ASC`,
    [vehicleId]
  );

  return result.rows || [];
};

const getScheduleItemsFromDatabase = async (vehicleId) => {
  const result = await pool.query(
    `SELECT id, intervention_type, scheduled_date, scheduled_km, status, notes, source_intervention_id
     FROM maintenance_schedule
     WHERE vehicle_id = $1
     ORDER BY scheduled_date ASC NULLS LAST, scheduled_km ASC NULLS LAST, id ASC`,
    [vehicleId]
  );

  return result.rows || [];
};

const computeMaintenanceSnapshot = ({ vehicle, interventions = [], storedSchedule = [] }) => {
  const normalizedVehicleKm = Number(vehicle?.kilometrage_voiture || 0);
  const normalizedHistory = Array.isArray(interventions)
    ? interventions
        .filter((item) => item && item.date_intervention)
        .map((item) => ({
          id: item.id,
          date: toDate(item.date_intervention || item.created_at),
          mileage: Number(item.kilometrage || 0),
          type: normalizeText(item.type),
          rawType: item.type,
          description: item.description || null,
          garageName: item.garage_nom || null,
          garageAddress: item.garage_adresse || null,
          kmRecommended: Number(item.km_recommande || 0),
          daysRecommended: Number(item.jours_recommandes || 0)
        }))
        .filter((item) => item.date)
    : [];

  const dedupedHistory = [];
  const historySeen = new Map();
  const sortedHistory = [...normalizedHistory].sort((a, b) => a.date - b.date || a.mileage - b.mileage || Number(a.id || 0) - Number(b.id || 0));

  for (const item of sortedHistory) {
    const key = `${item.type}|${item.mileage}`;
    const previous = historySeen.get(key);

    if (!previous) {
      historySeen.set(key, item);
      dedupedHistory.push(item);
      continue;
    }

    const keepCurrent = item.date.getTime() >= previous.date.getTime() || Number(item.id || 0) > Number(previous.id || 0);
    if (keepCurrent) {
      historySeen.set(key, item);
      const index = dedupedHistory.findIndex((historyItem) => historyItem.type === previous.type && historyItem.mileage === previous.mileage);
      if (index >= 0) {
        dedupedHistory[index] = item;
      }
    }
  }

  const latestIntervention = dedupedHistory.length > 0 ? dedupedHistory[dedupedHistory.length - 1] : null;
  const historyMaxMileage = dedupedHistory.reduce((max, item) => Math.max(max, Number(item.mileage || 0)), 0);
  const currentKm = Math.max(normalizedVehicleKm, historyMaxMileage);
  const referenceDate = latestIntervention?.date || toDate(vehicle?.created_at) || new Date();
  const referenceKm = Number.isFinite(Number(latestIntervention?.mileage))
    ? Number(latestIntervention.mileage)
    : currentKm;
  const today = new Date();
  const hasHistory = Boolean(latestIntervention);

  const ruleBook = getRuleBook(vehicle?.type_vehicule);
  const ruleEvaluations = ruleBook.map((rule) => evaluateRule(rule, {
    currentKm,
    lastServiceKm: referenceKm,
    referenceDate,
    today,
    hasHistory
  }));

  const riskDecision = evaluateMaintenanceDecision({
    currentKm,
    normalizedHistory,
    vehicle
  });

  const sortedEvaluations = [...ruleEvaluations].sort(sortByCriticality);
  const mainRule = sortedEvaluations[0] || null;
  const bestRule = sortedEvaluations.find((item) => item.level === 'URGENT')
    || sortedEvaluations.find((item) => item.level === 'BIENTOT')
    || sortedEvaluations[0]
    || null;

  let finalLevel = bestRule?.level || 'NORMAL';
  if (!hasHistory && !bestRule) {
    finalLevel = 'NORMAL';
  }

  const urgency = {
    ...STATE_META[finalLevel],
    level: finalLevel,
    status: finalLevel,
    state: STATE_META[finalLevel].state,
    message: bestRule?.message || STATE_META[finalLevel].message,
    mainMaintenance: bestRule ? {
      id: bestRule.id,
      label: bestRule.label,
      maintenanceType: bestRule.maintenanceType,
      nextRevisionKm: bestRule.nextRevisionKm,
      nextRevisionDate: bestRule.nextRevisionDate,
      remainingKm: bestRule.remainingKm,
      remainingDays: bestRule.remainingDays,
      level: bestRule.level,
      status: bestRule.level,
      criticalReasonLabel: bestRule.criticalReasonLabel,
      alertType: bestRule.alertType,
      color: bestRule.color,
      score: bestRule.score
    } : null,
    score: riskDecision.score,
    explanation: riskDecision.explanation,
    recommendation: riskDecision.recommendation,
    matchedRules: riskDecision.matchedRules,
    risk: riskDecision.risk
  };

  const nextRevision = bestRule || mainRule;
  const nextInterventions = dedupeMaintenanceItems(sortedEvaluations.slice(0, 6).map((item) => ({
    id: item.id,
    label: item.label,
    date: item.nextRevisionDate,
    km: item.nextRevisionKm,
    status: item.level,
    notes: item.message,
    source: 'generated',
    alertType: item.alertType,
    color: item.color,
    remainingKm: item.remainingKm,
    remainingDays: item.remainingDays,
    maintenanceType: item.maintenanceType
  })));

  const scheduleItems = nextInterventions.map((item) => ({
    id: item.id,
    label: item.label || item.intervention_type,
    date: item.date || item.scheduled_date || null,
    km: item.km ?? item.scheduled_km ?? null,
    status: normalizeMaintenanceLevel(item.status || item.level || item.state || 'NORMAL'),
    notes: item.notes || null,
    source: item.source || (item.source_intervention_id ? 'database' : 'generated'),
    alertType: item.alertType || null,
    color: item.color || null,
    remainingKm: item.remainingKm ?? null,
    remainingDays: item.remainingDays ?? null,
    maintenanceType: item.maintenanceType || null
  }));

  const alerts = sortedEvaluations
    .filter((item) => item.level === 'URGENT' || item.level === 'BIENTOT')
    .slice(0, 3)
    .map((item) => ({
      type: item.maintenanceType,
      label: item.label,
      message: item.message,
      urgency: item.level,
      status: item.level,
      alertType: item.alertType,
      badgeColor: item.color,
      nextRevisionKm: item.nextRevisionKm,
      nextRevisionDate: item.nextRevisionDate,
      remainingKm: item.remainingKm,
      remainingDays: item.remainingDays
    }));

  return {
    vehicleId: Number(vehicle?.id) || null,
    currentKm,
    lastInterventionId: latestIntervention?.id || null,
    lastInterventionDate: latestIntervention?.date ? latestIntervention.date.toISOString().split('T')[0] : null,
    lastInterventionKm: latestIntervention?.mileage ?? currentKm,
    lastInterventionType: latestIntervention?.rawType || 'Maintenance préventive',
    kmRecommended: nextRevision?.intervalKm || latestIntervention?.kmRecommended || null,
    daysRecommended: nextRevision?.intervalDays || latestIntervention?.daysRecommended || null,
    recommendationSource: latestIntervention ? 'maintenance-intelligence' : 'new-vehicle-default',
    nextRevisionKm: nextRevision?.nextRevisionKm ?? null,
    nextRevisionDate: nextRevision?.nextRevisionDate ?? null,
    kmProgressPercent: nextRevision?.kmProgressPercent ?? 0,
    daysProgressPercent: nextRevision?.daysProgressPercent ?? 0,
    isKmCritical: Boolean(nextRevision?.isKmCritical),
    isDateCritical: Boolean(nextRevision?.isDateCritical),
    urgency,
    alerts,
    maintenanceTypes: ruleEvaluations,
    nextInterventions,
    schedule: {
      items: scheduleItems
    },
    risk: {
      score: riskDecision.score,
      level: riskDecision.risk,
      explanation: riskDecision.explanation,
      recommendation: riskDecision.recommendation,
      matchedRules: riskDecision.matchedRules
    }
  };
};

const calculateNextRevision = async (vehicleId, user = null) => {
  const { vehicle, authorized } = await buildVehicleAccessQuery(vehicleId, user);

  if (!vehicle) {
    return null;
  }

  if (user && !authorized) {
    const error = new Error('FORBIDDEN');
    error.code = 'FORBIDDEN';
    throw error;
  }

  const interventions = await loadVehicleInterventions(vehicleId);
  return computeMaintenanceSnapshot({ vehicle, interventions, storedSchedule: [] });
};

const buildMaintenanceDashboard = async (vehicleId, user = null) => {
  const { vehicle, authorized } = await buildVehicleAccessQuery(vehicleId, user);

  if (!vehicle) {
    return null;
  }

  if (user && !authorized) {
    const error = new Error('FORBIDDEN');
    error.code = 'FORBIDDEN';
    throw error;
  }

  const interventions = await loadVehicleInterventions(vehicleId);
  const snapshot = computeMaintenanceSnapshot({ vehicle, interventions, storedSchedule: [] });

  return {
    vehicle: {
      id: Number(vehicle.id),
      modele_voiture: vehicle.modele_voiture,
      matricule_voiture: vehicle.matricule_voiture,
      type_vehicule: vehicle.type_vehicule,
      kilometrage_voiture: snapshot.currentKm,
      photo_voiture: vehicle.photo_voiture
    },
    urgency: snapshot.urgency,
    mileage: {
      currentKm: snapshot.currentKm,
      nextRevisionKm: snapshot.nextRevisionKm,
      progressPercent: snapshot.kmProgressPercent,
      kmRecommended: snapshot.kmRecommended,
      remainingKm: snapshot.nextRevisionKm !== null
        ? Math.max(0, Number(snapshot.nextRevisionKm) - Number(snapshot.currentKm || 0))
        : null
    },
    temporal: {
      lastInterventionDate: snapshot.lastInterventionDate,
      nextRevisionDate: snapshot.nextRevisionDate,
      progressPercent: snapshot.daysProgressPercent,
      daysRecommended: snapshot.daysRecommended
    },
    lastIntervention: snapshot.lastInterventionId
      ? {
          id: snapshot.lastInterventionId,
          type: snapshot.lastInterventionType,
          date: snapshot.lastInterventionDate,
          garageName: interventions[interventions.length - 1]?.garage_nom || null,
          garageAddress: interventions[interventions.length - 1]?.garage_adresse || null,
          kilometrage: snapshot.lastInterventionKm,
          description: interventions[interventions.length - 1]?.description || null,
          kmRecommended: interventions[interventions.length - 1]?.km_recommande || null,
          daysRecommended: interventions[interventions.length - 1]?.jours_recommandes || null
        }
      : null,
    alerts: snapshot.alerts,
    maintenanceTypes: snapshot.maintenanceTypes,
    nextInterventions: snapshot.nextInterventions,
    schedule: snapshot.schedule,
    risk: snapshot.risk,
    intelligence: {
      state: snapshot.urgency.state,
      level: snapshot.urgency.level,
      label: snapshot.urgency.label,
      color: snapshot.urgency.color,
      message: snapshot.urgency.message,
      alertType: snapshot.urgency.alertType,
      score: snapshot.urgency.score,
      recommendation: snapshot.urgency.recommendation,
      explanation: snapshot.urgency.explanation
    }
  };
};

const syncMaintenanceState = async (vehicleId) => {
  const vehicleResult = await pool.query(
    `SELECT id, modele_voiture, matricule_voiture, type_vehicule, kilometrage_voiture, photo_voiture, created_at
     FROM vehicules
     WHERE id = $1`,
    [vehicleId]
  );

  if (vehicleResult.rows.length === 0) {
    return null;
  }

  const vehicle = vehicleResult.rows[0];
  const interventions = await loadVehicleInterventions(vehicleId);
  const snapshot = computeMaintenanceSnapshot({ vehicle, interventions, storedSchedule: [] });
  const historyMaxMileage = interventions.reduce((max, item) => Math.max(max, Number(item.kilometrage || 0)), 0);
  const nextVehicleMileage = Math.max(Number(vehicle.kilometrage_voiture || 0), historyMaxMileage, Number(snapshot.currentKm || 0));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE vehicules SET kilometrage_voiture = $2, updated_at = NOW() WHERE id = $1', [vehicleId, nextVehicleMileage]);
    await client.query('DELETE FROM maintenance_schedule WHERE vehicle_id = $1', [vehicleId]);

    const sourceInterventionId = snapshot.lastInterventionId || null;
    for (const item of snapshot.schedule.items) {
      await client.query(
        `INSERT INTO maintenance_schedule (
           vehicle_id,
           intervention_type,
           scheduled_date,
           scheduled_km,
           status,
           notes,
           source_intervention_id,
           created_at,
           updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          vehicleId,
          item.maintenanceType || item.label,
          item.date || null,
          item.km !== undefined && item.km !== null ? Number(item.km) : null,
          item.status || 'NORMAL',
          item.notes || null,
          sourceInterventionId
        ]
      );
    }

    await client.query('COMMIT');
    return snapshot;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  calculateNextRevision,
  buildMaintenanceDashboard,
  computeMaintenanceSnapshot,
  syncMaintenanceState,
  getRuleBook
};



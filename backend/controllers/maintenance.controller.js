const { asyncHandler } = require('../middlewares/asyncHandler');
const { sendApiResponse } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const maintenanceService = require('../services/maintenanceService');
const { pool } = require('../db');

const DEFAULT_KM_RECOMMENDED = 5000;
const DEFAULT_DAYS_RECOMMENDED = 180;

const addDays = (dateValue, days) => {
  const baseDate = new Date(dateValue);
  if (Number.isNaN(baseDate.getTime())) {
    return null;
  }

  const nextDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
  return nextDate.toISOString().split('T')[0];
};

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildUrgency = (revisionData) => {
  if (!revisionData) {
    return {
      level: 'future',
      label: 'PLANIFIÉ',
      color: 'slate',
      message: 'Aucune intervention enregistrée. Une maintenance préventive peut être préparée.'
    };
  }

  const kmProgress = Number(revisionData.kmProgressPercent || 0);
  const daysProgress = Number(revisionData.daysProgressPercent || 0);
  const maxProgress = Math.max(kmProgress, daysProgress);

  if (revisionData.isKmCritical || revisionData.isDateCritical || maxProgress >= 95) {
    return {
      level: 'urgent',
      label: 'URGENT',
      color: 'red',
      message: 'Révision urgente. Une maintenance immédiate est recommandée.'
    };
  }

  if (maxProgress >= 70) {
    return {
      level: 'soon',
      label: 'BIENTÔT',
      color: 'amber',
      message: 'Révision bientôt nécessaire. Planifiez une visite prochainement.'
    };
  }

  return {
    level: 'ok',
    label: 'A JOUR',
    color: 'emerald',
    message: 'Aucune révision urgente. Le véhicule reste dans une zone sûre.'
  };
};

const buildFallbackRevision = (vehicle, latestIntervention = null) => {
  const currentKm = Number(vehicle?.kilometrage_voiture || 0);
  const lastInterventionDate = latestIntervention?.date_intervention || new Date().toISOString().split('T')[0];
  const kmRecommended = Number(latestIntervention?.km_recommande || DEFAULT_KM_RECOMMENDED);
  const daysRecommended = Number(latestIntervention?.jours_recommandes || DEFAULT_DAYS_RECOMMENDED);
  const baseKm = Number(latestIntervention?.kilometrage || currentKm);
  const nextRevisionKm = Number.isFinite(baseKm) ? baseKm + kmRecommended : null;
  const nextRevisionDate = addDays(lastInterventionDate, daysRecommended);
  const kmProgressPercent = nextRevisionKm ? Math.min(100, (currentKm / nextRevisionKm) * 100) : 0;
  const today = new Date();
  const lastDate = toDate(lastInterventionDate) || today;
  const daysElapsed = Math.max(0, Math.floor((today - lastDate) / (24 * 60 * 60 * 1000)));
  const daysProgressPercent = daysRecommended > 0 ? Math.min(100, (daysElapsed / daysRecommended) * 100) : 0;

  return {
    vehicleId: Number(vehicle?.id),
    currentKm,
    lastInterventionId: latestIntervention?.id || null,
    lastInterventionDate,
    lastInterventionKm: latestIntervention?.kilometrage ?? currentKm,
    lastInterventionType: latestIntervention?.type || 'Maintenance préventive',
    kmRecommended,
    daysRecommended,
    recommendationSource: 'fallback-default',
    nextRevisionKm,
    nextRevisionDate,
    kmProgressPercent: Math.round(kmProgressPercent * 10) / 10,
    daysProgressPercent: Math.round(daysProgressPercent * 10) / 10,
    isKmCritical: Boolean(nextRevisionKm) && currentKm >= nextRevisionKm,
    isDateCritical: Boolean(nextRevisionDate) && today >= new Date(nextRevisionDate)
  };
};

const buildMaintenanceSchedule = (revisionData, latestIntervention, vehicle, storedSchedule = []) => {
  if (storedSchedule.length > 0) {
    return storedSchedule.map((item) => ({
      id: item.id,
      label: item.intervention_type,
      date: item.scheduled_date || null,
      km: item.scheduled_km ?? null,
      status: item.status || 'planned',
      source: 'database',
      notes: item.notes || null
    }));
  }

  const baseDate = toDate(revisionData?.lastInterventionDate || latestIntervention?.date_intervention) || new Date();
  const currentKm = Number(vehicle?.kilometrage_voiture || revisionData?.currentKm || 0);
  const nextRevisionDate = revisionData?.nextRevisionDate || addDays(baseDate, Number(revisionData?.daysRecommended || DEFAULT_DAYS_RECOMMENDED));
  const lastInterventionKm = Number(revisionData?.lastInterventionKm ?? currentKm);

  const templates = [
    {
      id: 'revision-generale',
      label: 'Révision générale',
      date: nextRevisionDate,
      km: revisionData?.nextRevisionKm ?? null,
      note: 'Révision moteur et contrôle global'
    },
    {
      id: 'vidange',
      label: 'Vidange',
      date: addDays(baseDate, 180),
      km: lastInterventionKm + 5000,
      note: 'Huile moteur et filtre à huile'
    },
    {
      id: 'changement-filtre',
      label: 'Changement filtre',
      date: addDays(baseDate, 240),
      km: lastInterventionKm + 10000,
      note: 'Filtre à air / habitacle'
    },
    {
      id: 'controle-technique',
      label: 'Contrôle technique',
      date: addDays(baseDate, 365),
      km: lastInterventionKm + 15000,
      note: 'Vérification réglementaire'
    },
    {
      id: 'pneus',
      label: 'Pneus',
      date: addDays(baseDate, 270),
      km: lastInterventionKm + 20000,
      note: 'Usure, pression et équilibrage'
    },
    {
      id: 'batterie',
      label: 'Batterie',
      date: addDays(baseDate, 330),
      km: lastInterventionKm + 30000,
      note: 'Vérification électrique et charge'
    }
  ];

  const today = new Date();

  return templates
    .map((item) => {
      const dateValue = toDate(item.date);
      const daysRemaining = dateValue ? Math.ceil((dateValue - today) / (24 * 60 * 60 * 1000)) : null;
      const kmRemaining = item.km !== null ? Number(item.km) - currentKm : null;
      const isCritical = (daysRemaining !== null && daysRemaining <= 0) || (kmRemaining !== null && kmRemaining <= 0);
      const isSoon = !isCritical && ((daysRemaining !== null && daysRemaining <= 45) || (kmRemaining !== null && kmRemaining <= 1500));

      return {
        id: item.id,
        label: item.label,
        date: item.date,
        km: item.km,
        status: isCritical ? 'urgent' : isSoon ? 'soon' : 'planned',
        source: 'generated',
        notes: item.note,
        daysRemaining,
        kmRemaining
      };
    })
    .sort((a, b) => {
      const dateA = toDate(a.date)?.getTime() || Number.MAX_SAFE_INTEGER;
      const dateB = toDate(b.date)?.getTime() || Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });
};

const getMaintenanceDashboard = asyncHandler(async (req, res) => {
  const vehicleId = Number(req.query.vehicleId);

  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    throw new AppError('vehicleId invalide', 400, 'INVALID_VEHICLE_ID');
  }

  const vehicleResult = await pool.query(
    'SELECT id, user_id, modele_voiture, matricule_voiture, type_vehicule, kilometrage_voiture, photo_voiture FROM vehicules WHERE id = $1',
    [vehicleId]
  );

  if (vehicleResult.rows.length === 0) {
    throw new AppError('Vehicule introuvable', 404, 'VEHICLE_NOT_FOUND');
  }

  const vehicle = vehicleResult.rows[0];
  const currentUserId = Number(req.user?.id);
  const role = req.user?.role;

  if (!(role === 'admin' || Number(vehicle.user_id) === currentUserId || role === 'garage')) {
    throw new AppError('Acces refuse : non proprietaire', 403, 'FORBIDDEN');
  }

  const lastInterventionResult = await pool.query(
    `SELECT *
     FROM interventions
     WHERE vehicle_id = $1
     ORDER BY date_intervention DESC, created_at DESC, id DESC
     LIMIT 1`,
    [vehicleId]
  );

  const latestIntervention = lastInterventionResult.rows[0] || null;
  const revisionData = (await maintenanceService.calculateNextRevision(vehicleId)) || buildFallbackRevision(vehicle, latestIntervention);
  const urgency = buildUrgency(revisionData);

  const scheduleResult = await pool.query(
    `SELECT id, intervention_type, scheduled_date, scheduled_km, status, notes
     FROM maintenance_schedule
     WHERE vehicle_id = $1
     ORDER BY scheduled_date ASC NULLS LAST, id ASC`,
    [vehicleId]
  );

  const scheduleItems = buildMaintenanceSchedule(revisionData, latestIntervention, vehicle, scheduleResult.rows || []);

  const nextInterventions = scheduleItems.slice(0, 6).map((item) => ({
    id: item.id,
    label: item.label,
    date: item.date,
    km: item.km,
    status: item.status,
    notes: item.notes,
    source: item.source
  }));

  return sendApiResponse(res, {
    message: 'Tableau de bord maintenance calcule',
    data: {
      vehicle: {
        id: Number(vehicle.id),
        modele_voiture: vehicle.modele_voiture,
        matricule_voiture: vehicle.matricule_voiture,
        type_vehicule: vehicle.type_vehicule,
        kilometrage_voiture: vehicle.kilometrage_voiture,
        photo_voiture: vehicle.photo_voiture
      },
      urgency,
      mileage: {
        currentKm: revisionData.currentKm ?? vehicle.kilometrage_voiture ?? 0,
        nextRevisionKm: revisionData.nextRevisionKm,
        progressPercent: revisionData.kmProgressPercent ?? 0,
        kmRecommended: revisionData.kmRecommended ?? DEFAULT_KM_RECOMMENDED,
        remainingKm: revisionData.nextRevisionKm !== null ? Math.max(0, Number(revisionData.nextRevisionKm) - Number(revisionData.currentKm || 0)) : null
      },
      temporal: {
        lastInterventionDate: revisionData.lastInterventionDate,
        nextRevisionDate: revisionData.nextRevisionDate,
        progressPercent: revisionData.daysProgressPercent ?? 0,
        daysRecommended: revisionData.daysRecommended ?? DEFAULT_DAYS_RECOMMENDED
      },
      lastIntervention: latestIntervention
        ? {
            id: latestIntervention.id,
            type: latestIntervention.type,
            date: latestIntervention.date_intervention,
            garageName: latestIntervention.garage_nom,
            garageAddress: latestIntervention.garage_adresse,
            kilometrage: latestIntervention.kilometrage,
            description: latestIntervention.description,
            kmRecommended: latestIntervention.km_recommande,
            daysRecommended: latestIntervention.jours_recommandes
          }
        : null,
      nextInterventions,
      schedule: {
        items: scheduleItems
      }
    }
  });
});

const getNextRevision = asyncHandler(async (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  
  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    throw new AppError('vehicleId invalide', 400, 'INVALID_VEHICLE_ID');
  }

  // Verify vehicle exists and user is authorized
  const vehicleResult = await pool.query('SELECT id, user_id FROM vehicules WHERE id = $1', [vehicleId]);
  if (vehicleResult.rows.length === 0) {
    throw new AppError('Vehicule introuvable', 404, 'VEHICLE_NOT_FOUND');
  }

  const vehicle = vehicleResult.rows[0];
  const currentUserId = Number(req.user?.id);
  const role = req.user?.role;

  // Only automobiliste owner, garage, or admin can view
  if (!(role === 'admin' || Number(vehicle.user_id) === currentUserId || role === 'garage')) {
    throw new AppError('Acces refuse : non proprietaire', 403, 'FORBIDDEN');
  }

  const revisionData = await maintenanceService.calculateNextRevision(vehicleId);

  if (!revisionData) {
    return sendApiResponse(res, {
      message: 'Aucune intervention enregistree pour ce vehicule',
      data: null
    });
  }

  return sendApiResponse(res, {
    message: 'Prochaine revision calculee',
    data: revisionData
  });
});

module.exports = {
  getMaintenanceDashboard,
  getNextRevision
};

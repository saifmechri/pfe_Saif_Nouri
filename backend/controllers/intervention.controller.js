const { pool } = require('../db');
const { asyncHandler } = require('../middlewares/asyncHandler');
const { sendApiResponse } = require('../utils/apiResponse');
const { AppError } = require('../utils/appError');
const interventionService = require('../services/interventionService');
const garageModel = require('../models/garage.model');

const resolveVehicleOwner = async (vehicleId) => {
  const result = await pool.query('SELECT id, user_id FROM vehicules WHERE id = $1', [vehicleId]);
  return result.rows[0] || null;
};

const listInterventions = asyncHandler(async (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    throw new AppError('vehicleId invalide', 400, 'INVALID_VEHICLE_ID');
  }

  const vehicle = await resolveVehicleOwner(vehicleId);
  if (!vehicle) {
    throw new AppError('Vehicule introuvable', 404, 'VEHICLE_NOT_FOUND');
  }

  const currentUserId = Number(req.user?.id);
  const role = req.user?.role;

  // admin always allowed; owner allowed; garages not allowed to list unless admin or owner
  if (role !== 'admin' && currentUserId !== Number(vehicle.user_id)) {
    throw new AppError('Acces refuse : non proprietaire', 403, 'FORBIDDEN');
  }

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
  const offset = (page - 1) * limit;

  const rows = await interventionService.listForVehicle(vehicleId, { limit, offset });
  return sendApiResponse(res, { data: rows });
});

const getIntervention = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Intervention id invalide', 400, 'INVALID_ID');

  const row = await interventionService.getById(id);
  if (!row) throw new AppError('Intervention introuvable', 404, 'NOT_FOUND');

  // verify ownership
  const vehicle = await resolveVehicleOwner(row.vehicle_id);
  const currentUserId = Number(req.user?.id);
  const role = req.user?.role;

  if (role !== 'admin' && (!vehicle || Number(vehicle.user_id) !== currentUserId)) {
    throw new AppError('Acces refuse', 403, 'FORBIDDEN');
  }

  return sendApiResponse(res, { data: row });
});

const createIntervention = asyncHandler(async (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  if (!Number.isInteger(vehicleId) || vehicleId <= 0) throw new AppError('vehicleId invalide', 400, 'INVALID_VEHICLE_ID');

  const vehicle = await resolveVehicleOwner(vehicleId);
  if (!vehicle) throw new AppError('Vehicule introuvable', 404, 'VEHICLE_NOT_FOUND');

  const role = req.user?.role;
  const currentUserId = Number(req.user?.id);

  // allow automobiliste owner, garage, or admin to create
  if (!(role === 'admin' || Number(vehicle.user_id) === currentUserId || role === 'garage')) {
    throw new AppError('Acces refuse : pas autorise a creer cette intervention', 403, 'FORBIDDEN');
  }

  let garageNameFromProfile = null;
  if (role === 'garage') {
    const g = await garageModel.findGarageIdentityByUserId(currentUserId);
    if (!g) throw new AppError('Profil garage introuvable pour le compte', 403, 'GARAGE_PROFILE_MISSING');
    // attempt to read garage name from DB
    const garageRow = await pool.query('SELECT name FROM garages WHERE id = $1', [g.id]);
    garageNameFromProfile = garageRow.rows[0]?.name || null;
  }

  const payload = {
    vehicleId,
    dateIntervention: req.body?.date_intervention || null,
    type: req.body?.type || 'maintenance',
    description: req.body?.description || null,
    garageNom: req.body?.garage_nom || garageNameFromProfile || null,
    garageAdresse: req.body?.garage_adresse || null,
    kilometrage: req.body?.kilometrage || null,
    coutTotal: req.body?.cout_total || 0,
    kmRecommande: req.body?.km_recommande || null,
    joursRecommandes: req.body?.jours_recommandes || null
  };

  const inserted = await interventionService.create(payload);
  return sendApiResponse(res, { statusCode: 201, message: 'Intervention enregistree', data: inserted });
});

const updateIntervention = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Intervention id invalide', 400, 'INVALID_ID');

  const existing = await interventionService.getById(id);
  if (!existing) throw new AppError('Intervention introuvable', 404, 'NOT_FOUND');

  const vehicle = await resolveVehicleOwner(existing.vehicle_id);
  const role = req.user?.role;
  const currentUserId = Number(req.user?.id);

  // admin always allowed; owner allowed; garage allowed only if it matches intervention.garage_nom
  if (role === 'admin' || (vehicle && Number(vehicle.user_id) === currentUserId)) {
    // allowed
  } else if (role === 'garage') {
    const g = await garageModel.findGarageIdentityByUserId(currentUserId);
    if (!g) throw new AppError('Profil garage introuvable pour le compte', 403, 'GARAGE_PROFILE_MISSING');
    const garageRow = await pool.query('SELECT name FROM garages WHERE id = $1', [g.id]);
    const garageName = garageRow.rows[0]?.name || null;
    if (!garageName || !existing.garage_nom || String(garageName).trim().toLowerCase() !== String(existing.garage_nom).trim().toLowerCase()) {
      throw new AppError('Acces refuse : cette intervention n\'a pas ete enregistree pour votre garage', 403, 'FORBIDDEN_GARAGE_OPERATION');
    }
  } else {
    throw new AppError('Acces refuse : pas autorise', 403, 'FORBIDDEN');
  }

  const updates = {};
  const fields = ['date_intervention','type','description','garage_nom','garage_adresse','kilometrage','cout_total','km_recommande','jours_recommandes'];
  for (const f of fields) {
    if (f in req.body) updates[f] = req.body[f];
  }

  const updated = await interventionService.update(id, updates);
  return sendApiResponse(res, { message: 'Intervention mise a jour', data: updated });
});

const deleteIntervention = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Intervention id invalide', 400, 'INVALID_ID');

  const existing = await interventionService.getById(id);
  if (!existing) throw new AppError('Intervention introuvable', 404, 'NOT_FOUND');

  const vehicle = await resolveVehicleOwner(existing.vehicle_id);
  const role = req.user?.role;
  const currentUserId = Number(req.user?.id);

  if (!(role === 'admin' || (vehicle && Number(vehicle.user_id) === currentUserId))) {
    throw new AppError('Acces refuse : seul proprietaire ou admin peut supprimer', 403, 'FORBIDDEN');
  }

  await interventionService.remove(id);
  return sendApiResponse(res, { message: 'Intervention supprimee' });
});

module.exports = {
  listInterventions,
  getIntervention,
  createIntervention,
  updateIntervention,
  deleteIntervention
};

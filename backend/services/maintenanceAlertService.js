const maintenanceAlertModel = require('../models/maintenanceAlert.model');
const notificationService = require('./notificationService');

const create = async (payload) => {
  return maintenanceAlertModel.createMaintenanceAlert(payload);
};

const getById = async (alertId) => {
  return maintenanceAlertModel.getAlertById(alertId);
};

const listForVehicle = async (vehicleId, opts) => {
  return maintenanceAlertModel.listAlertsForVehicle(vehicleId, opts);
};

const listForUser = async (userId, opts) => {
  return maintenanceAlertModel.listAlertsForUser(userId, opts);
};

const update = async (alertId, updates) => {
  return maintenanceAlertModel.updateAlert(alertId, updates);
};

const remove = async (alertId) => {
  return maintenanceAlertModel.deleteAlert(alertId);
};

// Check and create notifications for due maintenance
const checkAndNotifyDueAlerts = async (vehicleId, currentKm, userId, vehicleName) => {
  try {
    const dueAlerts = await maintenanceAlertModel.checkDueAlerts(vehicleId, currentKm);
    
    for (const alert of dueAlerts) {
      const title = `Entretien dû pour ${vehicleName}`;
      const alertLabels = {
        'oil_change': 'Vidange',
        'tire_rotation': 'Rotation des pneus',
        'brake_check': 'Vérification des freins',
        'filter_change': 'Changement des filtres',
        'inspection': 'Inspection',
        'custom': 'Entretien personnalisé'
      };
      
      const body = `${alertLabels[alert.alert_type] || alert.alert_type} - Prenez rendez-vous avec un garage`;

      await notificationService.createForUser({
        userId,
        actorUserId: null,
        type: 'maintenance',
        referenceId: vehicleId,
        title,
        body,
        metadata: { vehicleId, alertId: alert.id, alertType: alert.alert_type }
      });
    }
  } catch (err) {
    console.error('Failed to check and notify maintenance alerts:', err && err.message ? err.message : err);
  }
};

module.exports = {
  create,
  getById,
  listForVehicle,
  listForUser,
  update,
  remove,
  checkAndNotifyDueAlerts
};



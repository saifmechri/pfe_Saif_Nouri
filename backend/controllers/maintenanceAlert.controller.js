const maintenanceAlertService = require('../services/maintenanceAlertService');

const listAlerts = async (req, res) => {
  try {
    const vehicleId = Number(req.query.vehicleId);

    if (vehicleId) {
      const items = await maintenanceAlertService.listForVehicle(vehicleId, { onlyActive: true });
      return res.json({ success: true, message: 'Alertes entretien', data: { items } });
    }

    const userId = Number(req.user.id);
    const items = await maintenanceAlertService.listForUser(userId, { onlyActive: true });
    return res.json({ success: true, message: 'Alertes entretien', data: { items } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const createAlert = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { vehicleId, alertType, kmTrigger, daysTrigger, lastKm, lastDate } = req.body;

    if (!vehicleId || !alertType) {
      return res.status(400).json({ success: false, message: 'vehicleId et alertType requis', data: null });
    }

    if (kmTrigger === undefined && daysTrigger === undefined) {
      return res.status(400).json({ success: false, message: 'kmTrigger ou daysTrigger requis', data: null });
    }

    const alert = await maintenanceAlertService.create({
      vehicleId: Number(vehicleId),
      userId,
      alertType,
      kmTrigger: kmTrigger !== undefined && kmTrigger !== null ? Number(kmTrigger) : null,
      daysTrigger: daysTrigger !== undefined && daysTrigger !== null ? Number(daysTrigger) : null,
      lastKm: lastKm !== undefined && lastKm !== null ? Number(lastKm) : null,
      lastDate: lastDate || null
    });

    return res.status(201).json({ success: true, message: 'Alerte creee', data: { alert } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const updateAlert = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = req.body;

    const updated = await maintenanceAlertService.update(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Alerte non trouvee', data: null });
    }

    return res.json({ success: true, message: 'Alerte mise a jour', data: { alert: updated } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await maintenanceAlertService.remove(id);
    return res.json({ success: true, message: 'Alerte supprimee', data: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const checkDueAlerts = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { vehicleId, currentKm, vehicleName } = req.body;

    if (!vehicleId || currentKm === undefined) {
      return res.status(400).json({ success: false, message: 'vehicleId et currentKm requis', data: null });
    }

    // Check and auto-create notifications
    await maintenanceAlertService.checkAndNotifyDueAlerts(
      Number(vehicleId),
      Number(currentKm),
      userId,
      vehicleName || 'Véhicule'
    );

    return res.json({ success: true, message: 'Alertes verifiees', data: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

module.exports = {
  listAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  checkDueAlerts
};

const appointmentService = require('../services/appointmentService');
const notificationService = require('../services/notificationService');

const listAppointments = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const role = req.user.role;
    const limit = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);
    const status = req.query.status || null;

    let items = [];
    if (role === 'automobiliste') {
      items = await appointmentService.listForAutomobiliste(userId, { limit, offset, status });
    } else if (role === 'garage') {
      // Get garage_id from user's garage profile (assumption: user.garage_id set by middleware, or lookup needed)
      // For now, we'll need the garage_id from query or headers
      const garageId = Number(req.query.garageId);
      if (!garageId) {
        return res.status(400).json({ success: false, message: 'garageId required for garage users', data: null });
      }
      items = await appointmentService.listForGarage(garageId, { limit, offset, status });
    } else {
      return res.status(403).json({ success: false, message: 'Acces refusé', data: null });
    }

    return res.json({ success: true, message: 'Rendez-vous', data: { items } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const createAppointment = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { garageId, appointmentDate, appointmentTime, description, notes } = req.body;

    if (!garageId || !appointmentDate) {
      return res.status(400).json({ success: false, message: 'garageId et appointmentDate requis', data: null });
    }

    if (req.user.role !== 'automobiliste') {
      return res.status(403).json({ success: false, message: 'Seuls les automobilistes peuvent créer des RDV', data: null });
    }

    const appointment = await appointmentService.create({
      automobilisteUserId: userId,
      garageId: Number(garageId),
      appointmentDate,
      appointmentTime: appointmentTime || null,
      description,
      notes
    });

    // Génération automatique d'une notification pour le garage
    try {
      const garageResult = await require('../models/garage.model').findGarageIdentityById(Number(garageId));
      if (garageResult && garageResult.user_id) {
        const garageUserId = Number(garageResult.user_id);
        const title = `Nouveau rendez-vous de ${req.user.name || 'automobiliste'}`;
        const body = `${appointmentDate}${appointmentTime ? ` à ${appointmentTime}` : ''} - ${description || 'Consultation'}`;

        await notificationService.createForUser({
          userId: garageUserId,
          actorUserId: userId,
          type: 'appointment',
          referenceId: Number(appointment.id),
          title,
          body,
          metadata: { appointmentId: Number(appointment.id), garageId: Number(garageId) }
        });
      }
    } catch (err) {
      console.error('Failed to create appointment notification:', err && err.message ? err.message : err);
    }

    return res.status(201).json({ success: true, message: 'Rendez-vous créé', data: { appointment } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = req.body;

    const existing = await appointmentService.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'RDV non trouvé', data: null });
    }

    const updated = await appointmentService.update(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'RDV non trouvé', data: null });
    }

    // Notifications on status change (confirmed / cancelled)
    try {
      if (updates.status && updates.status !== existing.status) {
        const newStatus = String(updates.status).toLowerCase();
        if (newStatus === 'confirmed' || newStatus === 'cancelled') {
          const actorUserId = Number(req.user?.id) || null;

          // resolve garage owner user id
          let garageUserId = null;
          try {
            const garageResult = await require('../models/garage.model').findGarageIdentityById(Number(updated.garage_id));
            if (garageResult && garageResult.user_id) garageUserId = Number(garageResult.user_id);
          } catch (err) {
            console.error('Failed to lookup garage owner for notification:', err && err.message ? err.message : err);
          }

          // determine recipient: notify the other party
          let recipientUserId = null;
          if (req.user && (req.user.role === 'garage' || req.user.role === 'admin')) {
            recipientUserId = Number(updated.automobiliste_user_id);
          } else {
            recipientUserId = garageUserId;
          }

          if (recipientUserId) {
            const title = newStatus === 'confirmed'
              ? `Rendez-vous confirmé`
              : `Rendez-vous annulé`;

            const body = `${updated.appointment_date}${updated.appointment_time ? ` à ${updated.appointment_time}` : ''} - ${updated.description || ''}`;

            await notificationService.createForUser({
              userId: recipientUserId,
              actorUserId,
              type: 'appointment',
              referenceId: Number(updated.id),
              title,
              body,
              metadata: { appointmentId: Number(updated.id), garageId: Number(updated.garage_id) }
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to create status-change notification:', err && err.message ? err.message : err);
    }

    return res.json({ success: true, message: 'RDV mis à jour', data: { appointment: updated } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await appointmentService.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'RDV non trouvé', data: null });
    }

    // remove
    await appointmentService.remove(id);

    // notify the other party about cancellation
    try {
      const actorUserId = Number(req.user?.id) || null;

      let garageUserId = null;
      try {
        const garageResult = await require('../models/garage.model').findGarageIdentityById(Number(existing.garage_id));
        if (garageResult && garageResult.user_id) garageUserId = Number(garageResult.user_id);
      } catch (err) {
        console.error('Failed to lookup garage owner for deletion notification:', err && err.message ? err.message : err);
      }

      let recipientUserId = null;
      if (req.user && (req.user.role === 'garage' || req.user.role === 'admin')) {
        recipientUserId = Number(existing.automobiliste_user_id);
      } else {
        recipientUserId = garageUserId;
      }

      if (recipientUserId) {
        const title = `Rendez-vous annulé`;
        const body = `${existing.appointment_date}${existing.appointment_time ? ` à ${existing.appointment_time}` : ''} - ${existing.description || ''}`;

        await notificationService.createForUser({
          userId: recipientUserId,
          actorUserId,
          type: 'appointment',
          referenceId: Number(existing.id),
          title,
          body,
          metadata: { appointmentId: Number(existing.id), garageId: Number(existing.garage_id) }
        });
      }
    } catch (err) {
      console.error('Failed to create deletion notification:', err && err.message ? err.message : err);
    }

    return res.json({ success: true, message: 'RDV supprimé', data: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

module.exports = {
  listAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment
};

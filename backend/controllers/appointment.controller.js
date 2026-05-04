const { pool } = require('../db');
const appointmentService = require('../services/appointmentService');
const notificationService = require('../services/notificationService');
const { findGarageIdentityByUserId, findGarageIdentityById } = require('../models/garage.model');
const { validateAppointmentCreation, validateAppointmentUpdate, APPOINTMENT_CONSTANTS } = require('../utils/appointmentValidator');

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
      const resolvedGarage = await findGarageIdentityByUserId(userId);
      const garageId = Number(req.query.garageId || resolvedGarage?.id);
      if (!garageId) {
        return res.status(400).json({ success: false, message: 'garageId requis pour les utilisateurs garage', data: null });
      }
      items = await appointmentService.listForGarage(garageId, { limit, offset, status });
    } else {
      return res.status(403).json({ success: false, message: 'Accès refusé', data: null });
    }

    return res.json({ success: true, message: 'Rendez-vous', data: { items } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const getAppointment = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Identifiant RDV invalide', data: null });
    }

    const appointment = await appointmentService.getById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'RDV non trouvé', data: null });
    }

    const userId = Number(req.user?.id);
    const role = req.user?.role;

    // Authorization: automobiliste can view own appointments, garage can view appointments belonging to their garage, admin can view all
    if (role === 'automobiliste') {
      if (Number(appointment.automobiliste_user_id) !== userId) {
        return res.status(403).json({ success: false, message: 'Accès refusé', data: null });
      }
    } else if (role === 'garage') {
      // resolve garage id for this user
      const resolvedGarage = await findGarageIdentityByUserId(userId);
      const garageId = Number(req.query.garageId || resolvedGarage?.id);
      if (!garageId || Number(appointment.garage_id) !== garageId) {
        return res.status(403).json({ success: false, message: 'Accès refusé', data: null });
      }
    } else if (role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé', data: null });
    }

    // Enrich appointment with automobiliste and garage basic info
    const automobilisteRow = await pool.query('SELECT id, name, email, phone FROM users WHERE id = $1', [appointment.automobiliste_user_id]);
    const automobiliste = automobilisteRow.rows[0] || null;

    const garageRow = await pool.query('SELECT id, name, adresse, telephone, email FROM garages WHERE id = $1', [appointment.garage_id]);
    const garage = garageRow.rows[0] || null;

    return res.json({ success: true, message: 'RDV recuperé', data: { appointment, automobiliste, garage } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const createAppointment = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { garageId, appointmentDate, appointmentTime, description, notes } = req.body;

    // Authorization check: only automobilistes can create
    if (req.user.role !== 'automobiliste') {
      return res.status(403).json({ success: false, message: 'Seuls les automobilistes peuvent créer des rendez-vous', data: null });
    }

    // Validate appointment data
    const validation = validateAppointmentCreation({
      garageId,
      automobilisteUserId: userId,
      appointmentDate,
      appointmentTime,
      description
    });

    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Données de rendez-vous invalides', 
        data: { errors: validation.errors } 
      });
    }

    const appointment = await appointmentService.create({
      automobilisteUserId: userId,
      garageId: Number(garageId),
      appointmentDate,
      appointmentTime: appointmentTime || null,
      description,
      notes,
      status: APPOINTMENT_CONSTANTS.STATUS_PENDING
    });

    // Generate notification for garage owner
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
    const userId = Number(req.user.id);
    const role = req.user.role;
    const updates = req.body;

    const existing = await appointmentService.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé', data: null });
    }

    const garageIdentity = await findGarageIdentityById(Number(existing.garage_id));

    // Authorization check: verify ownership
    const isAutomobiliste = role === 'automobiliste' && Number(existing.automobiliste_user_id) === userId;
    const isGarageOwner = role === 'garage' && Number(garageIdentity?.user_id) === userId;
    const isAdmin = role === 'admin';
    
    if (!isAutomobiliste && !isGarageOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Vous n\'avez pas les droits de modifier ce rendez-vous', data: null });
    }

    // Validate updates
    const validation = validateAppointmentUpdate(existing, updates);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Données de mise à jour invalides', 
        data: { errors: validation.errors } 
      });
    }

    const updated = await appointmentService.update(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé', data: null });
    }

    // Send notifications on status change
    try {
      if (updates.status && updates.status !== existing.status) {
        const newStatus = String(updates.status).toLowerCase();
        if (newStatus === 'confirmed' || newStatus === 'cancelled' || newStatus === 'proposed') {
          const actorUserId = userId;
          const acceptedProposedDate =
            role === 'automobiliste' &&
            newStatus === 'confirmed' &&
            (existing.status === 'proposed' || existing.proposed_date || existing.proposed_time || updates.proposed_date || updates.proposed_time);
          const refusedProposedDate =
            role === 'automobiliste' &&
            newStatus === 'cancelled' &&
            (existing.status === 'proposed' || existing.proposed_date || existing.proposed_time);

          // Resolve garage owner user id
          let garageUserId = null;
          try {
            const garageResult = await require('../models/garage.model').findGarageIdentityById(Number(updated.garage_id));
            if (garageResult && garageResult.user_id) garageUserId = Number(garageResult.user_id);
          } catch (err) {
            console.error('Failed to lookup garage owner for notification:', err && err.message ? err.message : err);
          }

          // Determine recipient: notify the other party
          let recipientUserId = null;
          if (role === 'garage' || role === 'admin') {
            recipientUserId = Number(updated.automobiliste_user_id);
          } else if (role === 'automobiliste') {
            recipientUserId = garageUserId;
          }

          if (recipientUserId) {
            let title, body;
            
            if (newStatus === 'confirmed' && acceptedProposedDate) {
              title = `✓ Date proposée acceptée`;
              body = `L'automobiliste a accepté la nouvelle date ${updated.proposed_date || updated.appointment_date}${updated.proposed_time ? ` à ${updated.proposed_time}` : updated.appointment_time ? ` à ${updated.appointment_time}` : ''}. Veuillez confirmer ou refuser cette réservation.`;
            } else if (newStatus === 'cancelled' && refusedProposedDate) {
              title = `✕ Date proposée refusée`;
              body = `L'automobiliste a refusé la date proposée ${updated.proposed_date || updated.appointment_date}${updated.proposed_time ? ` à ${updated.proposed_time}` : updated.appointment_time ? ` à ${updated.appointment_time}` : ''}. Merci de proposer une autre date si nécessaire.`;
            } else if (newStatus === 'confirmed') {
              title = `✓ Rendez-vous confirmé`;
              body = `${updated.appointment_date}${updated.appointment_time ? ` à ${updated.appointment_time}` : ''} - ${updated.description || ''}`;
            } else if (newStatus === 'cancelled') {
              title = `✕ Rendez-vous annulé`;
              body = `${updated.appointment_date}${updated.appointment_time ? ` à ${updated.appointment_time}` : ''} - ${updated.description || ''}`;
            } else if (newStatus === 'proposed') {
              title = `📅 Contre-proposition de date`;
              const proposedDate = updates.proposed_date || updated.proposed_date || 'date à déterminer';
              const proposedTime = updates.proposed_time || updated.proposed_time || '';
              body = `Le garage propose: ${proposedDate}${proposedTime ? ` à ${proposedTime}` : ''} ${updates.proposed_note ? `- ${updates.proposed_note}` : ''}`;
            }

            await notificationService.createForUser({
              userId: recipientUserId,
              actorUserId,
              type: 'appointment',
              referenceId: Number(updated.id),
              title,
              body,
              metadata: { 
                appointmentId: Number(updated.id), 
                garageId: Number(updated.garage_id),
                proposalAccepted: acceptedProposedDate,
                proposalRejected: refusedProposedDate,
                proposed_date: updates.proposed_date,
                proposed_time: updates.proposed_time,
                proposed_note: updates.proposed_note
              }
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to create status-change notification:', err && err.message ? err.message : err);
    }

    return res.json({ success: true, message: 'Rendez-vous mis à jour', data: { appointment: updated } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.user.id);
    const role = req.user.role;

    const existing = await appointmentService.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé', data: null });
    }

    const garageIdentity = await findGarageIdentityById(Number(existing.garage_id));

    // Authorization check: verify ownership
    const isAutomobiliste = role === 'automobiliste' && Number(existing.automobiliste_user_id) === userId;
    const isGarageOwner = role === 'garage' && Number(garageIdentity?.user_id) === userId;
    const isAdmin = role === 'admin';
    
    if (!isAutomobiliste && !isGarageOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Vous n\'avez pas les droits de supprimer ce rendez-vous', data: null });
    }

    // Delete appointment
    await appointmentService.remove(id);

    // Notify the other party about deletion
    try {
      const actorUserId = userId;

      let garageUserId = null;
      try {
        const garageResult = await require('../models/garage.model').findGarageIdentityById(Number(existing.garage_id));
        if (garageResult && garageResult.user_id) garageUserId = Number(garageResult.user_id);
      } catch (err) {
        console.error('Failed to lookup garage owner for deletion notification:', err && err.message ? err.message : err);
      }

      let recipientUserId = null;
      if (role === 'garage' || role === 'admin') {
        recipientUserId = Number(existing.automobiliste_user_id);
      } else if (role === 'automobiliste') {
        recipientUserId = garageUserId;
      }

      if (recipientUserId) {
        const title = `✕ Rendez-vous annulé`;
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

    return res.json({ success: true, message: 'Rendez-vous supprimé', data: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Erreur serveur', data: null });
  }
};

module.exports = {
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment
};

/**
 * Appointment Validation Utilities
 * Validates appointment data for business logic constraints
 */

const APPOINTMENT_CONSTANTS = {
  STATUS_PENDING: 'pending',
  STATUS_CONFIRMED: 'confirmed',
  STATUS_CANCELLED: 'cancelled',
  STATUS_PROPOSED: 'proposed',
  VALID_STATUSES: ['pending', 'confirmed', 'cancelled', 'proposed'],
  MIN_ADVANCE_HOURS: 2, // Must book at least 2 hours in advance
  WORKING_HOURS: {
    start: '08:00',
    end: '18:00'
  }
};

/**
 * Validate appointment date is not in the past
 * @param {string} appointmentDate - Date in YYYY-MM-DD format
 * @param {number} minAdvanceHours - Minimum hours in advance (default 2)
 * @returns {object} { valid: boolean, error: string|null }
 */
const validateAppointmentDate = (appointmentDate, minAdvanceHours = APPOINTMENT_CONSTANTS.MIN_ADVANCE_HOURS) => {
  if (!appointmentDate) {
    return { valid: false, error: 'La date du rendez-vous est requise' };
  }

  // Parse date
  const apptDate = new Date(`${appointmentDate}T00:00:00`);
  const now = new Date();
  
  if (isNaN(apptDate.getTime())) {
    return { valid: false, error: 'Format de date invalide (YYYY-MM-DD)' };
  }

  // Check not in past (accounting for timezone)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (apptDate < today) {
    return { valid: false, error: 'La date du rendez-vous ne peut pas être dans le passé' };
  }

  // Check minimum advance booking
  if (apptDate.getTime() - now.getTime() < minAdvanceHours * 60 * 60 * 1000) {
    return { valid: false, error: `Le rendez-vous doit être réservé au moins ${minAdvanceHours} heures à l'avance` };
  }

  return { valid: true, error: null };
};

/**
 * Validate appointment time is within working hours
 * @param {string} appointmentTime - Time in HH:MM format
 * @param {object} workingHours - { start: 'HH:MM', end: 'HH:MM' }
 * @returns {object} { valid: boolean, error: string|null }
 */
const validateAppointmentTime = (appointmentTime, workingHours = APPOINTMENT_CONSTANTS.WORKING_HOURS) => {
  if (!appointmentTime) {
    return { valid: true, error: null }; // Time is optional
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(appointmentTime)) {
    return { valid: false, error: 'Format d\'heure invalide (HH:MM)' };
  }

  const [apptHour, apptMin] = appointmentTime.split(':').map(Number);
  const [startHour, startMin] = workingHours.start.split(':').map(Number);
  const [endHour, endMin] = workingHours.end.split(':').map(Number);

  const apptTime = apptHour * 60 + apptMin;
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (apptTime < startTime || apptTime > endTime) {
    return { 
      valid: false, 
      error: `L'heure du rendez-vous doit être entre ${workingHours.start} et ${workingHours.end}` 
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate appointment description
 * @param {string} description - Description text
 * @returns {object} { valid: boolean, error: string|null }
 */
const validateDescription = (description) => {
  if (!description || !String(description).trim()) {
    return { valid: false, error: 'La description du service est requise' };
  }

  const desc = String(description).trim();
  if (desc.length < 5) {
    return { valid: false, error: 'La description doit contenir au moins 5 caractères' };
  }

  if (desc.length > 500) {
    return { valid: false, error: 'La description ne doit pas dépasser 500 caractères' };
  }

  return { valid: true, error: null };
};

/**
 * Validate appointment status
 * @param {string} status - Status value
 * @returns {object} { valid: boolean, error: string|null }
 */
const validateStatus = (status) => {
  if (!status) {
    return { valid: false, error: 'Le statut est requis' };
  }

  if (!APPOINTMENT_CONSTANTS.VALID_STATUSES.includes(String(status).toLowerCase())) {
    return { 
      valid: false, 
      error: `Statut invalide. Valeurs acceptées: ${APPOINTMENT_CONSTANTS.VALID_STATUSES.join(', ')}` 
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate appointment creation payload
 * @param {object} payload - Appointment data
 * @returns {object} { valid: boolean, errors: object }
 */
const validateAppointmentCreation = (payload) => {
  const errors = {};

  // Required fields
  if (!payload.garageId) errors.garageId = 'Le garage est requis';
  if (!payload.automobilisteUserId) errors.automobilisteUserId = 'L\'utilisateur automobiliste est requis';

  // Date validation
  const dateValidation = validateAppointmentDate(payload.appointmentDate);
  if (!dateValidation.valid) errors.appointmentDate = dateValidation.error;

  // Time validation (optional)
  if (payload.appointmentTime) {
    const timeValidation = validateAppointmentTime(payload.appointmentTime);
    if (!timeValidation.valid) errors.appointmentTime = timeValidation.error;
  }

  // Description validation
  const descValidation = validateDescription(payload.description);
  if (!descValidation.valid) errors.description = descValidation.error;

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate appointment status update
 * @param {object} currentAppointment - Current appointment record
 * @param {object} updates - Update payload
 * @returns {object} { valid: boolean, errors: object }
 */
const validateAppointmentUpdate = (currentAppointment, updates) => {
  const errors = {};

  // Validate status if being updated
  if (updates.status) {
    const statusValidation = validateStatus(updates.status);
    if (!statusValidation.valid) {
      errors.status = statusValidation.error;
    }

    // Validate status transitions
    const currentStatus = String(currentAppointment.status || '').toLowerCase();
    const newStatus = String(updates.status).toLowerCase();

    // Can't transition from confirmed/cancelled to anything
    if (['confirmed', 'cancelled'].includes(currentStatus) && newStatus !== currentStatus) {
      errors.status = `Un rendez-vous ${currentStatus} ne peut pas être modifié`;
    }
  }

  // Validate date if being updated
  if (updates.appointmentDate) {
    const dateValidation = validateAppointmentDate(updates.appointmentDate);
    if (!dateValidation.valid) errors.appointmentDate = dateValidation.error;
  }

  // Validate time if being updated
  if (updates.appointmentTime) {
    const timeValidation = validateAppointmentTime(updates.appointmentTime);
    if (!timeValidation.valid) errors.appointmentTime = timeValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  APPOINTMENT_CONSTANTS,
  validateAppointmentDate,
  validateAppointmentTime,
  validateDescription,
  validateStatus,
  validateAppointmentCreation,
  validateAppointmentUpdate
};



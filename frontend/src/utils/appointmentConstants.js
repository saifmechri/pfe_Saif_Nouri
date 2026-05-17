/**
 * Appointment Constants and Messages
 */

import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/fr';

dayjs.extend(localizedFormat);
dayjs.locale('fr');

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled'
};

export const APPOINTMENT_STATUS_LABELS = {
  [APPOINTMENT_STATUS.PENDING]: 'En attente',
  [APPOINTMENT_STATUS.CONFIRMED]: 'Confirmé',
  [APPOINTMENT_STATUS.CANCELLED]: 'Annulé'
};

export const APPOINTMENT_STATUS_COLORS = {
  [APPOINTMENT_STATUS.PENDING]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  [APPOINTMENT_STATUS.CONFIRMED]: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  [APPOINTMENT_STATUS.CANCELLED]: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
};

export const APPOINTMENT_MESSAGES = {
  CREATED_SUCCESS: 'Rendez-vous créé avec succès',
  UPDATED_SUCCESS: 'Rendez-vous mis à jour',
  DELETED_SUCCESS: 'Rendez-vous supprimé',
  CONFIRMED_SUCCESS: 'Rendez-vous confirmé',
  CANCELLED_SUCCESS: 'Rendez-vous annulé',
  ERROR_INVALID_DATE: 'La date du rendez-vous est invalide',
  ERROR_INVALID_TIME: 'L\'heure du rendez-vous est invalide',
  ERROR_REQUIRED_FIELDS: 'Veuillez remplir tous les champs obligatoires',
  ERROR_FETCH: 'Erreur lors du chargement des rendez-vous',
  ERROR_CREATE: 'Erreur lors de la création du rendez-vous'
};

export const WORKING_HOURS = {
  START: '08:00',
  END: '18:00'
};

export const MIN_ADVANCE_HOURS = 2;

/**
 * Format appointment date for display
 */
export const formatAppointmentDate = (dateStr) => {
  if (!dateStr) return 'Date non définie';

  const parsed = dayjs(dateStr);
  if (!parsed.isValid()) return 'Date non définie';

  return parsed.format('dddd D MMMM YYYY');
};

/**
 * Format appointment time for display
 */
export const formatAppointmentTime = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  return `${hours}:${minutes}`;
};

/**
 * Get minimum date for date picker (today + MIN_ADVANCE_HOURS)
 */
export const getMinAppointmentDate = () => {
  const date = new Date();
  date.setHours(date.getHours() + MIN_ADVANCE_HOURS);
  return date.toISOString().split('T')[0];
};

/**
 * Check if date is valid and not in past
 */
export const isDateValid = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

/**
 * Check if time is within working hours
 */
export const isTimeValid = (timeStr) => {
  if (!timeStr) return true; // Time is optional
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!regex.test(timeStr)) return false;

  const [hours, minutes] = timeStr.split(':').map(Number);
  const [startHours, startMinutes] = WORKING_HOURS.START.split(':').map(Number);
  const [endHours, endMinutes] = WORKING_HOURS.END.split(':').map(Number);

  const time = hours * 60 + minutes;
  const startTime = startHours * 60 + startMinutes;
  const endTime = endHours * 60 + endMinutes;

  return time >= startTime && time <= endTime;
};

/**
 * Parse notes JSON safely
 */
export const parseAppointmentNotes = (notes) => {
  if (!notes) return { vehicleId: null, services: [], remark: '', messages: [] };
  try {
    const parsed = typeof notes === 'string' ? JSON.parse(notes) : notes;
    return {
      vehicleId: parsed.vehicleId || null,
      services: Array.isArray(parsed.services) ? parsed.services : [],
      remark: parsed.remark || '',
      messages: Array.isArray(parsed.messages) ? parsed.messages : []
    };
  } catch {
    return { vehicleId: null, services: [], remark: '', messages: [] };
  }
};

/**
 * Get status badge icon
 */
export const getStatusIcon = (status) => {
  switch (status) {
    case APPOINTMENT_STATUS.CONFIRMED:
      return '✅';
    case APPOINTMENT_STATUS.CANCELLED:
      return '❌';
    default:
      return 'â±';
  }
};



/**
 * 🔍 DATA VALIDATION & CLEANING UTILITIES
 * Ensures data integrity for recommendation engine
 */

const MAX_REALISTIC_MILEAGE = 1000000; // 1 million km max
const MAX_ANNUAL_MILEAGE = 50000; // ~137 km/day is normal
const MILEAGE_JUMP_THRESHOLD = 200000; // Flag suspicious jumps

/**
 * ✅ Validate if a mileage value is realistic and safe
 * @param {number} mileage - The mileage to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
function validateMileage(mileage) {
  // Must be a finite number
  if (mileage === null || mileage === undefined || mileage === '') {
    return { isValid: false, error: 'Kilométrage manquant' };
  }

  const km = Number(mileage);
  
  if (!Number.isFinite(km)) {
    return { isValid: false, error: 'Kilométrage doit être un nombre valide' };
  }

  // Cannot be negative
  if (km < 0) {
    return { isValid: false, error: 'Kilométrage ne peut pas être négatif' };
  }

  // Cannot exceed realistic maximum
  if (km > MAX_REALISTIC_MILEAGE) {
    return { isValid: false, error: `Kilométrage ne peut pas dépasser ${MAX_REALISTIC_MILEAGE} km` };
  }

  return { isValid: true };
}

/**
 * ✅ Validate if a date is realistic (not in the future)
 * @param {string|Date} date - The date to validate
 * @param {boolean} allowFuture - Allow future dates (for testing)
 * @returns {Object} { isValid: boolean, error?: string }
 */
function validateInterventionDate(date, allowFuture = false) {
  if (!date) {
    return { isValid: true }; // Date is optional, defaults to today
  }

  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Date invalide' };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const checkDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

  if (!allowFuture && checkDate > today) {
    return { isValid: false, error: 'La date ne peut pas être dans le futur' };
  }

  return { isValid: true };
}

/**
 * ✅ Validate if a mileage progression is logical
 * @param {number} lastMileage - Previous recorded mileage
 * @param {number} newMileage - New mileage to record
 * @returns {Object} { isValid: boolean, warning?: string }
 */
function validateMileageProgression(lastMileage, newMileage) {
  if (!Number.isFinite(lastMileage) || !Number.isFinite(newMileage)) {
    return { isValid: true }; // Can't validate if one is missing
  }

  // Mileage should never decrease
  if (newMileage < lastMileage) {
    return { 
      isValid: false, 
      error: `Kilométrage ne peut pas diminuer (${lastMileage} km → ${newMileage} km)` 
    };
  }

  // Flag suspicious jumps but don't reject
  const jump = newMileage - lastMileage;
  if (jump > MILEAGE_JUMP_THRESHOLD) {
    return { 
      isValid: true, 
      warning: `Saut important détecté: +${jump} km depuis la dernière intervention` 
    };
  }

  return { isValid: true };
}

/**
 * ✅ Clean and validate intervention history for a vehicle
 * @param {Array} interventions - Raw interventions from database
 * @returns {Array} Cleaned, sorted, deduplicated interventions
 */
function cleanInterventionHistory(interventions) {
  if (!Array.isArray(interventions) || interventions.length === 0) {
    return [];
  }

  // Step 1: Filter out invalid records (missing critical fields)
  const validRecords = interventions.filter(intervention => {
    const { isValid } = validateMileage(intervention.kilometrage);
    const dateValid = validateInterventionDate(intervention.date_intervention);
    
    return isValid && dateValid.isValid;
  });

  // Step 2: Sort by date ascending (oldest first)
  const sorted = validRecords.sort((a, b) => {
    const dateA = new Date(a.date_intervention || a.created_at);
    const dateB = new Date(b.date_intervention || b.created_at);
    return dateA - dateB;
  });

  // Step 3: Deduplicate (same type + same date = keep most recent by ID)
  const deduped = [];
  const seen = new Map();

  for (const intervention of sorted) {
    const key = `${intervention.type}|${intervention.date_intervention || intervention.created_at}`;
    
    if (seen.has(key)) {
      const existing = seen.get(key);
      // Keep the one with higher ID (more recent insert)
      if (intervention.id > existing.id) {
        const index = deduped.findIndex(i => i.id === existing.id);
        if (index !== -1) {
          deduped[index] = intervention;
          seen.set(key, intervention);
        }
      }
    } else {
      deduped.push(intervention);
      seen.set(key, intervention);
    }
  }

  // Step 4: Validate mileage progression (log warnings but keep records)
  for (let i = 1; i < deduped.length; i++) {
    const prev = deduped[i - 1];
    const curr = deduped[i];
    const { warning } = validateMileageProgression(prev.kilometrage, curr.kilometrage);
    if (warning) {
      console.warn(`[DataClean] ${warning} for intervention ${curr.id}`);
    }
  }

  return deduped;
}

/**
 * ✅ Get the latest valid intervention by type
 * @param {Array} cleanedInterventions - Already cleaned intervention array
 * @param {string} type - Intervention type to search for
 * @returns {Object|null} Latest intervention of that type, or null
 */
function getLatestByType(cleanedInterventions, type) {
  if (!Array.isArray(cleanedInterventions)) return null;
  
  const matching = cleanedInterventions
    .filter(i => i.type === type)
    .sort((a, b) => {
      const dateA = new Date(a.date_intervention || a.created_at);
      const dateB = new Date(b.date_intervention || b.created_at);
      return dateB - dateA; // Newest first
    });

  return matching[0] || null;
}

/**
 * ✅ Calculate vehicle's effective current mileage
 * @param {Object} vehicle - Vehicle object
 * @param {Array} cleanedInterventions - Cleaned intervention history
 * @returns {number|null} Effective current mileage, or null if unreliable
 */
function getEffectiveVehicleMileage(vehicle, cleanedInterventions) {
  const candidates = [];

  // Prefer the vehicle's stored mileage as source of truth
  if (vehicle && Number.isFinite(vehicle.kilometrage_voiture) && vehicle.kilometrage_voiture > 0) {
    candidates.push({
      value: vehicle.kilometrage_voiture,
      source: 'vehicle_stored',
      priority: 1
    });
  }

  // Fallback: latest intervention mileage (lower priority)
  if (Array.isArray(cleanedInterventions) && cleanedInterventions.length > 0) {
    const latest = cleanedInterventions[cleanedInterventions.length - 1];
    if (Number.isFinite(latest.kilometrage) && latest.kilometrage > 0) {
      candidates.push({
        value: latest.kilometrage,
        source: 'latest_intervention',
        priority: 2
      });
    }
  }

  // No valid mileage found
  if (candidates.length === 0) {
    return null;
  }

  // Sort by priority and return the best candidate
  candidates.sort((a, b) => a.priority - b.priority);
  const chosen = candidates[0];

  // DEBUG: log chosen mileage source for transparency
  try {
    console.log(`[DataValidation] Chosen mileage for vehicle=${vehicle?.id ?? 'unknown'} -> ${chosen.value} km (source=${chosen.source})`);
  } catch (err) {
    // no-op
  }

  // Validate it's not an impossible value
  const { isValid } = validateMileage(chosen.value);
  if (!isValid) {
    console.warn(`[DataValidation] Invalid mileage rejected: ${chosen.value} km from ${chosen.source}`);
    return null;
  }

  return chosen.value;
}

/**
 * ✅ Build intervention history summary for logging
 * @param {Array} cleanedInterventions - Cleaned intervention array
 * @returns {Object} Summary with counts, date range, mileage range
 */
function summarizeHistory(cleanedInterventions) {
  if (!Array.isArray(cleanedInterventions) || cleanedInterventions.length === 0) {
    return {
      count: 0,
      status: 'empty',
      detail: 'Aucun historique d\'intervention valide'
    };
  }

  const sorted = cleanedInterventions.sort((a, b) => {
    const dateA = new Date(a.date_intervention || a.created_at);
    const dateB = new Date(b.date_intervention || b.created_at);
    return dateB - dateA;
  });

  const oldest = sorted[sorted.length - 1];
  const newest = sorted[0];
  const oldestDate = new Date(oldest.date_intervention || oldest.created_at);
  const newestDate = new Date(newest.date_intervention || newest.created_at);

  const kmMin = Math.min(...cleanedInterventions.map(i => i.kilometrage || Infinity));
  const kmMax = Math.max(...cleanedInterventions.map(i => i.kilometrage || 0));

  const types = {};
  for (const intervention of cleanedInterventions) {
    types[intervention.type] = (types[intervention.type] || 0) + 1;
  }

  return {
    count: cleanedInterventions.length,
    status: 'valid',
    detail: `${cleanedInterventions.length} interventions du ${oldestDate.toLocaleDateString('fr-FR')} au ${newestDate.toLocaleDateString('fr-FR')}`,
    dateRange: {
      from: oldestDate,
      to: newestDate,
      spanDays: Math.floor((newestDate - oldestDate) / (1000 * 60 * 60 * 24))
    },
    mileageRange: {
      min: kmMin === Infinity ? null : kmMin,
      max: kmMax
    },
    typeBreakdown: types
  };
}

module.exports = {
  validateMileage,
  validateInterventionDate,
  validateMileageProgression,
  cleanInterventionHistory,
  getLatestByType,
  getEffectiveVehicleMileage,
  summarizeHistory,
  MAX_REALISTIC_MILEAGE,
  MAX_ANNUAL_MILEAGE,
  MILEAGE_JUMP_THRESHOLD
};

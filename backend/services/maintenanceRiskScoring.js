/**
 * 🚗 MAINTENANCE RISK SCORING SERVICE
 * Implements intelligent multi-factor scoring for vehicle maintenance decisions
 * Replaces simple mileage-based rules with weighted scoring model
 */

// Define maintenance type categories and their criticality
const MAINTENANCE_TYPES = {
  // Light maintenance (low criticality)
  vidange: { category: 'light', weight: 1.0, maxIntervalDays: 365, maxIntervalKm: 10000 },
  nettoyage: { category: 'light', weight: 0.8, maxIntervalDays: 365, maxIntervalKm: 15000 },
  
  // Medium maintenance (medium criticality)
  revision: { category: 'medium', weight: 1.5, maxIntervalDays: 730, maxIntervalKm: 20000 },
  plaquettes: { category: 'medium', weight: 1.3, maxIntervalDays: 730, maxIntervalKm: 50000 },
  filtre: { category: 'medium', weight: 1.1, maxIntervalDays: 365, maxIntervalKm: 15000 },
  batterie: { category: 'medium', weight: 1.2, maxIntervalDays: 730, maxIntervalKm: 50000 },
  reparation: { category: 'medium', weight: 1.4, maxIntervalDays: 1095, maxIntervalKm: 60000 },
  
  // Critical maintenance (high criticality)
  distribution: { category: 'critical', weight: 2.5, maxIntervalDays: 1825, maxIntervalKm: 100000 },
  frein: { category: 'critical', weight: 2.3, maxIntervalDays: 1095, maxIntervalKm: 100000 },
  suspension: { category: 'critical', weight: 2.0, maxIntervalDays: 1460, maxIntervalKm: 80000 },
  transmission: { category: 'critical', weight: 2.4, maxIntervalDays: 1825, maxIntervalKm: 100000 },
  moteur: { category: 'critical', weight: 2.5, maxIntervalDays: 2190, maxIntervalKm: 150000 },
};

// Define critical parts that should escalate risk if missing
const CRITICAL_PARTS = ['courroie distribution', 'plaquettes frein', 'amortisseurs', 'batterie', 'turbo'];
const { evaluateMaintenanceDecision } = require('./riskRules');

/**
 * ✅ STEP 1: Normalize maintenance history structure
 * Ensures consistent format with required fields
 */
function normalizeMaintenanceHistory(interventions) {
  if (!Array.isArray(interventions)) return [];

  return interventions
    .filter(intervention => {
      // Must have date and mileage; accept string values coming from PostgreSQL
      const mileage = Number(intervention?.kilometrage);
      return intervention &&
             (intervention.date_intervention || intervention.created_at) &&
             Number.isFinite(mileage);
    })
    .map(intervention => ({
      id: intervention.id,
      date: new Date(intervention.date_intervention || intervention.created_at),
      mileage: Number(intervention.kilometrage),
      type: (intervention.type || '').toLowerCase().trim(),
      garage: {
        name: intervention.garage_name || 'Unknown',
        location: intervention.garage_location || null
      },
      cost: Number(intervention.cost) || null,
      parts: Array.isArray(intervention.parts) ? intervention.parts : []
    }))
    .sort((a, b) => a.date - b.date); // Sort by date ascending
}

/**
 * ✅ STEP 2: Analyze maintenance intervals
 * Calculates consistency and adherence to recommended intervals
 */
function analyzeMaintenanceIntervals(normalizedHistory) {
  const analysis = {
    totalInterventions: normalizedHistory.length,
    interventionsByType: {},
    intervals: [],
    consistency: 0, // 0-100: how regular is maintenance?
    regularity: 0, // 0-100: adherence to recommendations
    hasGaps: false,
    warnings: []
  };

  if (normalizedHistory.length < 2) {
    analysis.consistency = 50; // Neutral if no history
    analysis.regularity = 50;
    return analysis;
  }

  // Group by type and find gaps
  const byType = {};
  for (const intervention of normalizedHistory) {
    if (!byType[intervention.type]) {
      byType[intervention.type] = [];
    }
    byType[intervention.type].push(intervention);
  }

  analysis.interventionsByType = Object.entries(byType).reduce((acc, [type, intv]) => {
    acc[type] = intv.length;
    return acc;
  }, {});

  // Calculate intervals for same-type interventions
  for (const type in byType) {
    const interventions = byType[type];
    if (interventions.length >= 2) {
      for (let i = 1; i < interventions.length; i++) {
        const prev = interventions[i - 1];
        const curr = interventions[i];
        
        const daysDiff = Math.floor((curr.date - prev.date) / (1000 * 60 * 60 * 24));
        const kmDiff = curr.mileage - prev.mileage;
        
        analysis.intervals.push({
          type,
          daysDiff,
          kmDiff,
          avgKmPerDay: daysDiff > 0 ? kmDiff / daysDiff : 0
        });
      }
    }
  }

  // Calculate consistency: std deviation of intervals
  if (analysis.intervals.length > 0) {
    const avgDays = analysis.intervals.reduce((sum, i) => sum + i.daysDiff, 0) / analysis.intervals.length;
    const variance = analysis.intervals.reduce((sum, i) => sum + Math.pow(i.daysDiff - avgDays, 2), 0) / analysis.intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to 0-100 score (lower std dev = higher consistency)
    analysis.consistency = Math.max(0, Math.min(100, 100 - (stdDev / 30)));
  }

  // Calculate regularity: how often maintenance is done vs recommended
  let regularityScores = [];
  for (const type in byType) {
    const interventions = byType[type];
    if (interventions.length >= 1) {
      const typeConfig = MAINTENANCE_TYPES[type] || { maxIntervalDays: 730, maxIntervalKm: 50000 };
      
      for (let i = 1; i < interventions.length; i++) {
        const prev = interventions[i - 1];
        const curr = interventions[i];
        const daysDiff = Math.floor((curr.date - prev.date) / (1000 * 60 * 60 * 24));
        const kmDiff = curr.mileage - prev.mileage;
        
        // Score based on adherence to max interval
        let dayScore = Math.min(100, (daysDiff / typeConfig.maxIntervalDays) * 100);
        let kmScore = Math.min(100, (kmDiff / typeConfig.maxIntervalKm) * 100);
        
        // Average of both
        regularityScores.push((dayScore + kmScore) / 2);
      }
    }
  }

  if (regularityScores.length > 0) {
    analysis.regularity = regularityScores.reduce((a, b) => a + b, 0) / regularityScores.length;
  }

  return analysis;
}

/**
 * ✅ STEP 3: Calculate mileage-based score component
 * Considers current mileage vs recommended intervals
 */
function calculateMileageScore(currentKm, normalizedHistory, maintenanceAnalysis) {
  let score = 0;
  let factors = [];

  if (!Array.isArray(normalizedHistory) || normalizedHistory.length === 0) {
    // No history: neutral score
    return { score: 50, factors: ['Pas d\'historique disponible'] };
  }

  const lastIntervention = normalizedHistory[normalizedHistory.length - 1];
  const kmSinceLastIntervention = currentKm - lastIntervention.mileage;

  // Calculate average km/day
  if (normalizedHistory.length >= 2) {
    const firstIntervention = normalizedHistory[0];
    const totalDays = (lastIntervention.date - firstIntervention.date) / (1000 * 60 * 60 * 24);
    const totalKm = lastIntervention.mileage - firstIntervention.mileage;
    const avgKmPerDay = totalDays > 0 ? totalKm / totalDays : 100;

    // Estimate days since last intervention
    const estimatedDaysSinceLastIntervention = avgKmPerDay > 0 ? kmSinceLastIntervention / avgKmPerDay : 0;

    // Based on average usage, estimate percentage of typical interval consumed
    if (estimatedDaysSinceLastIntervention > 180) {
      score = Math.min(50, (estimatedDaysSinceLastIntervention / 365) * 100);
      factors.push(`${Math.round(estimatedDaysSinceLastIntervention)} jours depuis dernière révision`);
    }
  }

  // Direct km-based scoring
  const kmPercentOfTypicalInterval = (kmSinceLastIntervention / 15000) * 100;
  if (kmPercentOfTypicalInterval > 80) {
    score = Math.max(score, Math.min(50, (kmPercentOfTypicalInterval / 100) * 100));
    factors.push(`${Math.round(kmSinceLastIntervention)} km parcourus depuis dernière maintenance`);
  }

  return { score, factors };
}

/**
 * ✅ STEP 4: Calculate recency-based score component
 * Penalizes aged maintenance records
 */
function calculateRecencyScore(normalizedHistory) {
  let score = 0;
  let factors = [];

  if (!Array.isArray(normalizedHistory) || normalizedHistory.length === 0) {
    return { score: 40, factors: ['Aucun historique de maintenance'] };
  }

  const lastIntervention = normalizedHistory[normalizedHistory.length - 1];
  const daysSinceLastIntervention = (Date.now() - lastIntervention.date.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLastIntervention > 730) {
    score = Math.min(40, (daysSinceLastIntervention / 365) * 20);
    factors.push(`Dernière maintenance il y a ${Math.round(daysSinceLastIntervention)} jours`);
  } else if (daysSinceLastIntervention > 365) {
    score = Math.min(30, (daysSinceLastIntervention / 730) * 20);
    factors.push(`Maintenance annuelle dépassée: ${Math.round(daysSinceLastIntervention)} jours`);
  } else {
    score = Math.max(0, 10 - (daysSinceLastIntervention / 365) * 10);
  }

  return { score, factors };
}

/**
 * ✅ STEP 5: Calculate maintenance type importance score
 * Critical services are weighted higher
 */
function calculateMaintenanceTypeScore(normalizedHistory, maintenanceAnalysis) {
  let score = 0;
  let factors = [];

  // Check for critical maintenance types
  for (const type in maintenanceAnalysis.interventionsByType) {
    const typeConfig = MAINTENANCE_TYPES[type];
    if (!typeConfig) continue;

    if (typeConfig.category === 'critical') {
      const lastOfType = normalizedHistory
        .reverse()
        .find(i => i.type === type);
      
      if (!lastOfType) {
        score += 25; // Critical type never done
        factors.push(`${type.toUpperCase()}: jamais effectué (critique)`);
      } else {
        const daysSinceLastOfType = (Date.now() - lastOfType.date.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastOfType > typeConfig.maxIntervalDays) {
          score += 20;
          factors.push(`${type}: dépassé depuis ${Math.round(daysSinceLastOfType - typeConfig.maxIntervalDays)} jours`);
        }
      }
    }
  }

  // Check for critical parts mentioned
  for (const intervention of normalizedHistory) {
    for (const part of intervention.parts) {
      for (const criticalPart of CRITICAL_PARTS) {
        if (part.toLowerCase().includes(criticalPart)) {
          score = Math.min(score, -5); // Negative points (good) for critical maintenance
          factors.push(`Pièce critique remplacée: ${part}`);
        }
      }
    }
  }

  return { score: Math.max(0, score), factors };
}

/**
 * ✅ STEP 6: Calculate comprehensive maintenance risk score (0-100)
 * Weighted combination of all factors
 * Thresholds:
 *   0-40: LOW risk
 *   41-70: MEDIUM risk
 *   71-100: HIGH risk
 */
function calculateMaintenanceRiskScore(currentKm, vehicle, normalizedHistory) {
  const analysis = analyzeMaintenanceIntervals(normalizedHistory);
  const decision = evaluateMaintenanceDecision({
    currentKm,
    normalizedHistory,
    vehicle
  });

  const criticalCount = normalizedHistory.filter(isCriticalEntry).length;
  const lastIntervention = normalizedHistory[normalizedHistory.length - 1] || null;
  const kmSinceLastMaintenance = decision.context.mileageSinceLastMaintenance;
  const daysSinceLastIntervention = decision.context.daysSinceLastIntervention;

  return {
    score: decision.score,
    riskLevel: decision.risk,
    scoreBreakdown: null,
    factors: decision.matchedRules,
    analysis: {
      totalInterventions: analysis.totalInterventions,
      consistency: Math.round(analysis.consistency * 100) / 100,
      regularity: Math.round(analysis.regularity * 100) / 100,
      interventionsByType: analysis.interventionsByType,
      mileageSinceLastMaintenance: kmSinceLastMaintenance,
      daysSinceLastIntervention,
      criticalMaintenanceFound: decision.context.criticalMaintenanceFound,
      criticalMaintenanceCount: criticalCount,
      lastInterventionDate: lastIntervention?.date || null,
      historyIsRegular: decision.context.historyIsRegular,
      historyIsIrregular: decision.context.historyIsIrregular,
      interventionCount: decision.context.interventionCount,
      regularityByType: analysis.interventionsByType
    },
    explanation: {
      summary: decision.explanation,
      score: decision.score,
      riskLevel: decision.risk,
      mainFactors: decision.matchedRules.length > 0 ? decision.matchedRules : decision.explanationDetails,
      recommendation: decision.recommendation
    },
    decision
  };
}

/**
 * ✅ STEP 7: Generate human-readable explanation
 */
function generateExplanation(score, riskLevel, factors) {
  const summaries = {
    LOW: 'Votre véhicule est en bon état d\'entretien. Continuez à suivre le programme de maintenance recommandé.',
    MEDIUM: 'Votre véhicule nécessite une révision prochainement. Planifiez une intervention dans les prochaines semaines.',
    HIGH: 'Votre véhicule présente des besoins de maintenance urgents. Prenez rendez-vous rapidement chez un garage.'
  };

  return {
    summary: summaries[riskLevel],
    score: score,
    riskLevel: riskLevel,
    mainFactors: factors.slice(0, 3), // Top 3 factors
    recommendation: riskLevel === 'HIGH' ? 
      'Visite urgente recommandée' : 
      (riskLevel === 'MEDIUM' ? 'À prévoir dans les prochaines semaines' : 'Suivi régulier')
  };
}

/**
 * ✅ PUBLIC API: Main function to compute maintenance risk
 */
function computeMaintenanceRisk(currentKm, vehicle, rawInterventions) {
  try {
    // Normalize history
    const normalizedHistory = normalizeMaintenanceHistory(rawInterventions);
    console.log(`[RuleEngine][Input] currentKm=${Number(currentKm) || 0}, rawInterventions=${Array.isArray(rawInterventions) ? rawInterventions.length : 0}, normalizedInterventions=${normalizedHistory.length}`);

    const decision = evaluateMaintenanceDecision({
      currentKm,
      normalizedHistory,
      vehicle
    });

    const riskScore = {
      score: decision.score,
      riskLevel: decision.risk,
      scoreBreakdown: null,
      factors: decision.matchedRules,
      analysis: {
        totalInterventions: normalizedHistory.length,
        mileageSinceLastMaintenance: decision.context.mileageSinceLastMaintenance,
        daysSinceLastIntervention: decision.context.daysSinceLastIntervention,
        criticalMaintenanceFound: decision.context.criticalMaintenanceFound,
        historyIsRegular: decision.context.historyIsRegular,
        historyIsIrregular: decision.context.historyIsIrregular,
        interventionCount: decision.context.interventionCount
      },
      explanation: {
        summary: decision.explanation,
        score: decision.score,
        riskLevel: decision.risk,
        mainFactors: decision.matchedRules,
        recommendation: decision.recommendation
      },
      decision
    };

    console.log(`[RuleEngine][Score] ${JSON.stringify({ score: riskScore.score, riskLevel: riskScore.riskLevel })}`);
    console.log(`[RuleEngine][Decision] ${JSON.stringify(riskScore.decision)}`);
    
    return {
      success: true,
      data: riskScore,
      normalizedInterventions: normalizedHistory.length
    };
  } catch (error) {
    const fallbackDecision = evaluateMaintenanceDecision({
      currentKm,
      normalizedHistory: normalizeMaintenanceHistory(rawInterventions),
      vehicle
    });
    return {
      success: false,
      error: error.message,
      data: {
        score: fallbackDecision.score,
        riskLevel: fallbackDecision.risk,
        explanation: fallbackDecision.explanation,
        factors: ['Erreur lors du traitement'],
        decision: fallbackDecision
      }
    };
  }
}

function buildUnifiedDecision(riskData = {}) {
  if (riskData && riskData.decision && riskData.decision.risk) {
    return riskData.decision;
  }

  const currentKm = Number(riskData.currentKm ?? riskData.vehicle?.kilometrage ?? 0) || 0;
  const normalizedHistory = Array.isArray(riskData.normalizedHistory) ? riskData.normalizedHistory : [];
  const vehicle = riskData.vehicle || null;
  return evaluateMaintenanceDecision({ currentKm, normalizedHistory, vehicle });
}

module.exports = {
  normalizeMaintenanceHistory,
  analyzeMaintenanceIntervals,
  calculateMaintenanceRiskScore,
  generateExplanation,
  buildUnifiedDecision,
  computeMaintenanceRisk,
  MAINTENANCE_TYPES,
  CRITICAL_PARTS
};

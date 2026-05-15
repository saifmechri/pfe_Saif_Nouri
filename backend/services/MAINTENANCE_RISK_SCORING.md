# 🚗 Maintenance Risk Scoring System

## Overview

The maintenance risk scoring system is a comprehensive, multi-factor approach to vehicle maintenance decision-making. It replaces the simple mileage-based rule ("150,000 km = HIGH risk") with an intelligent weighted scoring model that considers:

- **Mileage progression** (35% weight)
- **Recency of last maintenance** (30% weight)
- **Maintenance type and criticality** (20% weight)
- **Regularity of maintenance** (15% weight)

## Risk Levels & Thresholds

```
Score 0-40   → LOW RISK ✅
Score 41-70  → MEDIUM RISK ⚠️
Score 71-100 → HIGH RISK 🔴
```

## Scoring Components

### 1. Mileage Score (35% weight)
Evaluates distance traveled since last service:
- Estimates average km/day from historical data
- Compares current mileage against typical maintenance intervals
- Scales 0-50 based on urgency

**Factors:**
- Days elapsed since last maintenance
- Kilometers since last maintenance
- Estimated daily usage

### 2. Recency Score (30% weight)
Penalizes aged maintenance records:
- **0-30 days:** Excellent (0 points)
- **30-180 days:** Good (5-15 points)
- **180-365 days:** Moderate (15-30 points)
- **365+ days:** Poor/urgent (30-40+ points)

**Factors:**
- Days since last intervention
- Annual maintenance cycle compliance

### 3. Maintenance Type Score (20% weight)
Checks if critical services are overdue:

**Light Maintenance** (weight 1.0):
- Vidange, nettoyage
- Max interval: 365 days / 15,000 km

**Medium Maintenance** (weight 1.5):
- Révision, plaquettes, filtres, batterie
- Max interval: 730 days / 50,000 km

**Critical Maintenance** (weight 2.3-2.5):
- Distribution, frein, suspension, transmission, moteur
- Max interval: 1,460-2,190 days / 80,000-150,000 km

**Points added if:**
- Critical type was never performed (+25)
- Critical type is overdue (+20)
- Critical parts were recently replaced (-5)

### 4. Regularity Score (15% weight)
Measures maintenance consistency:
- **High consistency:** Same intervals between services (85-100)
- **Moderate:** Inconsistent but compliant (50-85)
- **Low:** Irregular or skipped intervals (0-50)

Calculated as `1 - normalized_std_deviation`

## Data Normalization

All interventions are normalized to a consistent structure:
```javascript
{
  id: number,
  date: Date,
  mileage: number,
  type: string,
  garage: { name, location },
  cost: number,
  parts: string[]
}
```

**Validation Rules:**
- Mileage must be finite and ≤ 1,000,000 km
- Date must not be in the future
- Mileage must not decrease between records
- Suspicious jumps (>200,000 km) trigger warnings

## Output Structure

```javascript
{
  score: 0-100,                    // Final risk score
  riskLevel: "LOW" | "MEDIUM" | "HIGH",
  
  scoreBreakdown: {
    mileage: 0-50,
    recency: 0-40,
    maintenanceType: 0-25,
    regularity: 0-100
  },
  
  factors: [
    "Diagnostic factor 1",
    "Diagnostic factor 2",
    ...
  ],
  
  explanation: {
    summary: "Human-readable summary",
    score: 45.67,
    riskLevel: "MEDIUM",
    mainFactors: ["Factor 1", "Factor 2", "Factor 3"],
    recommendation: "À prévoir dans les prochaines semaines"
  },
  
  analysis: {
    totalInterventions: 12,
    consistency: 85.3,
    regularity: 72.1,
    interventionsByType: {
      "vidange": 6,
      "revision": 3,
      ...
    }
  }
}
```

## Integration with Recommendations

The maintenance risk score is now included in each recommendation:

```javascript
GET /api/recommendations/classees

{
  vehicle: { ... },
  intervention: { ... },
  garages: [ ... ],
  maintenanceRisk: {
    score: 45.5,
    riskLevel: "MEDIUM",
    scoreBreakdown: { ... },
    factors: [ ... ],
    explanation: { ... }
  }
}
```

## Usage Example

```javascript
const { computeMaintenanceRisk } = require('./services/maintenanceRiskScoring');

// Compute risk for a vehicle
const risk = computeMaintenanceRisk(
  currentMileage,      // number (e.g., 85000)
  vehicle,             // { id, type, ...}
  rawInterventions     // array from database
);

if (risk.success) {
  console.log(risk.data.riskLevel);  // "MEDIUM"
  console.log(risk.data.score);      // 45.5
  console.log(risk.data.factors);    // ["...", "...", ...]
}
```

## Migration Notes

- **Backward Compatible:** Existing intervention/garage scoring unchanged
- **Optional:** Maintenance risk score is additive, not replacing existing scores
- **Graceful Degradation:** System handles missing/incomplete history without defaulting to HIGH
- **No Data Loss:** Old mileage-based rules still available via intervention score

## Performance

- Normalization: O(n) where n = number of interventions
- Scoring: O(n log n) due to sorting
- Overall: ~50ms for typical vehicle with 10-20 interventions

## Future Enhancements

1. **Machine Learning:** Train model on historical repair costs vs risk scores
2. **Predictive Intervals:** Adjust max intervals based on vehicle wear patterns
3. **Part Replacement Tracking:** Full parts database integration
4. **Seasonal Adjustments:** Climate-based interval modifications
5. **Fleet Analytics:** Compare vehicle against similar models

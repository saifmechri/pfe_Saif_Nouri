const { computeMaintenanceRisk } = require('./services/maintenanceRiskScoring');

// Test with sample data
const testInterventions = [
  {
    id: 1,
    date_intervention: new Date('2025-01-15'),
    kilometrage: 50000,
    type: 'vidange',
    created_at: new Date('2025-01-15')
  },
  {
    id: 2,
    date_intervention: new Date('2025-03-10'),
    kilometrage: 60000,
    type: 'revision',
    created_at: new Date('2025-03-10')
  }
];

const testVehicle = {
  id: 22,
  type: 'Essence'
};

const currentKm = 75000;

const result = computeMaintenanceRisk(currentKm, testVehicle, testInterventions);

console.log('=== MAINTENANCE RISK SCORING TEST ===');
console.log(JSON.stringify(result, null, 2));



const authRoutes = require('./auth');
const vehiculeRoutes = require('./vehicules');
const interventionRoutes = require('./interventions');
const pieceRoutes = require('./piece.routes');
const recommendationRoutes = require('./recommendations');

const registerRoutes = (app) => {
  app.use('/api/auth', authRoutes);
  app.use('/api/vehicules', vehiculeRoutes);
  app.use('/api/pieces', pieceRoutes);
  app.use('/api/recommendations', recommendationRoutes);

  // Route pour les interventions d'un vehicule
  app.use('/api/vehicules/:vehicleId/interventions', interventionRoutes);
};

module.exports = {
  registerRoutes
};

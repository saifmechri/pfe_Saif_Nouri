const express = require('express');
const cors = require('cors');
const path = require('path');

const { registerRoutes } = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Route racine
  app.get('/', (req, res) => {
    res.json({
      message: "Bienvenue sur l'API d'authentification",
      routes: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (protegee - necessite token JWT)',
        vehicules: 'CRUD /api/vehicules (protege - necessite token JWT)',
        interventions: 'CRUD /api/vehicules/:vehicleId/interventions (protege)'
      }
    });
  });

  registerRoutes(app);

  app.use(errorHandler);

  return app;
};

module.exports = {
  createApp
};

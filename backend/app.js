const express = require('express');
const cors = require('cors');
const path = require('path');

const { registerRoutes } = require('./routes');

const { errorHandler } = require('./middlewares/errorHandler');

let chatRoutes;
try {
  chatRoutes = require('./routes/chat.routes');
} catch (e) {
  console.error('[app.js] ✗ Error loading chat.routes:', e.message);
}

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  
  // Debug middleware to log all requests
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/chat')) {
      console.log(`[DEBUG] Incoming request: ${req.method} ${req.path}`);
    }
    next();
  });
  
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
  
  // Direct mount chat routes as workaround
  if (chatRoutes) {
    app.use('/api/chat', chatRoutes);
  } else {
    console.error('[app.js] ✗ chatRoutes is not available!');
  }

  app.use(errorHandler);

  return app;
};

module.exports = {
  createApp
};

// CENTRAL ROUTE REGISTRY
// This file loads and registers all backend API routes.

let authRoutes, vehiculeRoutes, interventionRoutes, pieceRoutes, recommendationRoutes, garageRoutes, chatRoutes;
let notificationRoutes, appointmentRoutes, maintenanceAlertRoutes, maintenanceRoutes, reportRoutes;
let adminRoutes;
let publicRoutes;

try {
  authRoutes = require('./auth');
} catch (e) {
  console.error('[routes/index] Error loading auth:', e.message);
}

try {
  vehiculeRoutes = require('./vehicules');
} catch (e) {
  console.error('[routes/index] Error loading vehicules:', e.message);
}

try {
  interventionRoutes = require('./interventions');
} catch (e) {
  console.error('[routes/index] Error loading interventions:', e.message);
}

try {
  pieceRoutes = require('./piece.routes');
} catch (e) {
  console.error('[routes/index] Error loading pieces:', e.message);
}

try {
  recommendationRoutes = require('./recommendations');
} catch (e) {
  console.error('[routes/index] Error loading recommendations:', e.message);
}

try {
  publicRoutes = require('./public');
} catch (e) {
  console.error('[routes/index] Error loading public routes:', e.message);
}

try {
  garageRoutes = require('./garage.routes');
} catch (e) {
  console.error('[routes/index] Error loading garages:', e.message);
}

try {
  chatRoutes = require('./chat.routes');
} catch (e) {
  console.error('[routes/index] Error loading chat:', e.message);
}

try {
  notificationRoutes = require('./notifications');
} catch (e) {
  console.error('[routes/index] Error loading notifications:', e.message);
}

try {
  appointmentRoutes = require('./appointments');
} catch (e) {
  console.error('[routes/index] Error loading appointments:', e.message);
}

try {
  maintenanceAlertRoutes = require('./maintenanceAlerts');
} catch (e) {
  console.error('[routes/index] Error loading maintenanceAlerts:', e.message);
}

try {
  adminRoutes = require('./admin');
} catch (e) {
  console.error('[routes/index] Error loading admin routes:', e.message);
}

try {
  maintenanceRoutes = require('./maintenance.routes');
} catch (e) {
  console.error('[routes/index] Error loading maintenance:', e.message);
}

try {
  reportRoutes = require('./reports');
} catch (e) {
  console.error('[routes/index] Error loading reports:', e.message);
}

const registerRoutes = (app) => {
  console.log('[registerRoutes] CALLED - debug mode', process.env.DEBUG_ROUTES ? 'ON' : 'OFF');
  const debug = process.env.DEBUG_ROUTES;
  
  if (authRoutes) {
    if (debug) console.log('[registerRoutes] Mounting /api/auth');
    app.use('/api/auth', authRoutes);
  }
  if (vehiculeRoutes) {
    if (debug) console.log('[registerRoutes] Mounting /api/vehicules');
    app.use('/api/vehicules', vehiculeRoutes);
  }
  if (pieceRoutes) {
    if (debug) console.log('[registerRoutes] Mounting /api/pieces');
    app.use('/api/pieces', pieceRoutes);
  }
  if (publicRoutes) {
    if (debug) console.log('[registerRoutes] Mounting /api/public');
    app.use('/api/public', publicRoutes);
  }
  if (recommendationRoutes) {
    if (debug) console.log('[registerRoutes] Mounting /api/recommendations');
    app.use('/api/recommendations', recommendationRoutes);
  }
  if (garageRoutes) {
    if (debug) console.log('[registerRoutes] Mounting /api/garages');
    app.use('/api/garages', garageRoutes);
  }
  if (chatRoutes) {
    console.log('[registerRoutes] Mounting /api/chat - chatRoutes is:', typeof chatRoutes);
    app.use('/api/chat', chatRoutes);
    console.log('[registerRoutes] ✓ /api/chat mounted');
  } else {
    console.log('[registerRoutes] ✗ chatRoutes is undefined or falsy');
  }
  if (notificationRoutes) {
    if (debug) console.log('[registerRoutes] Mounting /api/notifications');
    app.use('/api/notifications', notificationRoutes);
  }
  if (appointmentRoutes) {
    if (debug) console.log('[registerRoutes] Mounting /api/appointments');
    app.use('/api/appointments', appointmentRoutes);
  }
  if (maintenanceAlertRoutes) {
    if (debug) console.log('[registerRoutes] Mounting /api/maintenance-alerts');
    app.use('/api/maintenance-alerts', maintenanceAlertRoutes);
  }
  if (reportRoutes) {
    if (debug) console.log('[registerRoutes] Mounting /api/reports');
    app.use('/api/reports', reportRoutes);
  }
  if (!adminRoutes) {
    try {
      adminRoutes = require('./admin');
    } catch (e) {
      console.error('[registerRoutes] Error loading admin routes at mount time:', e.message);
    }
  }
  if (adminRoutes) {
    console.log('[registerRoutes] Mounting /api/admin - adminRoutes is:', typeof adminRoutes);
    app.use('/api/admin', adminRoutes);
  } else {
    console.log('[registerRoutes] ✗ adminRoutes is undefined or falsy');
  }
  if (interventionRoutes) {
    if (debug) console.log('[registerRoutes] Mounting /api/vehicules/:vehicleId/interventions');
    app.use('/api/vehicules/:vehicleId/interventions', interventionRoutes);
  }
  if (maintenanceRoutes) {
    if (debug) console.log('[registerRoutes] Mounting /api/maintenance');
    app.use('/api/maintenance', maintenanceRoutes);
  }
  
  if (debug) console.log('[registerRoutes] All routes registered. App router stack length:', app._router?.stack?.length || 0);
};

module.exports = {
  registerRoutes
};

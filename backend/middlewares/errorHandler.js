const { AppError } = require('../utils/appError');
const { logger } = require('../utils/logger');

const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode >= 500 ? 'Erreur serveur' : err.message || 'Erreur inattendue';

  if (statusCode >= 500) {
    logger.error(err.message || 'Unhandled error', {
      name: err.name,
      code: err.code,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }

  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: {
      code: err.errorCode || err.code || (err instanceof AppError ? 'APP_ERROR' : 'INTERNAL_SERVER_ERROR')
    }
  });
};

module.exports = { errorHandler };
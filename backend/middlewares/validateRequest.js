const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    data: null,
    error: {
      code: 'VALIDATION_ERROR',
      details: errors.array().map((error) => ({
        field: error.path,
        message: error.msg
      }))
    }
  });
};

module.exports = { validateRequest };


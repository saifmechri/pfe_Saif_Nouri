const sendApiResponse = (res, { statusCode = 200, success = true, message = '', data = null, error = null, extra = {} }) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    error,
    ...extra
  });
};

module.exports = { sendApiResponse };
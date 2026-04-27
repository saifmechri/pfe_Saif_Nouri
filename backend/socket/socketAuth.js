const jwt = require('jsonwebtoken');
const { findUserForAuthById } = require('../models/user.model');

const SECRET = process.env.JWT_SECRET || 'jwt_secret_key';

const extractToken = (socket) => {
  const handshakeToken = socket?.handshake?.auth?.token;
  const authHeader = socket?.handshake?.headers?.authorization;

  if (typeof handshakeToken === 'string' && handshakeToken.trim()) {
    return handshakeToken.replace(/^Bearer\s+/i, '').trim();
  }

  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]?.trim();
  }

  return null;
};

const authenticateSocket = async (socket, next) => {
  try {
    const token = extractToken(socket);

    if (!token) {
      const error = new Error('Token manquant');
      error.data = { code: 'TOKEN_MISSING' };
      return next(error);
    }

    const decoded = jwt.verify(token, SECRET);
    const user = await findUserForAuthById(decoded.id);

    if (!user) {
      const error = new Error('Utilisateur non trouve');
      error.data = { code: 'USER_NOT_FOUND' };
      return next(error);
    }

    socket.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      error.data = { code: 'TOKEN_EXPIRED' };
      return next(error);
    }

    if (error.name === 'JsonWebTokenError') {
      error.data = { code: 'TOKEN_INVALID' };
      return next(error);
    }

    error.data = error.data || { code: 'SOCKET_AUTH_ERROR' };
    return next(error);
  }
};

module.exports = {
  authenticateSocket
};

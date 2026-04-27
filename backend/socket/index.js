const { Server } = require('socket.io');

const { authenticateSocket } = require('./socketAuth');
const { registerChatHandlers, getUserRoom } = require('./chat.socket');
const { logger } = require('../utils/logger');

const getAllowedOrigins = () => {
  const origin = process.env.SOCKET_CORS_ORIGIN || process.env.CORS_ORIGIN || '*';

  if (origin === '*') {
    return '*';
  }

  return origin
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    path: process.env.SOCKET_PATH || '/socket.io',
    cors: {
      origin: getAllowedOrigins(),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    socket.join(getUserRoom(socket.user.id));

    logger.info('Socket connected', {
      socketId: socket.id,
      userId: socket.user.id
    });

    socket.emit('chat:connected', {
      socketId: socket.id,
      user: {
        id: socket.user.id,
        name: socket.user.name,
        email: socket.user.email,
        role: socket.user.role
      },
      connectedAt: new Date().toISOString()
    });

    registerChatHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId: socket.user.id,
        reason
      });
    });
  });

  return io;
};

module.exports = {
  createSocketServer
};

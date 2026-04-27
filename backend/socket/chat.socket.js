const { logger } = require('../utils/logger');

const MAX_MESSAGE_LENGTH = 2000;

const getRoomName = (roomId) => `chat:${roomId}`;

const normalizeRoomId = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const asString = String(value).trim();
  return asString.length > 0 ? asString : null;
};

const normalizeMessage = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const message = value.trim();
  if (!message) {
    return null;
  }

  return message.slice(0, MAX_MESSAGE_LENGTH);
};

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

const registerChatHandlers = (io, socket) => {
  socket.data.joinedRooms = new Set();

  socket.on('chat:join', ({ roomId } = {}, ack) => {
    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      if (typeof ack === 'function') {
        ack({ ok: false, error: 'roomId est obligatoire' });
      }
      return;
    }

    const roomName = getRoomName(normalizedRoomId);
    socket.join(roomName);
    socket.data.joinedRooms.add(normalizedRoomId);

    socket.to(roomName).emit('chat:user_joined', {
      roomId: normalizedRoomId,
      user: toPublicUser(socket.user),
      joinedAt: new Date().toISOString()
    });

    if (typeof ack === 'function') {
      ack({ ok: true, roomId: normalizedRoomId });
    }

    logger.info('Socket room joined', {
      socketId: socket.id,
      userId: socket.user.id,
      roomId: normalizedRoomId
    });
  });

  socket.on('chat:leave', ({ roomId } = {}, ack) => {
    const normalizedRoomId = normalizeRoomId(roomId);

    if (!normalizedRoomId) {
      if (typeof ack === 'function') {
        ack({ ok: false, error: 'roomId est obligatoire' });
      }
      return;
    }

    const roomName = getRoomName(normalizedRoomId);
    socket.leave(roomName);
    socket.data.joinedRooms.delete(normalizedRoomId);

    socket.to(roomName).emit('chat:user_left', {
      roomId: normalizedRoomId,
      user: toPublicUser(socket.user),
      leftAt: new Date().toISOString()
    });

    if (typeof ack === 'function') {
      ack({ ok: true, roomId: normalizedRoomId });
    }

    logger.info('Socket room left', {
      socketId: socket.id,
      userId: socket.user.id,
      roomId: normalizedRoomId
    });
  });

  socket.on('chat:message', ({ roomId, message, clientMessageId } = {}, ack) => {
    const normalizedRoomId = normalizeRoomId(roomId);
    const normalizedMessage = normalizeMessage(message);

    if (!normalizedRoomId || !normalizedMessage) {
      if (typeof ack === 'function') {
        ack({ ok: false, error: 'roomId et message sont obligatoires' });
      }
      return;
    }

    if (!socket.data.joinedRooms.has(normalizedRoomId)) {
      if (typeof ack === 'function') {
        ack({ ok: false, error: 'Rejoignez la room avant d envoyer un message' });
      }
      return;
    }

    const outgoingMessage = {
      id: `${Date.now()}-${socket.id}`,
      clientMessageId: clientMessageId || null,
      roomId: normalizedRoomId,
      message: normalizedMessage,
      sender: toPublicUser(socket.user),
      createdAt: new Date().toISOString()
    };

    io.to(getRoomName(normalizedRoomId)).emit('chat:message', outgoingMessage);

    if (typeof ack === 'function') {
      ack({ ok: true, messageId: outgoingMessage.id });
    }

    logger.info('Socket message broadcast', {
      socketId: socket.id,
      userId: socket.user.id,
      roomId: normalizedRoomId
    });
  });
};

module.exports = {
  registerChatHandlers
};

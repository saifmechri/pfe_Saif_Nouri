const { logger } = require('../utils/logger');
const {
  startConversation,
  getConversationById,
  listConversations,
  listConversationMessages,
  sendMessageToConversation
} = require('../services/chatService');

const getConversationRoom = (conversationId) => `chat:conversation:${conversationId}`;
const getUserRoom = (userId) => `chat:user:${userId}`;

const toSocketError = (error) => ({
  ok: false,
  error: error?.message || 'Erreur chat',
  code: error?.code || 'CHAT_ERROR'
});

const registerChatHandlers = (io, socket) => {
  socket.data.joinedConversationIds = new Set();

  socket.on('chat:conversations', async ({ limit, offset } = {}, ack) => {
    try {
      const items = await listConversations({ user: socket.user, limit, offset });
      if (typeof ack === 'function') {
        ack({ ok: true, items });
      }
    } catch (error) {
      logger.warn('Socket chat:conversations failed', { socketId: socket.id, userId: socket.user.id, code: error.code });
      if (typeof ack === 'function') {
        ack(toSocketError(error));
      }
    }
  });

  socket.on('chat:start', async ({ conversationType, garageId, vendeurId, automobilisteId, historyLimit } = {}, ack) => {
    try {
      const conversation = await startConversation({
        requester: socket.user,
        conversationType,
        garageId,
        vendeurId,
        automobilisteId
      });

      const roomName = getConversationRoom(conversation.id);
      socket.join(roomName);
      socket.data.joinedConversationIds.add(conversation.id);

      const history = await listConversationMessages({
        user: socket.user,
        conversationId: conversation.id,
        limit: historyLimit || 30
      });

      socket.to(roomName).emit('chat:user_joined', {
        conversationId: conversation.id,
        user: {
          id: socket.user.id,
          name: socket.user.name,
          email: socket.user.email,
          role: socket.user.role
        },
        joinedAt: new Date().toISOString()
      });

      const recipientUserId = conversation.counterpart?.user_id || conversation.counterpart?.id;
      if (recipientUserId && Number(recipientUserId) !== Number(socket.user.id)) {
        io.to(getUserRoom(recipientUserId)).emit('chat:conversation_available', {
          conversation
        });
      }

      if (typeof ack === 'function') {
        ack({ ok: true, conversation, messages: history.messages });
      }

      logger.info('Socket conversation started', {
        socketId: socket.id,
        userId: socket.user.id,
        conversationId: conversation.id,
        conversationType: conversation.conversationType
      });
    } catch (error) {
      logger.warn('Socket chat:start failed', {
        socketId: socket.id,
        userId: socket.user.id,
        code: error.code
      });
      if (typeof ack === 'function') {
        ack(toSocketError(error));
      }
    }
  });

  socket.on('chat:join', async ({ conversationId, historyLimit } = {}, ack) => {
    try {
      const conversation = await getConversationById(conversationId, socket.user);
      const roomName = getConversationRoom(conversation.id);

      socket.join(roomName);
      socket.data.joinedConversationIds.add(conversation.id);

      const history = await listConversationMessages({
        user: socket.user,
        conversationId: conversation.id,
        limit: historyLimit || 30
      });

      socket.to(roomName).emit('chat:user_joined', {
        conversationId: conversation.id,
        user: {
          id: socket.user.id,
          name: socket.user.name,
          email: socket.user.email,
          role: socket.user.role
        },
        joinedAt: new Date().toISOString()
      });

      if (typeof ack === 'function') {
        ack({ ok: true, conversation, messages: history.messages });
      }
    } catch (error) {
      logger.warn('Socket chat:join failed', {
        socketId: socket.id,
        userId: socket.user.id,
        code: error.code
      });
      if (typeof ack === 'function') {
        ack(toSocketError(error));
      }
    }
  });

  socket.on('chat:history', async ({ conversationId, limit, beforeMessageId } = {}, ack) => {
    try {
      const history = await listConversationMessages({
        user: socket.user,
        conversationId,
        limit,
        beforeMessageId
      });

      if (typeof ack === 'function') {
        ack({
          ok: true,
          conversation: history.conversation,
          messages: history.messages
        });
      }
    } catch (error) {
      logger.warn('Socket chat:history failed', {
        socketId: socket.id,
        userId: socket.user.id,
        code: error.code
      });
      if (typeof ack === 'function') {
        ack(toSocketError(error));
      }
    }
  });

  socket.on('chat:leave', async ({ conversationId } = {}, ack) => {
    try {
      const conversation = await getConversationById(conversationId, socket.user);
      const roomName = getConversationRoom(conversation.id);

      socket.leave(roomName);
      socket.data.joinedConversationIds.delete(conversation.id);

      socket.to(roomName).emit('chat:user_left', {
        conversationId: conversation.id,
        user: {
          id: socket.user.id,
          name: socket.user.name,
          email: socket.user.email,
          role: socket.user.role
        },
        leftAt: new Date().toISOString()
      });

      if (typeof ack === 'function') {
        ack({ ok: true, conversationId: conversation.id });
      }
    } catch (error) {
      logger.warn('Socket chat:leave failed', {
        socketId: socket.id,
        userId: socket.user.id,
        code: error.code
      });
      if (typeof ack === 'function') {
        ack(toSocketError(error));
      }
    }
  });

  socket.on('chat:message', async ({ conversationId, message, clientMessageId } = {}, ack) => {
    try {
      const payload = await sendMessageToConversation({
        user: socket.user,
        conversationId,
        message,
        clientMessageId
      });

      if (!socket.data.joinedConversationIds.has(payload.conversation.id)) {
        socket.join(getConversationRoom(payload.conversation.id));
        socket.data.joinedConversationIds.add(payload.conversation.id);
      }

      io.to(getConversationRoom(payload.conversation.id)).emit('chat:message', {
        conversationId: payload.conversation.id,
        message: payload.message
      });

      const recipientUserId = payload.conversation.counterpart?.user_id || payload.conversation.counterpart?.id;
      if (recipientUserId && Number(recipientUserId) !== Number(socket.user.id)) {
        io.to(getUserRoom(recipientUserId)).emit('chat:new_message', {
          conversationId: payload.conversation.id,
          message: payload.message
        });
      }

      if (typeof ack === 'function') {
        ack({ ok: true, conversationId: payload.conversation.id, messageId: payload.message.id });
      }

      logger.info('Socket message persisted and broadcast', {
        socketId: socket.id,
        userId: socket.user.id,
        conversationId: payload.conversation.id,
        messageId: payload.message.id
      });
    } catch (error) {
      logger.warn('Socket chat:message failed', {
        socketId: socket.id,
        userId: socket.user.id,
        code: error.code
      });
      if (typeof ack === 'function') {
        ack(toSocketError(error));
      }
    }
  });
};

module.exports = {
  registerChatHandlers,
  getUserRoom
};

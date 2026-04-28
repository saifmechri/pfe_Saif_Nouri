const { asyncHandler } = require('../middlewares/asyncHandler');
const {
  startConversation,
  getConversationById,
  listConversations,
  listConversationMessages,
  sendMessageToConversation
} = require('../services/chatService');

const CHAT_STATUS_BY_CODE = {
  INVALID_CONVERSATION_TYPE: 400,
  INVALID_GARAGE_ID: 400,
  INVALID_VENDEUR_ID: 400,
  INVALID_AUTOMOBILISTE_ID: 400,
  INVALID_CONVERSATION_ID: 400,
  INVALID_MESSAGE: 400,
  FORBIDDEN_ROLE: 403,
  FORBIDDEN_CONVERSATION: 403,
  CONVERSATION_NOT_FOUND: 404,
  GARAGE_NOT_FOUND: 404,
  GARAGE_PROFILE_NOT_FOUND: 404,
  VENDEUR_NOT_FOUND: 404,
  AUTOMOBILISTE_NOT_FOUND: 404
};

const toErrorPayload = (error) => ({
  success: false,
  message: error?.message || 'Erreur chat',
  data: null,
  error: {
    code: error?.code || 'CHAT_ERROR'
  }
});

const sendChatError = (res, error) => {
  const statusCode = CHAT_STATUS_BY_CODE[error?.code] || 500;
  return res.status(statusCode).json(toErrorPayload(error));
};

const listChatConversations = asyncHandler(async (req, res) => {
  try {
    const items = await listConversations({
      user: req.user,
      limit: req.query?.limit,
      offset: req.query?.offset
    });

    return res.json({
      success: true,
      data: { items }
    });
  } catch (error) {
    return sendChatError(res, error);
  }
});

const getChatConversationById = asyncHandler(async (req, res) => {
  try {
    const conversation = await getConversationById(req.params.conversationId, req.user);
    return res.json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    return sendChatError(res, error);
  }
});

const startChatConversation = asyncHandler(async (req, res) => {
  try {
    const { conversationType, garageId, vendeurId, automobilisteId, historyLimit } = req.body || {};

    const conversation = await startConversation({
      requester: req.user,
      conversationType,
      garageId,
      vendeurId,
      automobilisteId
    });

    const history = await listConversationMessages({
      user: req.user,
      conversationId: conversation.id,
      limit: historyLimit || 30
    });

    return res.status(201).json({
      success: true,
      data: {
        conversation,
        messages: history.messages
      }
    });
  } catch (error) {
    return sendChatError(res, error);
  }
});

const listChatMessages = asyncHandler(async (req, res) => {
  try {
    const history = await listConversationMessages({
      user: req.user,
      conversationId: req.params.conversationId,
      limit: req.query?.limit,
      beforeMessageId: req.query?.beforeMessageId
    });

    return res.json({
      success: true,
      data: {
        conversation: history.conversation,
        messages: history.messages
      }
    });
  } catch (error) {
    return sendChatError(res, error);
  }
});

const createChatMessage = asyncHandler(async (req, res) => {
  try {
    const payload = await sendMessageToConversation({
      user: req.user,
      conversationId: req.params.conversationId,
      message: req.body?.message,
      clientMessageId: req.body?.clientMessageId
    });

    return res.status(201).json({
      success: true,
      data: payload
    });
  } catch (error) {
    return sendChatError(res, error);
  }
});

module.exports = {
  listChatConversations,
  getChatConversationById,
  startChatConversation,
  listChatMessages,
  createChatMessage
};

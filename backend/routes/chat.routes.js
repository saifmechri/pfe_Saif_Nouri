const express = require('express');

const { verifyToken } = require('../middlewares/authMiddleware');
const { listChatContacts } = require('../controllers/chatContacts.controller');
const {
	listChatConversations,
	getChatConversationById,
	startChatConversation,
	listChatMessages,
	createChatMessage
} = require('../controllers/chat.controller');

const router = express.Router();

router.get('/contacts', verifyToken, listChatContacts);
router.get('/conversations', verifyToken, listChatConversations);
router.get('/conversations/:conversationId', verifyToken, getChatConversationById);
router.post('/conversations/start', verifyToken, startChatConversation);
router.get('/conversations/:conversationId/messages', verifyToken, listChatMessages);
router.post('/conversations/:conversationId/messages', verifyToken, createChatMessage);

module.exports = router;

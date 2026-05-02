const {
  findConversationById,
  findConversationByParticipants,
  createConversation,
  listConversationsForAutomobiliste,
  listConversationsForGarageUser,
  listConversationsForVendeur,
  listConversationsForAdmin,
  createMessage,
  touchConversation,
  listMessagesByConversation,
  findUserByIdWithRole
} = require('../models/chat.model');
const notificationService = require('./notificationService');
const { findGarageIdentityById, findGarageIdentityByUserId } = require('../models/garage.model');

const MAX_MESSAGE_LENGTH = 2000;

const createChatError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const toPublicUser = (id, name, email, role) => ({
  id: Number(id),
  name,
  email,
  role
});

const mapConversationForUser = (row, viewerUserId) => {
  const conversationType = row.conversation_type;
  const automobiliste = {
    id: Number(row.automobiliste_user_id),
    name: row.automobiliste_name,
    email: row.automobiliste_email,
    role: 'automobiliste'
  };

  const garage = row.garage_id
    ? {
        id: Number(row.garage_id),
        name: row.garage_name,
        user_id: row.garage_user_id ? Number(row.garage_user_id) : null,
        role: 'garage'
      }
    : null;

  const vendeur = row.vendeur_user_id
    ? {
        id: Number(row.vendeur_user_id),
        name: row.vendeur_store_name || row.vendeur_name,
        email: row.vendeur_email,
        role: 'vendeur'
      }
    : null;

  let counterpart = null;

  if (Number(viewerUserId) === automobiliste.id) {
    counterpart = conversationType === 'automobiliste_garage' ? garage : vendeur;
  } else if (conversationType === 'automobiliste_garage') {
    counterpart = automobiliste;
  } else {
    counterpart = automobiliste;
  }

  return {
    id: Number(row.id),
    conversationType,
    automobiliste,
    garage,
    vendeur,
    counterpart,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at || row.created_at
  };
};

const mapMessage = (row) => ({
  id: Number(row.id),
  conversationId: Number(row.conversation_id),
  sender: toPublicUser(row.sender_user_id, row.sender_name, row.sender_email, row.sender_role),
  message: row.content,
  clientMessageId: row.client_message_id || null,
  createdAt: row.created_at
});

const ensureConversationAccess = (conversationRow, user) => {
  if (!conversationRow) {
    throw createChatError('CONVERSATION_NOT_FOUND', 'Conversation introuvable');
  }

  if (user.role === 'admin') {
    return;
  }

  const userId = Number(user.id);
  if (Number(conversationRow.automobiliste_user_id) === userId) {
    return;
  }

  if (
    conversationRow.conversation_type === 'automobiliste_garage' &&
    conversationRow.garage_user_id !== null &&
    Number(conversationRow.garage_user_id) === userId
  ) {
    return;
  }

  if (
    conversationRow.conversation_type === 'automobiliste_vendeur' &&
    conversationRow.vendeur_user_id !== null &&
    Number(conversationRow.vendeur_user_id) === userId
  ) {
    return;
  }

  throw createChatError('FORBIDDEN_CONVERSATION', 'Acces refuse a cette conversation');
};

const resolvePairForStart = async ({ requester, conversationType, garageId, vendeurId, automobilisteId }) => {
  if (!['automobiliste_garage', 'automobiliste_vendeur'].includes(conversationType)) {
    throw createChatError('INVALID_CONVERSATION_TYPE', 'conversationType invalide');
  }

  const requesterId = Number(requester.id);

  if (conversationType === 'automobiliste_garage') {
    if (requester.role === 'automobiliste') {
      const normalizedGarageId = Number.parseInt(garageId, 10);
      if (!Number.isInteger(normalizedGarageId) || normalizedGarageId <= 0) {
        throw createChatError('INVALID_GARAGE_ID', 'garageId est obligatoire');
      }

      const garage = await findGarageIdentityById(normalizedGarageId);
      if (!garage || !garage.user_id) {
        throw createChatError('GARAGE_NOT_FOUND', 'Garage introuvable');
      }

      return {
        conversationType,
        automobilisteUserId: requesterId,
        garageId: normalizedGarageId,
        vendeurUserId: null
      };
    }

    if (requester.role === 'garage') {
      const normalizedAutomobilisteId = Number.parseInt(automobilisteId, 10);
      if (!Number.isInteger(normalizedAutomobilisteId) || normalizedAutomobilisteId <= 0) {
        throw createChatError('INVALID_AUTOMOBILISTE_ID', 'automobilisteId est obligatoire');
      }

      const meAsGarage = await findGarageIdentityByUserId(requesterId);
      if (!meAsGarage) {
        throw createChatError('GARAGE_PROFILE_NOT_FOUND', 'Profil garage introuvable');
      }

      const automobilisteUser = await findUserByIdWithRole(normalizedAutomobilisteId);
      if (!automobilisteUser || automobilisteUser.role !== 'automobiliste') {
        throw createChatError('AUTOMOBILISTE_NOT_FOUND', 'Automobiliste introuvable');
      }

      return {
        conversationType,
        automobilisteUserId: normalizedAutomobilisteId,
        garageId: Number(meAsGarage.id),
        vendeurUserId: null
      };
    }

    throw createChatError('FORBIDDEN_ROLE', 'Seuls automobiliste et garage peuvent creer ce chat');
  }

  if (requester.role === 'automobiliste') {
    const normalizedVendeurId = Number.parseInt(vendeurId, 10);
    if (!Number.isInteger(normalizedVendeurId) || normalizedVendeurId <= 0) {
      throw createChatError('INVALID_VENDEUR_ID', 'vendeurId est obligatoire');
    }

    const vendeurUser = await findUserByIdWithRole(normalizedVendeurId);
    if (!vendeurUser || vendeurUser.role !== 'vendeur') {
      throw createChatError('VENDEUR_NOT_FOUND', 'Vendeur introuvable');
    }

    return {
      conversationType,
      automobilisteUserId: requesterId,
      garageId: null,
      vendeurUserId: normalizedVendeurId
    };
  }

  if (requester.role === 'vendeur') {
    const normalizedAutomobilisteId = Number.parseInt(automobilisteId, 10);
    if (!Number.isInteger(normalizedAutomobilisteId) || normalizedAutomobilisteId <= 0) {
      throw createChatError('INVALID_AUTOMOBILISTE_ID', 'automobilisteId est obligatoire');
    }

    const automobilisteUser = await findUserByIdWithRole(normalizedAutomobilisteId);
    if (!automobilisteUser || automobilisteUser.role !== 'automobiliste') {
      throw createChatError('AUTOMOBILISTE_NOT_FOUND', 'Automobiliste introuvable');
    }

    return {
      conversationType,
      automobilisteUserId: normalizedAutomobilisteId,
      garageId: null,
      vendeurUserId: requesterId
    };
  }

  throw createChatError('FORBIDDEN_ROLE', 'Seuls automobiliste et vendeur peuvent creer ce chat');
};

const getConversationById = async (conversationId, user) => {
  const normalizedConversationId = Number.parseInt(conversationId, 10);
  if (!Number.isInteger(normalizedConversationId) || normalizedConversationId <= 0) {
    throw createChatError('INVALID_CONVERSATION_ID', 'conversationId invalide');
  }

  const conversationRow = await findConversationById(normalizedConversationId);
  ensureConversationAccess(conversationRow, user);

  return mapConversationForUser(conversationRow, user.id);
};

const startConversation = async ({ requester, conversationType, garageId, vendeurId, automobilisteId }) => {
  const pair = await resolvePairForStart({
    requester,
    conversationType,
    garageId,
    vendeurId,
    automobilisteId
  });

  let conversationRow = await findConversationByParticipants(pair);

  if (!conversationRow) {
    try {
      conversationRow = await createConversation({
        ...pair,
        createdByUserId: Number(requester.id)
      });
    } catch (error) {
      if (error.code === '23505') {
        conversationRow = await findConversationByParticipants(pair);
      } else {
        throw error;
      }
    }
  }

  ensureConversationAccess(conversationRow, requester);
  return mapConversationForUser(conversationRow, requester.id);
};

const listConversations = async ({ user, limit, offset }) => {
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 30));
  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

  let rows = [];
  if (user.role === 'automobiliste') {
    rows = await listConversationsForAutomobiliste(Number(user.id), safeLimit, safeOffset);
  } else if (user.role === 'garage') {
    rows = await listConversationsForGarageUser(Number(user.id), safeLimit, safeOffset);
  } else if (user.role === 'vendeur') {
    rows = await listConversationsForVendeur(Number(user.id), safeLimit, safeOffset);
  } else if (user.role === 'admin') {
    rows = await listConversationsForAdmin(safeLimit, safeOffset);
  } else {
    throw createChatError('FORBIDDEN_ROLE', 'Role non autorise pour le chat');
  }

  return rows.map((row) => mapConversationForUser(row, user.id));
};

const listConversationMessages = async ({ user, conversationId, limit, beforeMessageId }) => {
  const conversation = await getConversationById(conversationId, user);

  const rows = await listMessagesByConversation({
    conversationId: conversation.id,
    limit,
    beforeMessageId: beforeMessageId ? Number.parseInt(beforeMessageId, 10) : null
  });

  const items = rows.map(mapMessage).reverse();

  return {
    conversation,
    messages: items
  };
};

const sendMessageToConversation = async ({ user, conversationId, message, clientMessageId }) => {
  const conversation = await getConversationById(conversationId, user);

  if (typeof message !== 'string' || !message.trim()) {
    throw createChatError('INVALID_MESSAGE', 'Le message est obligatoire');
  }

  const normalizedMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);
  const created = await createMessage({
    conversationId: conversation.id,
    senderUserId: Number(user.id),
    message: normalizedMessage,
    clientMessageId: clientMessageId ? String(clientMessageId).trim().slice(0, 100) : null
  });

  await touchConversation(conversation.id);

  // Génération automatique d'une notification pour le destinataire du message
  try {
    const senderId = Number(user.id);
    let recipientUserId = null;

    if (conversation.conversationType === 'automobiliste_garage') {
      // conversation.automobiliste contains user id of automobiliste, conversation.garage contains garage info with user_id
      const automobilisteId = Number(conversation.automobiliste.id);
      const garageUserId = conversation.garage?.user_id ? Number(conversation.garage.user_id) : null;
      if (senderId === automobilisteId) recipientUserId = garageUserId;
      else recipientUserId = automobilisteId;
    } else if (conversation.conversationType === 'automobiliste_vendeur') {
      const automobilisteId = Number(conversation.automobiliste.id);
      const vendeurUserId = conversation.vendeur ? Number(conversation.vendeur.id) : null;
      if (senderId === automobilisteId) recipientUserId = vendeurUserId;
      else recipientUserId = automobilisteId;
    }

    if (recipientUserId && recipientUserId !== senderId) {
      const title = `Nouveau message de ${user.name || 'contact'}`;
      const body = normalizedMessage.length > 200 ? normalizedMessage.slice(0, 197) + '...' : normalizedMessage;

      // create notification (non bloquant semantics but await to ensure persistence)
      await notificationService.createForUser({
        userId: recipientUserId,
        actorUserId: senderId,
        type: 'message',
        referenceId: conversation.id,
        title,
        body,
        metadata: { conversationId: conversation.id, messageId: Number(created.id) }
      });
    }
  } catch (err) {
    // log but do not fail the message send
    console.error('Failed to create message notification:', err && err.message ? err.message : err);
  }

  return {
    conversation,
    message: {
      id: Number(created.id),
      conversationId: Number(created.conversation_id),
      sender: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: created.content,
      clientMessageId: created.client_message_id,
      createdAt: created.created_at
    }
  };
};

module.exports = {
  createChatError,
  startConversation,
  getConversationById,
  listConversations,
  listConversationMessages,
  sendMessageToConversation
};

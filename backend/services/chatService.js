const {
  findConversationById,
  findConversationByParticipants,
  createConversation,
  listConversationsForAutomobiliste,
  listConversationsForGarageUser,
  listConversationsForGarageVendeur,
  listConversationsForVendeur,
  listConversationsForAdmin,
  createMessage,
  touchConversation,
  listMessagesByConversation,
  findUserByIdWithRole
} = require('../models/chat.model');
const { findUserByEmail } = require('../models/user.model');
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
  } else if (conversationType === 'garage_vendeur' && garage && Number(viewerUserId) === Number(garage.user_id)) {
    counterpart = vendeur;
  } else if (conversationType === 'garage_vendeur' && vendeur && Number(viewerUserId) === Number(row.vendeur_user_id)) {
    counterpart = garage;
  } else if (conversationType === 'automobiliste_garage') {
    counterpart = automobiliste;
  } else {
    counterpart = conversationType === 'garage_vendeur' ? garage : automobiliste;
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

const resolveRequesterUserId = async (requester) => {
  const requesterId = Number.parseInt(requester?.id, 10);
  if (Number.isInteger(requesterId) && requesterId > 0) {
    return requesterId;
  }

  // Legacy admin tokens can miss id; recover it from admin email.
  if (requester?.role === 'admin' && requester?.email) {
    const rawEmail = String(requester.email).trim();
    const adminUser = await findUserByEmail(rawEmail) || await findUserByEmail(rawEmail.toLowerCase());
    const adminUserId = Number.parseInt(adminUser?.id, 10);
    if (Number.isInteger(adminUserId) && adminUserId > 0) {
      return adminUserId;
    }
  }

  throw createChatError('FORBIDDEN_ROLE', 'Utilisateur non identifie pour creer une conversation');
};

const resolvePairForStart = async ({ requester, conversationType, garageId, vendeurId, automobilisteId }) => {
  if (!['automobiliste_garage', 'automobiliste_vendeur', 'garage_vendeur'].includes(conversationType)) {
    throw createChatError('INVALID_CONVERSATION_TYPE', 'conversationType invalide');
  }

  const requesterId = await resolveRequesterUserId(requester);

  if (conversationType === 'automobiliste_garage') {
    if (requester.role === 'automobiliste' || requester.role === 'admin') {
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

  if (conversationType === 'garage_vendeur') {
    if (requester.role !== 'garage') {
      throw createChatError('FORBIDDEN_ROLE', 'Seuls les garages peuvent creer ce chat');
    }

    const normalizedVendeurId = Number.parseInt(vendeurId, 10);

    if (!Number.isInteger(normalizedVendeurId) || normalizedVendeurId <= 0) {
      throw createChatError('INVALID_VENDEUR_ID', 'vendeurId est obligatoire');
    }

    const meAsGarage = await findGarageIdentityByUserId(requesterId);
    if (!meAsGarage) {
      throw createChatError('GARAGE_PROFILE_NOT_FOUND', 'Profil garage introuvable');
    }

    const vendeurUser = await findUserByIdWithRole(normalizedVendeurId);
    if (!vendeurUser || vendeurUser.role !== 'vendeur') {
      throw createChatError('VENDEUR_NOT_FOUND', 'Vendeur introuvable');
    }

    return {
      conversationType,
      automobilisteUserId: requesterId,
      garageId: Number(meAsGarage.id),
      vendeurUserId: normalizedVendeurId
    };
  }

  if (requester.role === 'automobiliste' || requester.role === 'admin') {
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

  if (requester.role === 'vendeur' || requester.role === 'admin') {
    const normalizedAutomobilisteId = Number.parseInt(automobilisteId, 10);
    if (Number.isInteger(normalizedAutomobilisteId) && normalizedAutomobilisteId > 0) {
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

    const normalizedVendeurId = Number.parseInt(vendeurId, 10);
    if (Number.isInteger(normalizedVendeurId) && normalizedVendeurId > 0) {
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

    throw createChatError('INVALID_AUTOMOBILISTE_ID', 'automobilisteId ou vendeurId est obligatoire');
  }

  throw createChatError('FORBIDDEN_ROLE', 'Seuls automobiliste, vendeur et admin peuvent creer ce chat');
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
  if (user.role === 'admin') {
    rows = await listConversationsForAdmin(safeLimit, safeOffset);
  } else if (user.role === 'automobiliste') {
    rows = await listConversationsForAutomobiliste(Number(user.id), safeLimit, safeOffset);
  } else if (user.role === 'garage') {
    const [garageRows, garageVendorRows] = await Promise.all([
      listConversationsForGarageUser(Number(user.id), safeLimit, safeOffset),
      listConversationsForGarageVendeur(Number(user.id), safeLimit, safeOffset)
    ]);

    const merged = new Map();
    [...garageRows, ...garageVendorRows].forEach((row) => {
      merged.set(Number(row.id), row);
    });

    rows = Array.from(merged.values()).sort((left, right) => {
      const leftTime = new Date(left.last_message_at || left.created_at || 0).getTime();
      const rightTime = new Date(right.last_message_at || right.created_at || 0).getTime();
      return rightTime - leftTime;
    });
  } else if (user.role === 'vendeur') {
    const [vendeurRows, automobilisteRows] = await Promise.all([
      listConversationsForVendeur(Number(user.id), safeLimit, safeOffset),
      listConversationsForAutomobiliste(Number(user.id), safeLimit, safeOffset)
    ]);

    const merged = new Map();
    [...vendeurRows, ...automobilisteRows].forEach((row) => {
      merged.set(Number(row.id), row);
    });

    rows = Array.from(merged.values()).sort((left, right) => {
      const leftTime = new Date(left.last_message_at || left.created_at || 0).getTime();
      const rightTime = new Date(right.last_message_at || right.created_at || 0).getTime();
      return rightTime - leftTime;
    });
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

  // GÃ©nÃ©ration automatique d'une notification pour le destinataire du message
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
    } else if (conversation.conversationType === 'garage_vendeur') {
      const garageUserId = conversation.garage?.user_id ? Number(conversation.garage.user_id) : null;
      const vendeurUserId = conversation.vendeur ? Number(conversation.vendeur.id) : null;
      if (senderId === garageUserId) recipientUserId = vendeurUserId;
      else recipientUserId = garageUserId;
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



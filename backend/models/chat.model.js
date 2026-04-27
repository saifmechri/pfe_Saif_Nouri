const { pool } = require('../db');

const BASE_CONVERSATION_SELECT = `
  SELECT
    c.id,
    c.conversation_type,
    c.automobiliste_user_id,
    c.garage_id,
    c.vendeur_user_id,
    c.created_by_user_id,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    a.name AS automobiliste_name,
    a.email AS automobiliste_email,
    g.name AS garage_name,
    g.user_id AS garage_user_id,
    v.name AS vendeur_name,
    v.email AS vendeur_email,
    v.store_name AS vendeur_store_name
  FROM chat_conversations c
  JOIN users a ON a.id = c.automobiliste_user_id
  LEFT JOIN garages g ON g.id = c.garage_id
  LEFT JOIN users v ON v.id = c.vendeur_user_id
`;

const findConversationById = async (conversationId) => {
  const result = await pool.query(
    `${BASE_CONVERSATION_SELECT} WHERE c.id = $1 LIMIT 1`,
    [conversationId]
  );

  return result.rows[0] || null;
};

const findConversationByParticipants = async ({ conversationType, automobilisteUserId, garageId, vendeurUserId }) => {
  if (conversationType === 'automobiliste_garage') {
    const result = await pool.query(
      `${BASE_CONVERSATION_SELECT}
       WHERE c.conversation_type = 'automobiliste_garage'
         AND c.automobiliste_user_id = $1
         AND c.garage_id = $2
       LIMIT 1`,
      [automobilisteUserId, garageId]
    );

    return result.rows[0] || null;
  }

  const result = await pool.query(
    `${BASE_CONVERSATION_SELECT}
     WHERE c.conversation_type = 'automobiliste_vendeur'
       AND c.automobiliste_user_id = $1
       AND c.vendeur_user_id = $2
     LIMIT 1`,
    [automobilisteUserId, vendeurUserId]
  );

  return result.rows[0] || null;
};

const createConversation = async ({ conversationType, automobilisteUserId, garageId, vendeurUserId, createdByUserId }) => {
  const result = await pool.query(
    `INSERT INTO chat_conversations (
       conversation_type,
       automobiliste_user_id,
       garage_id,
       vendeur_user_id,
       created_by_user_id,
       last_message_at,
       created_at,
       updated_at
     )
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id`,
    [conversationType, automobilisteUserId, garageId || null, vendeurUserId || null, createdByUserId]
  );

  return findConversationById(result.rows[0].id);
};

const listConversationsForAutomobiliste = async (automobilisteUserId, limit, offset) => {
  const result = await pool.query(
    `${BASE_CONVERSATION_SELECT}
     WHERE c.automobiliste_user_id = $1
     ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
     LIMIT $2
     OFFSET $3`,
    [automobilisteUserId, limit, offset]
  );

  return result.rows;
};

const listConversationsForGarageUser = async (garageUserId, limit, offset) => {
  const result = await pool.query(
    `${BASE_CONVERSATION_SELECT}
     WHERE c.conversation_type = 'automobiliste_garage'
       AND g.user_id = $1
     ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
     LIMIT $2
     OFFSET $3`,
    [garageUserId, limit, offset]
  );

  return result.rows;
};

const listConversationsForVendeur = async (vendeurUserId, limit, offset) => {
  const result = await pool.query(
    `${BASE_CONVERSATION_SELECT}
     WHERE c.conversation_type = 'automobiliste_vendeur'
       AND c.vendeur_user_id = $1
     ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
     LIMIT $2
     OFFSET $3`,
    [vendeurUserId, limit, offset]
  );

  return result.rows;
};

const listConversationsForAdmin = async (limit, offset) => {
  const result = await pool.query(
    `${BASE_CONVERSATION_SELECT}
     ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
     LIMIT $1
     OFFSET $2`,
    [limit, offset]
  );

  return result.rows;
};

const createMessage = async ({ conversationId, senderUserId, message, clientMessageId }) => {
  const result = await pool.query(
    `INSERT INTO chat_messages (
       conversation_id,
       sender_user_id,
       content,
       client_message_id,
       created_at
     )
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     RETURNING id, conversation_id, sender_user_id, content, client_message_id, created_at`,
    [conversationId, senderUserId, message, clientMessageId || null]
  );

  return result.rows[0] || null;
};

const touchConversation = async (conversationId) => {
  await pool.query(
    `UPDATE chat_conversations
     SET last_message_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [conversationId]
  );
};

const listMessagesByConversation = async ({ conversationId, limit, beforeMessageId }) => {
  const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 30));

  if (beforeMessageId) {
    const result = await pool.query(
      `WITH anchor AS (
         SELECT id, created_at
         FROM chat_messages
         WHERE id = $1 AND conversation_id = $2
       )
       SELECT
         m.id,
         m.conversation_id,
         m.sender_user_id,
         m.content,
         m.client_message_id,
         m.created_at,
         u.name AS sender_name,
         u.email AS sender_email,
         r.name AS sender_role
       FROM chat_messages m
       JOIN users u ON u.id = m.sender_user_id
       JOIN roles r ON r.id = u.role_id
       JOIN anchor a ON true
       WHERE m.conversation_id = $2
         AND (m.created_at < a.created_at OR (m.created_at = a.created_at AND m.id < a.id))
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT $3`,
      [beforeMessageId, conversationId, safeLimit]
    );

    return result.rows;
  }

  const result = await pool.query(
    `SELECT
       m.id,
       m.conversation_id,
       m.sender_user_id,
       m.content,
       m.client_message_id,
       m.created_at,
       u.name AS sender_name,
       u.email AS sender_email,
       r.name AS sender_role
     FROM chat_messages m
     JOIN users u ON u.id = m.sender_user_id
     JOIN roles r ON r.id = u.role_id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT $2`,
    [conversationId, safeLimit]
  );

  return result.rows;
};

const findUserByIdWithRole = async (userId) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.store_name, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
};

module.exports = {
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
};

/**
 * CHAT SERVICE
 * 
 * Real-time messaging between users and garages.
 * Features: conversations, messages, real-time updates via Supabase
 */

import API from "./api";
import { getSupabaseClient } from "./supabaseClient";

export const fetchChatContacts = (params = {}) => {
  return API.get("/chat/contacts", { params });
};

export const fetchChatConversations = (params = {}) => {
  return API.get("/chat/conversations", { params });
};

export const startChatConversation = (payload = {}) => {
  return API.post("/chat/conversations/start", payload);
};

export const fetchConversationMessages = (conversationId, params = {}) => {
  return API.get(`/chat/conversations/${conversationId}/messages`, { params });
};

export const sendConversationMessage = (conversationId, payload = {}) => {
  return API.post(`/chat/conversations/${conversationId}/messages`, payload);
};

export const mapRealtimeMessageToUiMessage = (row, { currentUser, conversation } = {}) => {
  if (!row) {
    return null;
  }

  const senderUserId = Number(row.sender_user_id);
  const currentUserId = Number(currentUser?.id);
  const isMine = Number.isInteger(senderUserId) && Number.isInteger(currentUserId) && senderUserId === currentUserId;

  const counterpart = conversation?.counterpart || {};
  const counterpartUserId = Number(counterpart.user_id || counterpart.id);

  const sender = isMine
    ? {
        id: Number(currentUser.id),
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role
      }
    : {
        id: Number.isInteger(counterpartUserId) && counterpartUserId > 0 ? counterpartUserId : senderUserId,
        name: counterpart.name || "Contact",
        email: counterpart.email || "",
        role: counterpart.role || "automobiliste"
      };

  return {
    id: Number(row.id),
    conversationId: Number(row.conversation_id),
    sender,
    message: row.content || row.message || "",
    clientMessageId: row.client_message_id || null,
    createdAt: row.created_at
  };
};

export const subscribeToConversationMessages = ({ conversationId, onInsert, onError }) => {
  const normalizedConversationId = Number(conversationId);
  if (!Number.isInteger(normalizedConversationId) || normalizedConversationId <= 0) {
    throw new Error("conversationId invalide pour la subscription realtime.");
  }

  const supabase = getSupabaseClient();
  const channel = supabase
    .channel(`chat-messages-${normalizedConversationId}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${normalizedConversationId}`
      },
      (payload) => {
        onInsert?.(payload.new);
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        onError?.(new Error("Erreur de subscription Supabase Realtime."));
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};

export const extractItems = (response) => {
  const payload = response?.data?.data ?? response?.data;
  return Array.isArray(payload?.items) ? payload.items : [];
};

export const extractConversationAndMessages = (response) => {
  const payload = response?.data?.data ?? response?.data;
  return {
    conversation: payload?.conversation || null,
    messages: Array.isArray(payload?.messages) ? payload.messages : []
  };
};

export const extractConversationAndMessage = (response) => {
  const payload = response?.data?.data ?? response?.data;
  return {
    conversation: payload?.conversation || null,
    message: payload?.message || null
  };
};



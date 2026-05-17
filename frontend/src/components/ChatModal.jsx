import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Search, Loader } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import {
  extractConversationAndMessages,
  extractConversationAndMessage,
  extractItems,
  fetchChatContacts,
  fetchChatConversations,
  fetchConversationMessages,
  mapRealtimeMessageToUiMessage,
  sendConversationMessage,
  startChatConversation,
  subscribeToConversationMessages
} from "../services/chat";

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const roleColors = {
  automobiliste: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  garage: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  vendeur: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" }
};

const roleLabels = {
  automobiliste: "Automobiliste",
  garage: "Garage",
  vendeur: "Vendeur"
};

const ChatModal = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const realtimeUnsubscribeRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [contactsQuery, setContactsQuery] = useState("");
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState("");

  const [conversations, setConversations] = useState([]);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [isChatReady, setIsChatReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");

  const selectedConversation = useMemo(
    () => conversations.find((item) => Number(item.id) === Number(selectedConversationId)) || null,
    [conversations, selectedConversationId]
  );

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  const selectedMessages = useMemo(
    () => messagesByConversation[selectedConversationId] || [],
    [messagesByConversation, selectedConversationId]
  );

  const upsertConversation = useCallback((conversation) => {
    setConversations((prev) => {
      const next = [...prev];
      const index = next.findIndex((item) => Number(item.id) === Number(conversation.id));

      if (index >= 0) {
        next[index] = { ...next[index], ...conversation };
      } else {
        next.push(conversation);
      }

      next.sort((a, b) => {
        const first = new Date(a.lastMessageAt || a.updatedAt || a.createdAt).getTime();
        const second = new Date(b.lastMessageAt || b.updatedAt || b.createdAt).getTime();
        return second - first;
      });

      return next;
    });
  }, []);

  const loadContacts = useCallback(async (queryValue = "") => {
    setContactsLoading(true);
    setContactsError("");

    try {
      const response = await fetchChatContacts({ q: queryValue, limit: 30 });
      const items = Array.isArray(response?.data?.data?.items) ? response.data.data.items : [];
      setContacts(items);
    } catch (error) {
      setContactsError(error?.response?.data?.message || "Impossible de charger les contacts.");
    } finally {
      setContactsLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetchChatConversations({ limit: 50, offset: 0 });
      const items = extractItems(response);
      setConversations(items);
    } catch (error) {
      setChatError(error?.response?.data?.message || "Impossible de recuperer les conversations.");
    }
  }, []);

  const loadMessagesForConversation = useCallback(
    async (conversationId, limit = 50) => {
      if (!conversationId) return;

      try {
        const response = await fetchConversationMessages(conversationId, { limit });
        const { conversation, messages } = extractConversationAndMessages(response);

        setMessagesByConversation((prev) => ({
          ...prev,
          [Number(conversationId)]: messages
        }));

        if (conversation) {
          upsertConversation(conversation);
        }
      } catch (error) {
        setChatError(error?.response?.data?.message || "Impossible de charger la conversation.");
      }
    },
    [upsertConversation]
  );

  useEffect(() => {
    if (!isOpen) return;

    const runInit = async () => {
      setChatError("");
      setIsChatReady(false);

      try {
        await Promise.all([loadConversations(), loadContacts("")]);
        setIsChatReady(true);
      } catch {
        setIsChatReady(false);
      }
    };

    runInit();

    return () => {
      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current();
        realtimeUnsubscribeRef.current = null;
      }
    };
  }, [isOpen, loadContacts, loadConversations]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedMessages]);

  useEffect(() => {
    if (!selectedConversationId) return;
    loadMessagesForConversation(selectedConversationId, 50);
  }, [loadMessagesForConversation, selectedConversationId]);

  useEffect(() => {
    if (!isOpen || !selectedConversationId) {
      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current();
        realtimeUnsubscribeRef.current = null;
      }
      return;
    }

    if (realtimeUnsubscribeRef.current) {
      realtimeUnsubscribeRef.current();
      realtimeUnsubscribeRef.current = null;
    }

    try {
      const unsubscribe = subscribeToConversationMessages({
        conversationId: Number(selectedConversationId),
        onInsert: (insertedMessage) => {
          const conversation = selectedConversationRef.current;
          const uiMessage = mapRealtimeMessageToUiMessage(insertedMessage, {
            currentUser: user,
            conversation
          });

          if (uiMessage) {
            setMessagesByConversation((prev) => {
              const conversationKey = Number(selectedConversationId);
              const currentMessages = prev[conversationKey] || [];

              if (currentMessages.some((item) => Number(item.id) === Number(uiMessage.id))) {
                return prev;
              }

              return {
                ...prev,
                [conversationKey]: [...currentMessages, uiMessage]
              };
            });
          }

          upsertConversation({ id: Number(selectedConversationId), lastMessageAt: insertedMessage?.created_at });
        },
        onError: (error) => {
          setChatError(error.message || "Realtime indisponible.");
          setIsChatReady(false);
        }
      });

      realtimeUnsubscribeRef.current = unsubscribe;
      setIsChatReady(true);
    } catch (error) {
      setChatError(error.message || "Supabase Realtime non configure.");
      setIsChatReady(false);
    }

    return () => {
      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current();
        realtimeUnsubscribeRef.current = null;
      }
    };
  }, [isOpen, selectedConversationId, upsertConversation, user]);

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    await loadContacts(contactsQuery);
  };

  const handleStartConversation = async (contact) => {
    setChatError("");

    try {
      const response = await startChatConversation({
        conversationType: contact.conversationType,
        ...contact.startPayload,
        historyLimit: 50
      });

      const { conversation, messages } = extractConversationAndMessages(response);

      if (conversation) {
        upsertConversation(conversation);
        setSelectedConversationId(conversation.id);
        setActiveTab("messages");
      }

      if (Array.isArray(messages) && conversation) {
        setMessagesByConversation((prev) => ({
          ...prev,
          [Number(conversation.id)]: messages
        }));
      }
    } catch (error) {
      setChatError(error?.response?.data?.message || "Impossible de demarrer la conversation.");
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!selectedConversationId || !messageInput.trim()) return;

    setIsSending(true);
    setChatError("");

    try {
      const response = await sendConversationMessage(Number(selectedConversationId), {
        message: messageInput.trim(),
        clientMessageId: `web-${Date.now()}`
      });

      const { conversation, message } = extractConversationAndMessage(response);

      if (message) {
        setMessagesByConversation((prev) => {
          const conversationKey = Number(selectedConversationId);
          const currentMessages = prev[conversationKey] || [];

          if (currentMessages.some((item) => Number(item.id) === Number(message.id))) {
            return prev;
          }

          return {
            ...prev,
            [conversationKey]: [...currentMessages, message]
          };
        });
      }

      if (conversation) {
        upsertConversation(conversation);
      }

      setMessageInput("");
    } catch (error) {
      setChatError(error?.response?.data?.message || "Echec envoi message.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="h-full w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col sm:h-[90vh] sm:max-h-[800px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5" />
            <h2 className="text-lg font-bold">Messagerie</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-white/20 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {chatError && (
          <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {chatError}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={() => setActiveTab("contacts")}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === "contacts"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Rechercher
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("messages")}
            className={`px-4 py-2 font-semibold transition ${
              activeTab === "messages"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Conversations
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Contacts Tab */}
          {activeTab === "contacts" && (
            <div className="p-5 space-y-4">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={contactsQuery}
                  onChange={(event) => setContactsQuery(event.target.value)}
                  placeholder="Cherchez un garage ou un vendeur..."
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="submit"
                  disabled={contactsLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {contactsLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </button>
              </form>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {contactsLoading && (
                  <div className="flex justify-center py-4">
                    <Loader className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                )}

                {!contactsLoading && contacts.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-4">
                    {contactsQuery ? "Aucun contact trouvé." : "Tapez pour chercher des contacts."}
                  </p>
                )}

                {!contactsLoading &&
                  contacts.map((contact) => {
                    const colorScheme = roleColors[contact.role] || roleColors.automobiliste;
                    return (
                      <button
                        type="button"
                        key={`${contact.role}-${contact.id}`}
                        onClick={() => handleStartConversation(contact)}
                        className={`w-full rounded-lg border ${colorScheme.border} ${colorScheme.bg} p-3 text-left transition hover:shadow-md active:scale-95`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{contact.label}</p>
                            <p className={`text-xs font-medium ${colorScheme.text}`}>
                              {roleLabels[contact.role]}
                            </p>
                            {contact.subtitle && (
                              <p className="mt-1 text-xs text-slate-600">{contact.subtitle}</p>
                            )}
                          </div>
                          <div className="text-xl">ðŸ’¬</div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <div className="flex flex-col h-full">
              {selectedConversation ? (
                <>
                  {/* Messages Area */}
                  <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                    {selectedMessages.length === 0 && (
                      <div className="flex h-full items-center justify-center text-center">
                        <p className="text-sm text-slate-500">Commencez la conversation...</p>
                      </div>
                    )}

                    {selectedMessages.map((item) => {
                      const isMine = Number(item?.sender?.id) === Number(user?.id);
                      return (
                        <div key={item.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                              isMine
                                ? "rounded-br-none bg-blue-600 text-white"
                                : "rounded-bl-none bg-white text-slate-900 border border-slate-200"
                            }`}
                          >
                            {!isMine && (
                              <p className="mb-1 text-xs font-semibold text-slate-600">
                                {item?.sender?.name}
                              </p>
                            )}
                            <p>{item.message}</p>
                            <p
                              className={`mt-1 text-xs ${
                                isMine ? "text-blue-100" : "text-slate-500"
                              }`}
                            >
                              {formatTime(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-4 flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(event) => setMessageInput(event.target.value)}
                      placeholder="Ecrire un message..."
                      disabled={isSending}
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim() || isSending}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2"
                    >
                      {isSending ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-600">Selectionnez une conversation</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversations List (Side Panel in Messages Tab) */}
        {activeTab === "messages" && conversations.length > 0 && (
          <div className="hidden sm:block border-l border-slate-200 w-64 max-h-80 overflow-y-auto bg-slate-50">
            <div className="p-3 border-b border-slate-200 bg-white font-semibold text-sm">
              Conversations
            </div>
            <div className="space-y-1 p-2">
              {conversations.map((conversation) => {
                const counterpart = conversation.counterpart || {};
                const isActive = Number(selectedConversationId) === Number(conversation.id);
                const colorScheme = roleColors[counterpart.role] || roleColors.automobiliste;

                return (
                  <button
                    type="button"
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full rounded-lg p-2 text-left text-xs transition ${
                      isActive
                        ? `${colorScheme.bg} ${colorScheme.border} border`
                        : "hover:bg-slate-100"
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{counterpart.name || "Contact"}</p>
                    <p className="text-slate-500">{formatTime(conversation.lastMessageAt)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedConversation && (
          <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
            {selectedConversation.counterpart?.phone && <p>Téléphone: {selectedConversation.counterpart.phone}</p>}
            {selectedConversation.counterpart?.email && <p>Email: {selectedConversation.counterpart.email}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatModal;



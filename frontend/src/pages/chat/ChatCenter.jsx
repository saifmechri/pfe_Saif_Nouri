import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PlatformLayout from "../../components/PlatformLayout";
import { AuthContext } from "../../context/AuthContext";
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
} from "../../services/chat";

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const humanRole = {
  automobiliste: "Automobiliste",
  garage: "Garage",
  vendeur: "Vendeur",
  admin: "Administrateur"
};

const ChatCenter = () => {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const realtimeUnsubscribeRef = useRef(null);
  const selectedConversationRef = useRef(null);
  const requestedConversationId = useMemo(() => {
    const value = Number.parseInt(searchParams.get("conversationId"), 10);
    return Number.isInteger(value) && value > 0 ? value : null;
  }, [searchParams]);

  const [contactsQuery, setContactsQuery] = useState("");
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState("");

  const [conversations, setConversations] = useState([]);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [selectedConversationId, setSelectedConversationId] = useState(requestedConversationId);
  const [messageInput, setMessageInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [isChatReady, setIsChatReady] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((item) => Number(item.id) === Number(selectedConversationId)) || null,
    [conversations, selectedConversationId]
  );

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    if (requestedConversationId) {
      setSelectedConversationId(requestedConversationId);
    }
  }, [requestedConversationId]);

  const selectedMessages = useMemo(
    () => messagesByConversation[selectedConversationId] || [],
    [messagesByConversation, selectedConversationId]
  );

  const messagesContainerRef = useRef(null);

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

  const appendMessageToConversation = useCallback((conversationId, message) => {
    setMessagesByConversation((prev) => {
      const conversationKey = Number(conversationId);
      const currentMessages = prev[conversationKey] || [];

      if (currentMessages.some((item) => Number(item.id) === Number(message.id))) {
        return prev;
      }

      return {
        ...prev,
        [conversationKey]: [...currentMessages, message]
      };
    });
  }, []);

  const loadContacts = useCallback(async (queryValue = "") => {
    setContactsLoading(true);
    setContactsError("");

    try {
      const response = await fetchChatContacts({ q: queryValue, limit: 20 });
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
      if (!requestedConversationId && !selectedConversationId && items.length > 0) {
        setSelectedConversationId(items[0].id);
      }
    } catch (error) {
      setChatError(error.message || "Impossible de recuperer les conversations.");
    }
  }, [requestedConversationId, selectedConversationId]);

  const loadMessagesForConversation = useCallback(
    async (conversationId, limit = 50) => {
      if (!conversationId) {
        return;
      }

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
        setChatError(error?.response?.data?.message || "Impossible de charger cette conversation.");
      }
    },
    [upsertConversation]
  );

  useEffect(() => {
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
  }, [loadContacts, loadConversations]);

  useEffect(() => {
    loadContacts("");
  }, [loadContacts]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    loadMessagesForConversation(selectedConversationId, 50);
  }, [loadMessagesForConversation, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
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
            appendMessageToConversation(selectedConversationId, uiMessage);
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
  }, [appendMessageToConversation, selectedConversationId, upsertConversation, user]);

  // Auto-scroll to bottom when messages change for the selected conversation
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // small delay to ensure DOM updated
    const t = setTimeout(() => {
      try {
        container.scrollTop = container.scrollHeight;
      } catch (e) {
        // ignore
      }
    }, 50);

    return () => clearTimeout(t);
  }, [selectedMessages.length, selectedConversationId]);

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
    if (!selectedConversationId || !messageInput.trim()) {
      return;
    }

    setIsSending(true);
    setChatError("");

    try {
      const response = await sendConversationMessage(Number(selectedConversationId), {
        message: messageInput.trim(),
        clientMessageId: `web-${Date.now()}`
      });

      const { conversation, message } = extractConversationAndMessage(response);
      if (message) {
        appendMessageToConversation(selectedConversationId, message);
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

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-transparent px-4 py-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <div className="rounded-2xl border border-[#d4deef] bg-[linear-gradient(130deg,#ffffff_0%,#f3f7ff_46%,#eef5ff_100%)] p-5 shadow-[0_16px_40px_rgba(12,40,88,0.12)]">
            <h1 className="text-2xl font-extrabold text-[#0f2450]">Messagerie temps reel</h1>
            <p className="mt-1 text-sm text-[#526482]">
              Role: <span className="font-semibold text-[#1d4ed8]">{humanRole[user?.role] || "Utilisateur"}</span> | Etat realtime: {isChatReady ? "Actif" : "Inactif"}
            </p>
          </div>

          {chatError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {chatError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[330px_360px_minmax(0,1fr)]">
            <section className="vb-card p-4">
              <h2 className="text-lg font-bold text-[#1a2b4b]">Rechercher un contact</h2>
              <form onSubmit={handleSearchSubmit} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={contactsQuery}
                  onChange={(event) => setContactsQuery(event.target.value)}
                  placeholder="Nom, email, magasin..."
                  className="vb-input flex-1 px-3 py-2 text-sm"
                />
                <button type="submit" className="rounded-lg bg-[#1d4ed8] px-3 py-2 text-sm font-semibold text-white hover:bg-[#173ea9]">
                  Chercher
                </button>
              </form>

              {contactsError && <p className="mt-3 text-sm text-red-600">{contactsError}</p>}

              <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {contactsLoading && <p className="text-sm text-[#617089]">Chargement des contacts...</p>}
                {!contactsLoading && contacts.length === 0 && (
                  <p className="text-sm text-[#617089]">Aucun contact disponible.</p>
                )}

                {!contactsLoading &&
                  contacts.map((contact) => (
                    <button
                      type="button"
                      key={`${contact.role}-${contact.id}`}
                      onClick={() => handleStartConversation(contact)}
                      className="w-full rounded-lg border border-[#d6e0f0] bg-white px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-[#9bb7ea] hover:shadow-[0_6px_18px_rgba(23,62,169,0.12)]"
                    >
                      <p className="text-sm font-bold text-[#102449]">{contact.label}</p>
                      <p className="text-xs uppercase tracking-[0.08em] text-[#3e5d95]">{humanRole[contact.role] || contact.role}</p>
                      {contact.subtitle && <p className="mt-1 text-xs text-[#617089]">{contact.subtitle}</p>}
                    </button>
                  ))}
              </div>
            </section>

            <section className="vb-card p-4">
              <h2 className="text-lg font-bold text-[#1a2b4b]">Conversations</h2>
              <div className="mt-4 max-h-[570px] space-y-2 overflow-y-auto pr-1">
                {conversations.length === 0 && <p className="text-sm text-[#617089]">Aucune conversation pour le moment.</p>}

                {conversations.map((conversation) => {
                  const counterpart = conversation.counterpart || {};
                  const isActive = Number(selectedConversationId) === Number(conversation.id);
                  return (
                    <button
                      type="button"
                      key={conversation.id}
                      onClick={() => setSelectedConversationId(conversation.id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                        isActive
                          ? "border-[#2c61d6] bg-[#eaf1ff] shadow-[inset_0_0_0_1px_rgba(44,97,214,0.35)]"
                          : "border-[#d6e0f0] bg-white hover:border-[#9bb7ea]"
                      }`}
                    >
                      <p className="text-sm font-bold text-[#12223d]">{counterpart.name || "Contact"}</p>
                      <p className="text-xs uppercase tracking-[0.08em] text-[#4b6aa2]">{humanRole[counterpart.role] || counterpart.role || "-"}</p>
                      <p className="mt-1 text-xs text-[#64748b]">Maj: {formatTime(conversation.lastMessageAt)}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="vb-card flex min-h-[620px] flex-col p-4">
              <div className="border-b border-[#d6e0f0] pb-3">
                <h2 className="text-lg font-bold text-[#1a2b4b]">
                  {selectedConversation ? selectedConversation.counterpart?.name || "Conversation" : "Selectionnez une conversation"}
                </h2>
                {selectedConversation?.counterpart?.role && (
                  <p className="text-xs uppercase tracking-[0.08em] text-[#4b6aa2]">
                    {humanRole[selectedConversation.counterpart.role]}
                  </p>
                )}
                {selectedConversation?.counterpart && (
                  <div className="mt-1 space-y-0.5 text-xs text-[#617089]">
                    {selectedConversation.counterpart.phone && <p>Téléphone: {selectedConversation.counterpart.phone}</p>}
                    {selectedConversation.counterpart.email && <p>Email: {selectedConversation.counterpart.email}</p>}
                  </div>
                )}
              </div>

              <div ref={messagesContainerRef} className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-lg bg-[#f8fbff] p-3">
                {selectedConversation && selectedMessages.length === 0 && (
                  <p className="text-sm text-[#617089]">Commencez la discussion avec votre contact.</p>
                )}

                {!selectedConversation && <p className="text-sm text-[#617089]">Choisissez une conversation a droite.</p>}

                {selectedMessages.map((item) => {
                  const isMine = Number(item?.sender?.id) === Number(user?.id);
                  return (
                    <div key={item.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          isMine ? "bg-[#1d4ed8] text-white" : "bg-white text-[#1f2b3f]"
                        }`}
                      >
                        {!isMine && <p className="mb-1 text-[11px] font-semibold text-[#4b6aa2]">{item?.sender?.name || "Contact"}</p>}
                        <p>{item.message}</p>
                        <p className={`mt-1 text-[11px] ${isMine ? "text-blue-100" : "text-[#7b8aa3]"}`}>{formatTime(item.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  placeholder={selectedConversation ? "Ecrire un message..." : "Selectionnez une conversation"}
                  disabled={!selectedConversation || isSending}
                  className="vb-input flex-1 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={!selectedConversation || !messageInput.trim() || isSending}
                  className="rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSending ? "Envoi..." : "Envoyer"}
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
};

export default ChatCenter;



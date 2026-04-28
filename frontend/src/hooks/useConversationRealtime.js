import { useEffect } from "react";
import { subscribeToConversationMessages, mapRealtimeMessageToUiMessage } from "../services/chat";

/**
 * Hook to subscribe to new messages for a conversation and update local state.
 * @param {number|string} conversationId
 * @param {function} setMessages - React state setter for messages (functional update recommended)
 * @param {object} options - optional callbacks { onError, currentUser, conversation }
 */
export function useConversationRealtime(conversationId, setMessages, options = {}) {
  useEffect(() => {
    const { onError, currentUser, conversation } = options || {};

    const id = Number(conversationId);
    if (!Number.isInteger(id) || id <= 0) return undefined;

    const unsubscribe = subscribeToConversationMessages({
      conversationId: id,
      onInsert: (row) => {
        try {
          const uiMessage = mapRealtimeMessageToUiMessage(row, { currentUser, conversation });
          if (!uiMessage) return;
          setMessages((prev) => [...prev, uiMessage]);
        } catch (err) {
          console.error("Error mapping realtime message:", err);
        }
      },
      onError: (err) => {
        console.error("Realtime subscription error:", err);
        onError?.(err);
      }
    });

    return () => {
      try {
        unsubscribe?.();
      } catch (err) {
        // ignore cleanup errors
      }
    };
  }, [conversationId, setMessages, options]);
}

export default useConversationRealtime;

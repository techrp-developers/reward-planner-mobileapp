import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchConversations } from '../api/chatApi';
import { chatSocket } from '../services/chatSocket';
import type { ChatSocketEvent } from '../types';

// Socket events after which the total unread count may have changed.
const REFRESH_EVENTS = new Set<ChatSocketEvent['type']>([
  'message:new',
  'message:read',
  'message:deleted',
  'conversation:available',
  'resync',
]);

const REFRESH_DEBOUNCE_MS = 500;

// Total unread chat messages across all conversations, kept live via the chat socket.
export function useChatUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const conversations = await fetchConversations();
      const total = conversations.reduce((sum, c) => sum + (Number(c.unread_count) || 0), 0);
      setCount(prev => (prev === total ? prev : total));
    } catch { }
  }, []);

  // Refetch whenever the screen regains focus, e.g. returning from the chat inbox.
  useFocusEffect(
    useCallback(() => {
      if (enabled) refresh();
    }, [enabled, refresh]),
  );

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    const unsubscribe = chatSocket.subscribe(event => {
      if (!REFRESH_EVENTS.has(event.type)) return;
      // Bursts of events (e.g. a resync) collapse into a single request.
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(refresh, REFRESH_DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled, refresh]);

  return count;
}

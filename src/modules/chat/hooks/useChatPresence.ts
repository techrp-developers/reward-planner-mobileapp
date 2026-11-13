import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { fetchChatPresence } from '../api/chatApi';
import { chatSocket } from '../services/chatSocket';

export function useChatPresence(userId?: number) {
  const [online, setOnline] = useState<boolean | null>(null);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let revision = 0;
    let fetching = false;
    setOnline(userId && chatSocket.isConnected() ? chatSocket.isUserOnline(userId) : null);
    setLastSeenAt(null);
    if (!userId) return;

    const refresh = async () => {
      if (fetching || AppState.currentState === 'background') return;
      fetching = true;
      const startedAtRevision = revision;
      try {
        const [presence] = await fetchChatPresence([userId]);
        // A socket event received during this request is newer than its snapshot.
        if (active && revision === startedAtRevision && presence) {
          // REST can reach a different server worker, whose socket registry does
          // not contain this peer. Keep a live socket's online observation until
          // it receives an offline event or our connection is lost.
          const liveOnline = chatSocket.isConnected() && chatSocket.isUserOnline(userId);
          setOnline(liveOnline || presence.online);
          setLastSeenAt(liveOnline || presence.online ? null : presence.last_seen_at || null);
        }
      } catch {
        // Keep the most recent known state on a transient request failure.
      } finally {
        fetching = false;
      }
    };

    const unsubscribe = chatSocket.subscribe(event => {
      if (event.type === 'connected') {
        revision += 1;
        setOnline(chatSocket.isUserOnline(userId));
        if (chatSocket.isUserOnline(userId)) setLastSeenAt(null);
      } else if (event.type === 'presence' && Number(event.data?.user_id) === Number(userId)) {
        revision += 1;
        setOnline(Boolean(event.data.online));
        setLastSeenAt(event.data.last_seen_at || null);
      } else if (event.type === 'disconnected') {
        revision += 1;
        setOnline(null);
      } else if (event.type === 'resync') {
        refresh();
      }
    });
    refresh();
    // Recover missed presence events even when the socket remains connected.
    const interval = setInterval(refresh, 15000);
    return () => {
      active = false;
      clearInterval(interval);
      unsubscribe();
    };
  }, [userId]);

  return { online, lastSeenAt };
}

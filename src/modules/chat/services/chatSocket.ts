import { AppState } from 'react-native';
import api, { getSessionAccessToken } from '../../common/auth/api/axios';
import { decodeJwtPayload, isTokenExpiringSoon } from '../../common/auth/utils/jwtUtils';
import { CHAT_API_BASE_URL, CHAT_SOCKET_URL } from '../../../config/apiConfig';
import type { ChatSocketEvent } from '../types';

type Listener = (event: ChatSocketEvent) => void;

class ChatSocketClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private retry: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private token: string | null = null;
  private manuallyClosed = false;
  private hasConnected = false;
  // Company-wide online user IDs, kept from `connected` and `presence` events so
  // screens opened after the socket connected still know who is online.
  private onlineIds = new Set<number>();

  constructor() {
    AppState.addEventListener('change', state => {
      if (!this.token || this.manuallyClosed) return;
      // Close the socket in the background so coworkers see this user go
      // offline (and get an accurate last seen) instead of a stale "online".
      if (state === 'background') {
        this.closeSocket();
        return;
      }
      if (state !== 'active') return;
      // On return, reconnect immediately and ask open screens to re-sync missed messages.
      if (this.socket?.readyState !== WebSocket.OPEN && this.socket?.readyState !== WebSocket.CONNECTING) {
        this.reconnectNow();
      }
      this.emit({ type: 'resync', data: null });
    });
  }

  connect(token: string) {
    if (this.token === token && (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING)) return;
    this.closeSocket();
    this.token = token;
    this.manuallyClosed = false;
    if (AppState.currentState === 'background') return;
    const socket = new WebSocket(`${CHAT_SOCKET_URL}?token=${encodeURIComponent(token)}`);
    this.socket = socket;
    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.retryCount = 0;
      // Anything sent while we were disconnected never reached this client.
      if (this.hasConnected) this.emit({ type: 'resync', data: null });
      this.hasConnected = true;
    };
    socket.onmessage = message => {
      if (this.socket !== socket) return;
      let event: ChatSocketEvent;
      try {
        event = JSON.parse(String(message.data)) as ChatSocketEvent;
      } catch {
        return;
      }
      this.trackPresence(event);
      this.emit(event);
    };
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.onlineIds.clear();
      this.emit({ type: 'disconnected', data: null });
      if (!this.manuallyClosed && this.token) {
        const delay = Math.min(1000 * 2 ** this.retryCount++, 15000);
        this.retry = setTimeout(() => this.reconnectNow(), delay);
      }
    };
  }

  disconnect() {
    this.manuallyClosed = true;
    this.hasConnected = false;
    this.token = null;
    this.closeSocket();
  }

  isUserOnline(userId?: number | null) {
    return userId != null && this.onlineIds.has(Number(userId));
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // Ask open chat screens to refetch, e.g. when a chat push arrives in the foreground.
  requestResync() {
    this.emit({ type: 'resync', data: null });
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  send(type: string, conversationId: number, data: Record<string, unknown> = {}) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify({ type, conversation_id: conversationId, ...data }));
    return true;
  }

  private trackPresence(event: ChatSocketEvent) {
    if (event.type === 'connected') {
      this.onlineIds = new Set((event.data?.online_user_ids || []).map(Number));
    } else if (event.type === 'presence' && event.data?.user_id != null) {
      if (event.data.online) this.onlineIds.add(Number(event.data.user_id));
      else this.onlineIds.delete(Number(event.data.user_id));
    }
  }

  private emit(event: ChatSocketEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  private closeSocket() {
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    const socket = this.socket;
    this.socket = null;
    this.onlineIds.clear();
    socket?.close();
    if (socket) this.emit({ type: 'disconnected', data: null });
  }

  private async reconnectNow() {
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    let token = getSessionAccessToken() || this.token;
    // The server only checks the JWT during the WebSocket upgrade, so reconnecting
    // with an expired 15 minute access token is rejected. Any authenticated
    // request makes the axios interceptor rotate it first.
    if (token && isTokenExpiringSoon(token, 30_000)) {
      const userId = decodeJwtPayload(token)?.user_id;
      if (userId) {
        await api.get(`${CHAT_API_BASE_URL}/v1/chat/presence`, { params: { user_ids: userId } }).catch(() => {});
      }
      token = getSessionAccessToken() || token;
    }
    if (!token || this.manuallyClosed || AppState.currentState === 'background') return;
    this.token = null; // force connect() to open a fresh socket
    this.connect(token);
  }
}

export const chatSocket = new ChatSocketClient();

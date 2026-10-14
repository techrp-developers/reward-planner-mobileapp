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

  constructor() {
    // Sockets can die silently while the app is backgrounded. On return,
    // reconnect immediately and ask open screens to re-sync missed messages.
    AppState.addEventListener('change', state => {
      if (state !== 'active' || !this.token || this.manuallyClosed) return;
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
    const socket = new WebSocket(`${CHAT_SOCKET_URL}?token=${encodeURIComponent(token)}`);
    this.socket = socket;
    socket.onopen = () => {
      this.retryCount = 0;
      // Anything sent while we were disconnected never reached this client.
      if (this.hasConnected) this.emit({ type: 'resync', data: null });
      this.hasConnected = true;
    };
    socket.onmessage = message => {
      try {
        this.emit(JSON.parse(String(message.data)) as ChatSocketEvent);
      } catch {}
    };
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
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

  private emit(event: ChatSocketEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  private closeSocket() {
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    const socket = this.socket;
    this.socket = null;
    socket?.close();
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
    if (!token || this.manuallyClosed) return;
    this.token = null; // force connect() to open a fresh socket
    this.connect(token);
  }
}

export const chatSocket = new ChatSocketClient();

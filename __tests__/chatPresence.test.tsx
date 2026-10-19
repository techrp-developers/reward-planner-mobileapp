import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { fetchChatPresence } from '../src/modules/chat/api/chatApi';
import { chatSocket } from '../src/modules/chat/services/chatSocket';
import { useChatPresence } from '../src/modules/chat/hooks/useChatPresence';

jest.mock('../src/modules/chat/api/chatApi', () => ({ fetchChatPresence: jest.fn() }));
jest.mock('../src/modules/chat/services/chatSocket', () => ({
  chatSocket: { isConnected: jest.fn(), isUserOnline: jest.fn(), subscribe: jest.fn() },
}));

let listener: (event: any) => void;
let state: ReturnType<typeof useChatPresence>;
let tree: ReactTestRenderer;
const fetchPresence = fetchChatPresence as jest.Mock;
function Probe() {
  state = useChatPresence(42);
  return null;
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  (chatSocket.isConnected as jest.Mock).mockReturnValue(true);
  (chatSocket.isUserOnline as jest.Mock).mockReturnValue(true);
  (chatSocket.subscribe as jest.Mock).mockImplementation(callback => {
    listener = callback;
    return jest.fn();
  });
});

afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  jest.useRealTimers();
});

test('opening a chat uses already-connected presence even if REST is unavailable', async () => {
  fetchPresence.mockRejectedValue(new Error('Unavailable'));
  await act(async () => { tree = create(<Probe />); });
  expect(state.online).toBe(true);
});

test('a delayed offline REST response cannot overwrite a newer online event', async () => {
  let resolve!: (value: any) => void;
  fetchPresence.mockReturnValue(new Promise(done => { resolve = done; }));
  await act(async () => { tree = create(<Probe />); });
  await act(async () => listener({ type: 'presence', data: { user_id: 42, online: true } }));
  await act(async () => resolve([{ user_id: 42, online: false, last_seen_at: null }]));
  expect(state.online).toBe(true);
});

test('polling recovers missed events and disconnect clears an online status', async () => {
  fetchPresence.mockResolvedValue([{ user_id: 42, online: false }]);
  await act(async () => { tree = create(<Probe />); });
  expect(state.online).toBe(false);
  fetchPresence.mockResolvedValue([{ user_id: 42, online: true }]);
  await act(async () => { jest.advanceTimersByTime(15000); });
  expect(state.online).toBe(true);
  await act(async () => listener({ type: 'disconnected', data: null }));
  expect(state.online).toBeNull();
  await act(async () => listener({ type: 'presence', data: { user_id: 99, online: true } }));
  expect(state.online).toBeNull();
});

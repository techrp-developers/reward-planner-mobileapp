jest.mock('../../src/modules/chat/api/chatApi', () => ({ fetchConversations: jest.fn() }));
jest.mock('../../src/query/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn(), removeQueries: jest.fn() },
}));

import axios from 'axios';
import { fetchConversations } from '../../src/modules/chat/api/chatApi';
import { queryClient } from '../../src/query/queryClient';
import { API_BASE_URL, API_V1_URL } from '../../src/config/apiConfig';
import api, { setSessionHandlers } from '../../src/modules/common/auth/api/axios';
import {
  buildQuietHoursUpdate,
  getMyNotifications,
  NOTIFICATION_PAGE_SIZE,
} from '../../src/modules/dashboard/notification/NotificationAPI';
import { resolveNotificationTarget } from '../../src/modules/common/notifications/notificationRouting';
import { openConversationIfOwned } from '../../src/modules/common/notifications/chatNotificationTarget';
import {
  notifyNotificationsChanged,
  subscribeNotificationsChanged,
} from '../../src/modules/common/notifications/notificationEvents';

const base = { module: '', type: '', referenceType: '', referenceId: '', actionUrl: '', screen: '' };
const conversation = { conversation_id: 9, type: 'direct', name: 'Asha' };

describe('chat notification target', () => {
  it('carries the conversation id only for conversation references', () => {
    expect(resolveNotificationTarget({ ...base, module: 'chat', referenceType: 'conversation', referenceId: '9' }).conversationId).toBe(9);
    expect(resolveNotificationTarget({ ...base, module: 'chat', referenceType: 'conversation', referenceId: 'x' }).conversationId).toBeUndefined();
    expect(resolveNotificationTarget({ ...base, module: 'chat', referenceType: 'order', referenceId: '9' }).conversationId).toBeUndefined();
  });

  it("opens the thread only when it is in the user's own conversation list", async () => {
    (fetchConversations as jest.Mock).mockResolvedValue([conversation]);
    const navigate = jest.fn();
    expect(await openConversationIfOwned(9, navigate)).toBe(true);
    expect(navigate).toHaveBeenCalledWith('Chat', { screen: 'ChatConversation', params: { conversation } });

    navigate.mockClear();
    expect(await openConversationIfOwned(10, navigate)).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('stays on the inbox when the lookup fails or the session changed meanwhile', async () => {
    const navigate = jest.fn();
    (fetchConversations as jest.Mock).mockRejectedValue(new Error('offline'));
    expect(await openConversationIfOwned(9, navigate)).toBe(false);

    (fetchConversations as jest.Mock).mockResolvedValue([conversation]);
    expect(await openConversationIfOwned(9, navigate, () => false)).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('quiet hours', () => {
  it('accepts valid pairs and clearing both', () => {
    expect(buildQuietHoursUpdate('22:00', '07:00')).toEqual({ quiet_hours_start: '22:00', quiet_hours_end: '07:00' });
    expect(buildQuietHoursUpdate(null, null)).toEqual({ quiet_hours_start: null, quiet_hours_end: null });
  });

  it('rejects unpaired, malformed or empty ranges', () => {
    expect(buildQuietHoursUpdate('22:00', null)).toBeNull();
    expect(buildQuietHoursUpdate('24:00', '07:00')).toBeNull();
    expect(buildQuietHoursUpdate('7:00', '22:00')).toBeNull();
    expect(buildQuietHoursUpdate('22:00', '22:00')).toBeNull();
  });
});

describe('API URL composition', () => {
  it('adds /v1 exactly once for both API client styles', () => {
    expect(API_V1_URL).toBe(`${API_BASE_URL}/v1`);
    expect(API_BASE_URL).not.toMatch(/\/v1\/?$/);
    expect(`${api.defaults.baseURL}/v1/auth/update-fcm-token`).not.toContain('/v1/v1');
  });

  it('requests the first inbox page with limit and the next with before_id', async () => {
    const get = jest.spyOn(axios, 'get').mockResolvedValue({ data: { success: true, data: [] } });
    await getMyNotifications();
    await getMyNotifications({ beforeId: 120 });

    expect(get.mock.calls[0][0]).toBe(`${API_V1_URL}/notification/my-notification`);
    expect(get.mock.calls[0][1]?.params).toEqual({ limit: NOTIFICATION_PAGE_SIZE });
    expect(get.mock.calls[1][1]?.params).toEqual({ limit: NOTIFICATION_PAGE_SIZE, before_id: 120 });
    get.mockRestore();
  });
});

describe('401 refresh and retry through the shared client', () => {
  afterEach(() => setSessionHandlers(null));

  it('refreshes once, persists the rotated pair, and retries the FCM registration', async () => {
    let accessToken = 'old-access';
    const onSessionRefresh = jest.fn(async (access: string) => { accessToken = access; });
    setSessionHandlers({
      getAccessToken: () => accessToken,
      getRefreshToken: async () => 'refresh-1',
      onSessionRefresh,
      onLogout: jest.fn(),
    });

    const seenAuth: string[] = [];
    const originalAdapter = api.defaults.adapter;
    api.defaults.adapter = async config => {
      const auth = String((config.headers as any)?.Authorization || (config.headers as any)?.get?.('Authorization'));
      seenAuth.push(auth);
      if (auth === 'Bearer old-access') {
        return Promise.reject(Object.assign(new Error('401'), { config, response: { status: 401, config, data: {} } }));
      }
      return { data: { success: true, firebase_project_id: 'reward-planners-2324d' }, status: 200, statusText: 'OK', headers: {}, config };
    };
    const refresh = jest.spyOn(axios, 'post').mockResolvedValue({
      data: { accessToken: 'new-access', refreshToken: 'refresh-2' },
    });

    const res = await api.post('/v1/auth/update-fcm-token', { fcm_token: 't', device_platform: 'android' });

    expect(res.data.firebase_project_id).toBe('reward-planners-2324d');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(onSessionRefresh).toHaveBeenCalledWith('new-access', 'refresh-2');
    expect(seenAuth).toEqual(['Bearer old-access', 'Bearer new-access']);

    refresh.mockRestore();
    api.defaults.adapter = originalAdapter;
  });
});

describe('badge and inbox synchronization', () => {
  it('invalidates the shared bell query and notifies open inbox screens', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeNotificationsChanged(listener);
    notifyNotificationsChanged();
    unsubscribe();
    notifyNotificationsChanged();

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['notification'] });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

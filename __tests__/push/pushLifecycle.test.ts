jest.mock('../../src/config/apiConfig', () => ({ SERVER_URL: 'http://192.168.1.160:5000' }));
jest.mock('@react-native-firebase/app', () => ({ getApps: () => [{}], getApp: () => ({ options: {} }) }));
jest.mock('@react-native-firebase/messaging', () => ({ getMessaging: jest.fn(), getToken: jest.fn() }));
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(),
    createChannels: jest.fn(),
    getChannels: jest.fn(),
    displayNotification: jest.fn(),
    getNotificationSettings: jest.fn(),
    cancelDisplayedNotifications: jest.fn(),
    openNotificationSettings: jest.fn(),
  },
  AndroidImportance: { NONE: 0, LOW: 2, DEFAULT: 3, HIGH: 4 },
  AndroidStyle: { BIGPICTURE: 0, BIGTEXT: 1 },
  AuthorizationStatus: { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1 },
}));
jest.mock('../../src/modules/chat/services/chatSocket', () => ({ chatSocket: { requestResync: jest.fn() } }));
jest.mock('../../src/query/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn(), removeQueries: jest.fn() },
}));
jest.mock('../../src/navigation/navigationRef', () => ({
  navigationRef: { navigate: jest.fn() },
  isAppStackMounted: jest.fn(),
}));
jest.mock('../../src/modules/dashboard/notification/NotificationAPI', () => ({
  markNotificationAsRead: jest.fn(),
  reportNotificationOpened: jest.fn(),
}));
jest.mock('../../src/modules/common/auth/api/axios', () => ({ __esModule: true, default: { post: jest.fn() } }));

import notifee from '@notifee/react-native';
import { chatSocket } from '../../src/modules/chat/services/chatSocket';
import { queryClient } from '../../src/query/queryClient';
import { isAppStackMounted, navigationRef } from '../../src/navigation/navigationRef';
import {
  markNotificationAsRead,
  reportNotificationOpened,
} from '../../src/modules/dashboard/notification/NotificationAPI';
import {
  handleBackgroundMessage,
  handleForegroundMessage,
  queueLocalOpen,
  queueRemoteOpen,
} from '../../src/modules/common/notifications/pushHandlers';
import {
  clearPendingOpen,
  hasPendingOpen,
  performNotificationOpen,
  setActivePushUser,
  takePendingOpen,
} from '../../src/modules/common/notifications/pushNavigation';
import { resetPushSession } from '../../src/modules/common/notifications/pushSession';
import { pushRegistrar } from '../../src/modules/common/notifications/pushRegistration';

const display = notifee.displayNotification as jest.Mock;
const settings = notifee.getNotificationSettings as jest.Mock;
let seq = 0;
const remote = (patch: Record<string, any> = {}) => ({
  messageId: `msg-${(seq += 1)}`,
  notification: { title: 'Order shipped', body: 'Your order #42 is on the way' },
  data: { notification_id: String(1000 + seq), module: 'ecommerce', action_url: '/orders/order-details/42' },
  ...patch,
});

beforeEach(() => {
  jest.clearAllMocks();
  settings.mockResolvedValue({ authorizationStatus: 1 });
  display.mockResolvedValue('id');
  (notifee.cancelDisplayedNotifications as jest.Mock).mockResolvedValue(undefined);
  (markNotificationAsRead as jest.Mock).mockResolvedValue({});
  (reportNotificationOpened as jest.Mock).mockResolvedValue({});
  (isAppStackMounted as jest.Mock).mockReturnValue(true);
  clearPendingOpen();
  setActivePushUser(null);
});

describe('foreground messages', () => {
  it('shows one local alert, refreshes the badge, and keys it by notification_id', async () => {
    const message = remote();
    await handleForegroundMessage(message as any);
    await handleForegroundMessage(message as any);

    expect(display).toHaveBeenCalledTimes(1);
    expect(display.mock.calls[0][0]).toEqual(expect.objectContaining({
      id: `n:${message.data.notification_id}`,
      title: 'Order shipped',
      android: expect.objectContaining({ channelId: 'reward_planners_general', smallIcon: 'ic_stat_notification', largeIcon: expect.anything() }),
    }));
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['notification'] });
  });

  it('uses the channel the backend chose, and falls back to general for unknown ids', async () => {
    await handleForegroundMessage(remote({ data: { notification_id: '501', android_channel_id: 'reward_planners_offers' } }) as any);
    await handleForegroundMessage(remote({ data: { notification_id: '502', android_channel_id: 'something_else' } }) as any);
    expect(display.mock.calls[0][0].android.channelId).toBe('reward_planners_offers');
    expect(display.mock.calls[1][0].android.channelId).toBe('reward_planners_general');
  });

  it("uses Android's system channel id from the FCM notification block", async () => {
    await handleForegroundMessage(remote({
      notification: { title: 'Points added', body: '50 RP', android: { channelId: 'reward_planners_updates' } },
    }) as any);
    expect(display.mock.calls[0][0].android.channelId).toBe('reward_planners_updates');
  });

  it('does not display when Android notification permission is denied', async () => {
    settings.mockResolvedValue({ authorizationStatus: 0 });
    await handleForegroundMessage(remote() as any);
    expect(display).not.toHaveBeenCalled();
  });

  it('resyncs chat when a chat push arrives', async () => {
    await handleForegroundMessage(remote({ data: { type: 'chat_message', module: 'chat' } }) as any);
    expect(chatSocket.requestResync).toHaveBeenCalled();
  });

  it('falls back to a text notification when the rich image fails', async () => {
    display.mockRejectedValueOnce(new Error('image load failed')).mockResolvedValueOnce('id');
    await handleForegroundMessage(remote({
      notification: { title: 'Sale', body: 'Big sale', android: { imageUrl: 'https://cdn.rewardplanners.com/sale.png' } },
    }) as any);

    expect(display).toHaveBeenCalledTimes(2);
    expect(display.mock.calls[0][0].android.style).toEqual({ type: 0, picture: 'https://cdn.rewardplanners.com/sale.png' });
    expect(display.mock.calls[1][0].android.style).toEqual({ type: 1, text: 'Big sale' });
  });

  it('drops untrusted image hosts instead of fetching them', async () => {
    await handleForegroundMessage(remote({
      notification: { title: 'x', body: 'y', android: { imageUrl: 'https://tracker.example.com/p.png' } },
    }) as any);
    expect(display.mock.calls[0][0].android.style.type).toBe(1);
  });
});

describe('background messages', () => {
  it('does not double-display a notification payload Android already shows', async () => {
    await handleBackgroundMessage(remote() as any);
    expect(display).not.toHaveBeenCalled();
  });

  it('displays data-only messages that carry text', async () => {
    await handleBackgroundMessage({ messageId: 'd-1', data: { title: 'Hello', message: 'World' } } as any);
    expect(display).toHaveBeenCalledTimes(1);
  });

  it('ignores silent data-only messages', async () => {
    await handleBackgroundMessage({ messageId: 'd-2', data: { type: 'sync' } } as any);
    expect(display).not.toHaveBeenCalled();
  });
});

describe('notification taps', () => {
  it('opens an order from a terminated-state tap and records it once', () => {
    setActivePushUser(7);
    const message = remote();
    expect(queueRemoteOpen(message as any, 'terminated')).toBe(true);
    expect(queueRemoteOpen(message as any, 'terminated')).toBe(false);

    const open = takePendingOpen(7);
    expect(performNotificationOpen(open!)).toBe(true);
    expect(navigationRef.navigate).toHaveBeenCalledWith('App', { screen: 'OrderConfirmedScreen', params: { order_id: 42 } });
    expect(reportNotificationOpened).toHaveBeenCalledWith(Number(message.data.notification_id), {
      app_state: 'terminated', outcome: 'opened_target', destination_type: 'order',
    });
    expect(markNotificationAsRead).toHaveBeenCalledWith(Number(message.data.notification_id));
  });

  it('routes chat taps to the chat inbox', () => {
    setActivePushUser(7);
    queueLocalOpen({ id: 'n:55', data: { notification_id: '55', module: 'chat', type: 'chat_message' } }, 'foreground');
    performNotificationOpen(takePendingOpen(7)!);
    expect(navigationRef.navigate).toHaveBeenCalledWith('App', { screen: 'Chat', params: { screen: 'ChatInbox' } });
  });

  it('falls back to the inbox for an unknown destination', () => {
    setActivePushUser(7);
    queueRemoteOpen(remote({ data: { notification_id: '77', screen: 'Nope' } }) as any, 'background');
    performNotificationOpen(takePendingOpen(7)!);
    expect(navigationRef.navigate).toHaveBeenCalledWith('App', { screen: 'Notification', params: undefined });
    expect(reportNotificationOpened).toHaveBeenCalledWith(77, expect.objectContaining({ outcome: 'fallback' }));
  });

  it('keeps a signed-out tap until login, then opens only the inbox without marking read', () => {
    queueRemoteOpen(remote() as any, 'terminated');
    expect(takePendingOpen(null)).toBeNull();
    expect(hasPendingOpen()).toBe(true);

    performNotificationOpen(takePendingOpen(9)!);
    expect(navigationRef.navigate).toHaveBeenCalledWith('App', { screen: 'Notification', params: undefined });
    expect(reportNotificationOpened).toHaveBeenCalledWith(expect.any(Number), expect.objectContaining({ outcome: 'login_required' }));
    expect(markNotificationAsRead).not.toHaveBeenCalled();
  });

  it("discards a tap that belonged to a different account", () => {
    setActivePushUser(7);
    queueRemoteOpen(remote() as any, 'background');
    expect(takePendingOpen(8)).toBeNull();
    expect(hasPendingOpen()).toBe(false);
  });

  it('does not navigate before the App stack is mounted', () => {
    (isAppStackMounted as jest.Mock).mockReturnValue(false);
    setActivePushUser(7);
    queueRemoteOpen(remote() as any, 'terminated');
    expect(performNotificationOpen(takePendingOpen(7)!)).toBe(false);
    expect(navigationRef.navigate).not.toHaveBeenCalled();
  });
});

// Shapes produced by the backend's buildPushMessage: FCM data values are
// strings, so target_route arrives JSON-encoded.
describe('backend-shaped campaign taps', () => {
  const tap = (data: Record<string, string>) => {
    setActivePushUser(7);
    queueRemoteOpen(remote({ data: { notification_id: String(9000 + (seq += 1)), ...data } }) as any, 'background');
    performNotificationOpen(takePendingOpen(7)!);
    return (navigationRef.navigate as jest.Mock).mock.calls.at(-1);
  };
  const route = (path: string[], params?: object) => JSON.stringify({ path, params: params || {} });

  it('opens product details', () => {
    expect(tap({ module: 'ecommerce', screen: 'ProductDetails', target_route: route(['App', 'ProductDetails'], { productId: 15 }) }))
      .toEqual(['App', { screen: 'ProductDetails', params: { productId: 15 } }]);
  });

  it('opens a service through the nested Home > ServicesModule stack', () => {
    expect(tap({ module: 'service', target_route: route(['App', 'Home', 'ServicesModule', 'ServiceDescription'], { serviceId: 3 }) }))
      .toEqual(['App', { screen: 'Home', params: { screen: 'ServicesModule', params: { screen: 'ServiceDescription', params: { serviceId: 3 } } } }]);
  });

  it('opens the rewards (RP Move) dashboard', () => {
    expect(tap({ module: 'fitness', target_route: route(['App', 'RewardStack', 'Dashboard']) }))
      .toEqual(['App', { screen: 'RewardStack', params: { screen: 'Dashboard' } }]);
  });

  it('opens the notification inbox', () => {
    expect(tap({ module: 'common', target_route: route(['App', 'Notification']) }))
      .toEqual(['App', { screen: 'Notification', params: undefined }]);
  });

  it('keeps chat on the chat inbox even when a target_route is present', () => {
    expect(tap({ module: 'chat', type: 'chat_message', target_route: route(['App', 'Chat', 'ChatInbox']) }))
      .toEqual(['App', { screen: 'Chat', params: { screen: 'ChatInbox' } }]);
  });

  it('rejects nested paths that are not on the exact allowlist', () => {
    expect(tap({ module: 'ecommerce', target_route: route(['App', 'Home', 'ProductModule', 'Checkout']) }))
      .toEqual(['App', { screen: 'Notification', params: undefined }]);
    expect(tap({ module: 'ecommerce', target_route: '{not json' }))
      .toEqual(['App', { screen: 'Notification', params: undefined }]);
  });

  it('ignores taps on debug test alerts', () => {
    setActivePushUser(7);
    expect(queueLocalOpen({ id: 'debug-test:reward_planners_general', data: { debug_test: '1' } }, 'foreground')).toBe(false);
    expect(hasPendingOpen()).toBe(false);
  });
});

describe('logout cleanup', () => {
  it('drops pending taps, cached notification data, tray alerts and registration', async () => {
    const stop = jest.spyOn(pushRegistrar, 'stop');
    setActivePushUser(7);
    queueRemoteOpen(remote() as any, 'background');

    await resetPushSession();

    expect(hasPendingOpen()).toBe(false);
    expect(stop).toHaveBeenCalled();
    expect(queryClient.removeQueries).toHaveBeenCalledWith({ queryKey: ['notification'] });
    expect(notifee.cancelDisplayedNotifications).toHaveBeenCalled();
  });
});

import fs from 'fs';
import path from 'path';
import { resolveNotificationTarget } from '../../src/modules/common/notifications/notificationRouting';
import {
  getDedupeKey,
  parsePushData,
  RecentKeys,
  sanitizeImageUrl,
} from '../../src/modules/common/notifications/pushPayload';

jest.mock('../../src/config/apiConfig', () => ({ SERVER_URL: 'http://192.168.1.160:5000' }));

const base = { module: '', type: '', referenceType: '', referenceId: '', actionUrl: '', screen: '' };

describe('Firebase Android config', () => {
  it('packages the primary project for com.rewardsplanners', () => {
    const file = path.join(__dirname, '../../android/app/google-services.json');
    const config = JSON.parse(fs.readFileSync(file, 'utf8'));
    const client = config.client.find(
      (c: any) => c.client_info.android_client_info.package_name === 'com.rewardsplanners',
    );

    expect(config.project_info.project_id).toBe('reward-planners-2324d');
    expect(config.project_info.project_number).toBe('1072834182730');
    expect(client.client_info.mobilesdk_app_id).toBe('1:1072834182730:android:333b39b619d5df456cf0b3');
    expect(JSON.stringify(config)).not.toContain('rewardplanners-ebbe4');
  });

  it('ships no service-account credentials in the app', () => {
    const file = fs.readFileSync(path.join(__dirname, '../../android/app/google-services.json'), 'utf8');
    expect(file).not.toMatch(/private_key|client_email|service_account/);
  });
});

describe('resolveNotificationTarget', () => {
  it('opens the chat inbox for chat pushes (no partial conversation object)', () => {
    expect(resolveNotificationTarget({ ...base, module: 'chat', type: 'chat_message', referenceId: '9' }))
      .toEqual(expect.objectContaining({ route: 'Chat', params: { screen: 'ChatInbox' }, isFallback: false }));
  });

  it('opens ecommerce order details by id', () => {
    expect(resolveNotificationTarget({ ...base, actionUrl: '/orders/order-details/42' }))
      .toEqual(expect.objectContaining({ route: 'OrderConfirmedScreen', params: { order_id: 42 }, destinationType: 'order' }));
  });

  it('opens service order details', () => {
    expect(resolveNotificationTarget({ ...base, referenceType: 'service_order', referenceId: 'SO-7' }).params)
      .toEqual({ screen: 'ServiceOrderDetail', params: { parent_order_id: 'SO-7' } });
  });

  it('maps backend screen hints and exact action urls', () => {
    expect(resolveNotificationTarget({ ...base, actionUrl: '/wallet' }).route).toBe('WalletHistory');
    expect(resolveNotificationTarget({ ...base, screen: 'BbpsHome' }).route).toBe('BBPSHomeStack');
  });

  it('falls back to the inbox for general announcements and unknown destinations', () => {
    const announcement = resolveNotificationTarget({ ...base, module: 'common', type: 'announcement' });
    const unknown = resolveNotificationTarget({ ...base, actionUrl: 'https://evil.example/phish', screen: 'AdminPanel' });

    expect(announcement).toEqual(expect.objectContaining({ route: 'Notification', isFallback: true }));
    expect(unknown).toEqual(expect.objectContaining({ route: 'Notification', isFallback: true }));
  });

  it('honours allowlisted target_route metadata and strips non-primitive params', () => {
    const result = resolveNotificationTarget({
      ...base,
      metadata: { target_route: { path: ['App', 'Orders'], params: { tab: 'open', nested: { x: 1 } } } },
    });
    expect(result).toEqual(expect.objectContaining({ route: 'Orders', params: { tab: 'open' } }));
  });

  it('ignores target_route pointing at non-allowlisted screens', () => {
    const result = resolveNotificationTarget({
      ...base,
      metadata: { target_route: { path: ['App', 'Checkout'] } },
    });
    expect(result.isFallback).toBe(true);
  });
});

describe('push payload parsing', () => {
  it('parses notification_id and rejects junk ids', () => {
    expect(parsePushData({ notification_id: '12345' }).notificationId).toBe(12345);
    expect(parsePushData({ notification_id: 'abc' }).notificationId).toBeNull();
    expect(parsePushData(undefined).module).toBe('');
  });

  it('only allows https images from our own domains', () => {
    expect(sanitizeImageUrl('https://cdn.rewardplanners.com/a.png')).toBe('https://cdn.rewardplanners.com/a.png');
    expect(sanitizeImageUrl('http://cdn.rewardplanners.com/a.png')).toBeNull();
    expect(sanitizeImageUrl('https://rewardplanners.com.evil.io/a.png')).toBeNull();
    // eslint-disable-next-line no-script-url -- deliberately hostile input
    expect(sanitizeImageUrl('javascript:alert(1)')).toBeNull();
  });

  it('dedupes on notification_id, then messageId, never on text', () => {
    expect(getDedupeKey({ messageId: 'm1', data: { notification_id: '7' } })).toBe('n:7');
    expect(getDedupeKey({ messageId: 'm1', data: {} })).toBe('m:m1');
    expect(getDedupeKey({ data: { title: 'Hi' } })).toBeNull();
  });

  it('keeps two distinct messages with identical text', () => {
    const keys = new RecentKeys(10);
    expect(keys.markFirstSeen(getDedupeKey({ messageId: 'a', data: { title: 'Order shipped' } }))).toBe(true);
    expect(keys.markFirstSeen(getDedupeKey({ messageId: 'b', data: { title: 'Order shipped' } }))).toBe(true);
    expect(keys.markFirstSeen(getDedupeKey({ messageId: 'a' }))).toBe(false);
  });

  it('evicts the oldest key when full', () => {
    const keys = new RecentKeys(2);
    keys.markFirstSeen('a');
    keys.markFirstSeen('b');
    keys.markFirstSeen('c');
    expect(keys.markFirstSeen('a')).toBe(true);
  });
});

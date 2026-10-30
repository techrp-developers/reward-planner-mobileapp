import notifee from '@notifee/react-native';
import {
  ensureNotificationChannels,
  getChannelStates,
  resolveChannelId,
} from '../../src/modules/common/notifications/pushDisplay';

describe('notification channels', () => {
  it('creates the urgent, default and quiet channels with stable ids', async () => {
    await ensureNotificationChannels();
    const channels = (notifee.createChannels as jest.Mock).mock.calls[0][0];
    expect(channels.map((c: any) => [c.id, c.importance])).toEqual([
      ['reward_planners_general', 4],
      ['reward_planners_updates', 3],
      ['reward_planners_offers', 2],
    ]);
  });

  it('only routes to known channels', () => {
    expect(resolveChannelId('reward_planners_updates')).toBe('reward_planners_updates');
    expect(resolveChannelId('promo_heads_up')).toBe('reward_planners_general');
    expect(resolveChannelId(undefined)).toBe('reward_planners_general');
  });

  it("reports the installed state, including the user's own changes", async () => {
    (notifee.getChannels as jest.Mock).mockResolvedValue([
      { id: 'reward_planners_general', importance: 4, blocked: false },
      { id: 'reward_planners_offers', importance: 0, blocked: true },
    ]);
    const states = await getChannelStates();
    expect(states.find(s => s.id === 'reward_planners_offers')).toEqual(expect.objectContaining({ blocked: true, importance: 0 }));
    expect(states.find(s => s.id === 'reward_planners_updates')).toEqual(expect.objectContaining({ blocked: false, importance: null }));
  });
});

describe('debug local notification', () => {
  it('posts on the chosen channel with a fixed id so repeats replace, not stack', async () => {
    const { showDebugTestNotification } = require('../../src/modules/common/notifications/pushDebug');
    await showDebugTestNotification('reward_planners_general');
    await showDebugTestNotification('reward_planners_general');
    const calls = (notifee.displayNotification as jest.Mock).mock.calls.map(c => c[0]);
    expect(calls.map((n: any) => n.id)).toEqual(['debug-test:reward_planners_general', 'debug-test:reward_planners_general']);
    expect(calls[0].android).toEqual(expect.objectContaining({ channelId: 'reward_planners_general', smallIcon: 'ic_stat_notification', largeIcon: expect.anything() }));
    await expect(showDebugTestNotification('promo_heads_up')).rejects.toThrow('Unknown channel');
  });
});

describe('notification branding assets', () => {
  it('ships a square, small large-icon derived from the logo, and keeps the monochrome small icon', () => {
    const fs = require('fs');
    const path = require('path');
    const png = fs.readFileSync(path.join(__dirname, '../../src/assets/notifications/notification_large_icon.png'));
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([256, 256]);
    expect(png[25]).toBe(6); // RGBA: transparent corners for circular crops
    const small = fs.readFileSync(path.join(__dirname, '../../android/app/src/main/res/drawable/ic_stat_notification.xml'), 'utf8');
    expect(small).toContain('<vector');
  });
});

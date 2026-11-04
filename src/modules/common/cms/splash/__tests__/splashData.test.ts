import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import api from '../../../auth/api/axios';
import {
  __resetSplashApiForTests,
  cacheValidUntil,
  fetchResolvedSplash,
  isCampaignLive,
  parseResolvedSplash,
  prefetchArtwork,
  readCachedSplash,
  writeCachedSplash,
} from '../splashApi';
import {
  __resetFrequencyForTests,
  clearSplashFrequencyHistory,
  getServerNow,
  istDayKey,
  loadFrequencyHistory,
  markCampaignShown,
  recordServerTime,
  shouldDisplayCampaign,
} from '../splashFrequency';

jest.mock('../../../auth/api/axios', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../../../../config/apiConfig', () => ({ normalizeLocalCmsImageUrl: (url: string) => url || null }));

const SERVER_TIME = '2026-11-04T08:00:00.000Z';
export const rawCampaign = (overrides: Record<string, any> = {}) => ({
  content_id: 21,
  placement_id: 1,
  title: 'Happy Diwali',
  cta_text: 'Diwali Utsaav',
  image_url: 'https://cdn.rewardplanners.com/example.webp',
  display_mode: 'single',
  navigation: null,
  link: null,
  priority: 0,
  starts_at: '2026-11-03T10:36:00.000Z',
  expires_at: '2026-11-12T10:38:00.000Z',
  display: { frequency_rule: 'every_visit', display_seconds: 3, auto_dismiss: true, dismissible: true },
  ...overrides,
});
const body = (data: Record<string, any> = {}): any => ({
  success: true,
  data: {
    source: 'scheduled_campaign',
    page_key: 'app_launch',
    slot_key: 'promo_splash',
    platform: 'android',
    audience: 'authenticated',
    server_time: SERVER_TIME,
    expires_at: '2026-11-12T10:38:00.000Z',
    next_change_at: null,
    cache_ttl_seconds: 300,
    campaign: rawCampaign(),
    ...data,
  },
});
const scope = { userScope: 'u7', pageKey: 'app_launch', slotKey: 'promo_splash' };

beforeEach(async () => {
  jest.clearAllMocks();
  __resetFrequencyForTests();
  __resetSplashApiForTests();
  await AsyncStorage.clear();
});

describe('parseResolvedSplash', () => {
  it('accepts scheduled and default sources', () => {
    expect(parseResolvedSplash(body())?.campaign?.content_id).toBe(21);
    expect(parseResolvedSplash(body({ source: 'default' }))?.source).toBe('default');
  });

  it('treats none, a null campaign and unusable artwork as no campaign', () => {
    expect(parseResolvedSplash(body({ source: 'none', campaign: null }))?.campaign).toBeNull();
    expect(parseResolvedSplash(body({ campaign: null }))?.source).toBe('none');
    expect(parseResolvedSplash(body({ campaign: rawCampaign({ image_url: 'javascript:alert(1)' }) }))?.campaign).toBeNull(); // eslint-disable-line no-script-url -- rejected input under test
    expect(parseResolvedSplash(body({ campaign: rawCampaign({ image_url: '' }) }))?.campaign).toBeNull();
  });

  it('rejects failed or malformed envelopes', () => {
    expect(parseResolvedSplash({ success: false } as any)).toBeNull();
    expect(parseResolvedSplash(body({ source: 'surprise' }))).toBeNull();
  });

  it('falls back to once_per_session for an unknown frequency rule', () => {
    const parsed = parseResolvedSplash(body({ campaign: rawCampaign({ display: { frequency_rule: 'hourly', display_seconds: 3 } }) }));
    expect(parsed?.campaign?.display.frequency_rule).toBe('once_per_session');
  });
});

describe('fetchResolvedSplash', () => {
  it('sends the android slot query without any audience parameter and learns server time', async () => {
    (api.get as jest.Mock).mockResolvedValue({ status: 200, data: body() });
    const resolved = await fetchResolvedSplash();
    const [path, config] = (api.get as jest.Mock).mock.calls[0];
    expect(path).toBe('/content/splashscreens/resolved');
    expect(config.params).toEqual({ page_key: 'app_launch', slot_key: 'promo_splash', platform: 'android' });
    expect(config.params).not.toHaveProperty('audience');
    expect(resolved?.source).toBe('scheduled_campaign');
    expect(Math.abs(getServerNow() - Date.parse(SERVER_TIME))).toBeLessThan(1000);
  });

  it('propagates network failures to the caller', async () => {
    (api.get as jest.Mock).mockRejectedValue(Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }));
    await expect(fetchResolvedSplash()).rejects.toThrow('Network Error');
  });
});

describe('expiry and cache', () => {
  it('never treats an expired or not-yet-started campaign as live', () => {
    const campaign = parseResolvedSplash(body())!.campaign!;
    expect(isCampaignLive(campaign, Date.parse('2026-11-05T00:00:00Z'))).toBe(true);
    expect(isCampaignLive(campaign, Date.parse('2026-11-12T10:38:00Z'))).toBe(false);
    expect(isCampaignLive(campaign, Date.parse('2026-11-01T00:00:00Z'))).toBe(false);
  });

  it('caches until the earliest of ttl, next change and expiries', () => {
    const resolved = parseResolvedSplash(body())!;
    expect(cacheValidUntil(resolved)).toBe(Date.parse(SERVER_TIME) + 300_000);
    const changing = parseResolvedSplash(body({ next_change_at: '2026-11-04T08:01:00.000Z' }))!;
    expect(cacheValidUntil(changing)).toBe(Date.parse('2026-11-04T08:01:00.000Z'));
    expect(cacheValidUntil(parseResolvedSplash(body({ cache_ttl_seconds: 0 }))!)).toBe(0);
  });

  it('serves a cached result only to the same user and only while valid', async () => {
    recordServerTime(SERVER_TIME);
    await writeCachedSplash('u7', parseResolvedSplash(body())!);
    __resetSplashApiForTests();
    expect((await readCachedSplash('u7'))?.campaign?.content_id).toBe(21);
    expect(await readCachedSplash('u8')).toBeNull();

    recordServerTime('2026-11-04T08:06:00.000Z');
    expect(await readCachedSplash('u7')).toBeNull();
  });
});

describe('prefetchArtwork', () => {
  it('downloads each url once and skips artwork already in the image cache', async () => {
    const prefetch = jest.spyOn(Image, 'prefetch').mockResolvedValue(true);
    const queryCache = jest.spyOn(Image, 'queryCache').mockResolvedValue({});
    await Promise.all([prefetchArtwork('https://a/x.webp'), prefetchArtwork('https://a/x.webp')]);
    expect(prefetch).toHaveBeenCalledTimes(1);

    queryCache.mockResolvedValue({ 'https://a/cached.webp': 'disk' });
    await expect(prefetchArtwork('https://a/cached.webp')).resolves.toBe(true);
    expect(prefetch).toHaveBeenCalledTimes(1);
  });

  it('reports failure and allows a later retry', async () => {
    jest.spyOn(Image, 'queryCache').mockResolvedValue({});
    const prefetch = jest.spyOn(Image, 'prefetch').mockRejectedValueOnce(new Error('404')).mockResolvedValue(true);
    await expect(prefetchArtwork('https://a/broken.webp')).resolves.toBe(false);
    await expect(prefetchArtwork('https://a/broken.webp')).resolves.toBe(true);
    expect(prefetch).toHaveBeenCalledTimes(2);
  });
});

describe('frequency rules', () => {
  const campaign = (rule: string, contentId = 21) =>
    parseResolvedSplash(body({ campaign: rawCampaign({ content_id: contentId, display: { frequency_rule: rule, display_seconds: 3 } }) }))!.campaign!;
  const at = (iso: string) => Date.parse(iso);

  it('uses the IST calendar day', () => {
    expect(istDayKey(at('2026-11-04T18:29:59Z'))).toBe('2026-11-04');
    expect(istDayKey(at('2026-11-04T18:30:00Z'))).toBe('2026-11-05');
  });

  it('every_visit always displays', async () => {
    const c = campaign('every_visit');
    await markCampaignShown(scope, c);
    expect(shouldDisplayCampaign(scope, c)).toBe(true);
  });

  it('once_per_session displays once per JS runtime', async () => {
    const c = campaign('once_per_session');
    expect(shouldDisplayCampaign(scope, c)).toBe(true);
    await markCampaignShown(scope, c);
    expect(shouldDisplayCampaign(scope, c)).toBe(false);
    __resetFrequencyForTests(); // cold launch
    expect(shouldDisplayCampaign(scope, c)).toBe(true);
  });

  it('once_per_day persists across a restart and resets at IST midnight', async () => {
    const c = campaign('once_per_day');
    await markCampaignShown(scope, c, at('2026-11-04T10:00:00Z'));
    __resetFrequencyForTests(); // cold launch: only AsyncStorage survives
    await loadFrequencyHistory();
    expect(shouldDisplayCampaign(scope, c, at('2026-11-04T18:00:00Z'))).toBe(false);
    expect(shouldDisplayCampaign(scope, c, at('2026-11-04T18:31:00Z'))).toBe(true);
  });

  it('keeps history separate per user and per campaign', async () => {
    const c = campaign('once_per_day');
    const now = at('2026-11-04T10:00:00Z');
    await markCampaignShown(scope, c, now);
    expect(shouldDisplayCampaign({ ...scope, userScope: 'u8' }, c, now)).toBe(true);
    expect(shouldDisplayCampaign(scope, campaign('once_per_day', 22), now)).toBe(true);
  });

  it('dev reset clears one campaign without touching other storage', async () => {
    await AsyncStorage.setItem('@rewardsplanners_refresh_token', 'keep-me');
    const now = at('2026-11-04T10:00:00Z');
    await markCampaignShown(scope, campaign('once_per_day', 21), now);
    await markCampaignShown(scope, campaign('once_per_day', 22), now);
    await clearSplashFrequencyHistory(21);
    expect(shouldDisplayCampaign(scope, campaign('once_per_day', 21), now)).toBe(true);
    expect(shouldDisplayCampaign(scope, campaign('once_per_day', 22), now)).toBe(false);
    expect(await AsyncStorage.getItem('@rewardsplanners_refresh_token')).toBe('keep-me');
  });
});

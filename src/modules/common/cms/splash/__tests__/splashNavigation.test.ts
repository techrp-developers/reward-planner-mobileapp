import { Linking } from 'react-native';
import { isAppStackMounted, navigationRef } from '../../../../../navigation/navigationRef';
import { isSafeExternalLink, resolveSplashAction, runSplashActionWhenReady } from '../splashNavigation';

jest.mock('../../../../../navigation/navigationRef', () => {
  const listeners = new Set<() => void>();
  return {
    isAppStackMounted: jest.fn(() => false),
    navigationRef: {
      getRootState: jest.fn(() => ({ routes: [{ name: 'Splash' }] })),
      navigate: jest.fn(),
      addListener: jest.fn((_: string, listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }),
      __emit: () => listeners.forEach(listener => listener()),
    },
  };
});

const campaign = (overrides: Record<string, any> = {}) => ({
  content_id: 21,
  placement_id: 1,
  title: 'Happy Diwali',
  cta_text: 'Diwali Utsaav',
  image_url: 'https://cdn/x.webp',
  display_mode: 'single',
  navigation: null,
  link: null,
  priority: 0,
  starts_at: null,
  expires_at: null,
  display: { frequency_rule: 'every_visit' as const, display_seconds: 3, auto_dismiss: true, dismissible: true },
  ...overrides,
});

describe('resolveSplashAction', () => {
  it('maps approved destinations onto existing routes', () => {
    expect(resolveSplashAction(campaign({ navigation: { destination: 'product_details', targetId: 1125 } }))).toEqual({
      kind: 'route', destination: 'product_details', route: 'ProductDetails', params: { productId: 1125 },
    });
    expect(resolveSplashAction(campaign({ navigation: { destination: 'product_offer', contentId: 21 } }))).toMatchObject({
      route: 'Home',
      params: { screen: 'ProductModule', params: { screen: 'CampaignProducts', params: { contentId: 21, title: 'Diwali Utsaav' } } },
    });
    expect(resolveSplashAction(campaign({ navigation: { destination: 'category', targetId: '9' } }))).toMatchObject({
      route: 'Home',
      params: { params: { screen: 'Category', params: { categoryId: 9 } } },
    });
    expect(resolveSplashAction(campaign({ navigation: { destination: 'service_details', target_id: 4 } }))).toMatchObject({
      route: 'ServiceStack',
      params: { screen: 'ServiceDescription', params: { serviceId: 4 } },
    });
  });

  it('ignores unknown destinations, missing ids and arbitrary route names', () => {
    expect(resolveSplashAction(campaign({ navigation: { destination: 'Checkout' } }))).toBeNull();
    expect(resolveSplashAction(campaign({ navigation: { destination: 'product_details', targetId: -3 } }))).toBeNull();
    expect(resolveSplashAction(campaign({ navigation: { destination: 'category', targetId: 'abc' } }))).toBeNull();
    expect(resolveSplashAction(campaign())).toBeNull();
  });

  it('only allows plain https external links', () => {
    expect(resolveSplashAction(campaign({ link: 'https://rewardplanners.com/diwali' }))).toEqual({ kind: 'external', url: 'https://rewardplanners.com/diwali' });
    expect(isSafeExternalLink('http://rewardplanners.com')).toBe(false);
    expect(isSafeExternalLink('javascript:alert(1)')).toBe(false); // eslint-disable-line no-script-url -- rejected input under test
    expect(isSafeExternalLink('https://user:pw@evil.example')).toBe(false);
  });
});

describe('runSplashActionWhenReady', () => {
  const nav = navigationRef as any;
  const action = { kind: 'route' as const, destination: 'product_details', route: 'ProductDetails' as const, params: { productId: 5 } };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (isAppStackMounted as jest.Mock).mockReturnValue(false);
    nav.getRootState.mockReturnValue({ routes: [{ name: 'Splash' }] });
  });
  afterEach(() => jest.useRealTimers());

  it('waits for the App stack to mount, then navigates exactly once', () => {
    const onDone = jest.fn();
    runSplashActionWhenReady(action, onDone);
    expect(nav.navigate).not.toHaveBeenCalled();

    (isAppStackMounted as jest.Mock).mockReturnValue(true);
    nav.getRootState.mockReturnValue({ routes: [{ name: 'App' }] });
    nav.__emit();
    nav.__emit();
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('App', { screen: 'ProductDetails', params: { productId: 5 } });
    expect(onDone).toHaveBeenCalledWith(true);
  });

  it('gives up safely when the app never mounts', () => {
    const onDone = jest.fn();
    runSplashActionWhenReady(action, onDone);
    jest.advanceTimersByTime(5000);
    nav.__emit();
    expect(nav.navigate).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledWith(false);
  });

  it('can be cancelled (logout) before running', () => {
    const cancel = runSplashActionWhenReady(action);
    cancel();
    (isAppStackMounted as jest.Mock).mockReturnValue(true);
    nav.getRootState.mockReturnValue({ routes: [{ name: 'App' }] });
    nav.__emit();
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('opens approved external links once', () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    runSplashActionWhenReady({ kind: 'external', url: 'https://rewardplanners.com/x' });
    expect(open).toHaveBeenCalledTimes(1);
  });
});

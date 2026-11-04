import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Animated, Image, Modal, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from '../../../../../navigation/RootNavigator';
import { navigationRef } from '../../../../../navigation/navigationRef';
import api from '../../../auth/api/axios';
import { checkAppVersion } from '../../../versionupdate/checkAppVersion';
import { LAUNCH_PROMO_BUDGET_MS, __resetLaunchForTests } from '../launchPresentation';
import { __resetSplashApiForTests } from '../splashApi';
import { __resetFrequencyForTests } from '../splashFrequency';
import { FADE_MS } from '../PromotionalSplashScreen';

function mockScreen(label: string) {
  return () => {
    const { Text: T } = require('react-native');
    return <T>{label}</T>;
  };
}
let mockDashboardRenders = 0;

jest.mock('../../../auth/context/AuthContext', () => {
  const ReactLib = require('react');
  let state: Record<string, any> = {};
  const listeners = new Set<() => void>();
  return {
    useAuth: () =>
      ReactLib.useSyncExternalStore(
        (cb: () => void) => {
          listeners.add(cb);
          return () => listeners.delete(cb);
        },
        () => state,
      ),
    __setAuth: (next: Record<string, any>) => {
      state = { ...state, ...next };
      listeners.forEach(listener => listener());
    },
  };
});
jest.mock('../../../auth/api/axios', () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock('../../../../../config/apiConfig', () => ({ normalizeLocalCmsImageUrl: (url: string) => url || null }));
jest.mock('../../../versionupdate/checkAppVersion', () => ({ checkAppVersion: jest.fn() }));
jest.mock('../../../versionupdate/AppUpdateModal', () => ({
  AppUpdateModal: ({ visible }: { visible: boolean }) => {
    const { Text: T } = require('react-native');
    return visible ? <T>UPDATE_PROMPT</T> : null;
  },
}));
jest.mock('../../../reward/RewardModal', () => ({ RewardModal: () => null }));
jest.mock('../../../notifications/pushPermission', () => ({ shouldOfferPermissionPrompt: jest.fn(() => Promise.resolve(false)) }));
jest.mock('../../../notifications/NotificationPermissionPrompt', () => ({ NotificationPermissionPrompt: () => null }));
jest.mock('../../../../step_counter/context/StepTrackerContext', () => ({ StepTrackerProvider: ({ children }: any) => children }));
jest.mock('../../../../../navigation/MainLayout', () => mockScreen('HOME'));
jest.mock('../../../auth/screens/TermsGateScreen', () => mockScreen('TERMS_GATE'));
jest.mock('../../../auth/screens/LoginScreen', () => mockScreen('LOGIN'));
jest.mock('../../../auth/screens/OTPScreen', () => mockScreen('OTP'));
jest.mock('../../../auth/screens/BiometricLockScreen', () => ({ visible }: { visible: boolean }) => {
  const { Text: T } = require('react-native');
  return visible ? <T>BIOMETRIC</T> : null;
});
jest.mock('../../../../dashboard/dashboard/dashbord', () => () => {
  const { Text: T } = require('react-native');
  mockDashboardRenders += 1;
  return <T>DASHBOARD</T>;
});
jest.mock('../../../../ecommerce/screens/product_description_screen', () => ({ route }: any) => {
  const { Text: T } = require('react-native');
  return <T>{`PRODUCT_${route.params.productId}`}</T>;
});
jest.mock('../../../../ecommerce/api/ProductApi', () => ({ fetchAllCategories: jest.fn(() => Promise.resolve([])) }));
jest.mock('../../../../ecommerce/api/PromotionalApi', () => ({
  fetchBestSellers: jest.fn(() => Promise.resolve([])),
  fetchTopRatedProducts: jest.fn(() => Promise.resolve([])),
  fetchMostViewedProducts: jest.fn(() => Promise.resolve([])),
}));

const { __setAuth: setAuth } = jest.requireMock('../../../auth/context/AuthContext');
const apiGet = api.get as jest.Mock;

const NOW = Date.now();
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();
const response = (data: Record<string, any> = {}, campaign: Record<string, any> | null = {}) => ({
  status: 200,
  data: {
    success: true,
    data: {
      source: 'scheduled_campaign',
      page_key: 'app_launch',
      slot_key: 'promo_splash',
      platform: 'android',
      audience: 'authenticated',
      server_time: iso(0),
      expires_at: iso(86_400_000),
      next_change_at: null,
      cache_ttl_seconds: 300,
      campaign:
        campaign &&
        {
          content_id: 21,
          placement_id: 1,
          title: 'Happy Diwali',
          cta_text: 'Diwali Utsaav',
          image_url: 'https://cdn.rewardplanners.com/diwali.webp',
          display_mode: 'single',
          navigation: null,
          link: null,
          priority: 0,
          starts_at: iso(-86_400_000),
          expires_at: iso(86_400_000),
          display: { frequency_rule: 'every_visit', display_seconds: 3, auto_dismiss: true, dismissible: true },
          ...campaign,
        },
      ...data,
    },
  },
});

const signedIn = { user: { user_id: 7 }, accessToken: 'token', isAuthenticated: true, isInitializing: false, termsAccepted: true, firstLoginReward: null, markFirstLoginRewardShown: jest.fn() };
const restoring = { user: null, accessToken: null, isAuthenticated: false, isInitializing: true, termsAccepted: null, firstLoginReward: null, markFirstLoginRewardShown: jest.fn() };

let renderer: TestRenderer.ReactTestRenderer;
const texts = () => renderer.root.findAllByType(Text).map(node => [node.props.children].flat().join(''));
const has = (label: string) => texts().includes(label);
const promo = () => renderer.root.findAllByType(Image).filter(node => node.props.testID === 'promo-splash-image');
const advance = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};
const mount = async () => {
  await act(async () => {
    renderer = TestRenderer.create(
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>,
    );
  });
  await advance(0);
};
// Cold launch with a stored session: refresh gives a token, then profile+terms.
const coldLaunchSignedIn = async () => {
  setAuth(restoring);
  await mount();
  await act(async () => setAuth({ accessToken: 'token' }));
  await advance(0);
  await act(async () => setAuth(signedIn));
  await advance(0);
};
const showArtwork = async () => {
  await act(async () => promo()[0].props.onLoad());
  await advance(FADE_MS);
};

beforeEach(async () => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockDashboardRenders = 0;
  __resetLaunchForTests();
  __resetSplashApiForTests();
  __resetFrequencyForTests();
  await AsyncStorage.clear();
  (checkAppVersion as jest.Mock).mockReturnValue(new Promise(() => undefined));
  jest.spyOn(Image, 'queryCache').mockResolvedValue({});
  jest.spyOn(Image, 'prefetch').mockResolvedValue(true);
  jest.spyOn(Animated, 'timing').mockImplementation((value: any, config: any) => ({
    start: (cb?: (r: { finished: boolean }) => void) => {
      setTimeout(() => {
        value.setValue(config.toValue);
        cb?.({ finished: true });
      }, config.duration);
    },
    stop: jest.fn(),
    reset: jest.fn(),
  }) as any);
});
afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount());
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('launch presentation in RootNavigator', () => {
  it('replaces the logo splash with a scheduled campaign, then opens the app with no dashboard flash', async () => {
    apiGet.mockResolvedValue(response());
    await coldLaunchSignedIn();

    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(promo()).toHaveLength(1);
    expect(mockDashboardRenders).toBe(0);
    expect(has('BIOMETRIC')).toBe(false);
    expect(renderer.root.findAllByType(Modal)).toHaveLength(0);

    await showArtwork();
    await advance(2999);
    expect(mockDashboardRenders).toBe(0);
    await advance(1);
    expect(promo()).toHaveLength(0);
    expect(has('DASHBOARD')).toBe(true);
    // The biometric gate follows the promotion instead of stacking on it.
    expect(has('BIOMETRIC')).toBe(true);
  });

  it('starts the request during auth restore, before the profile/terms checks finish', async () => {
    apiGet.mockResolvedValue(response());
    setAuth(restoring);
    await mount();
    expect(apiGet).not.toHaveBeenCalled();
    await act(async () => setAuth({ accessToken: 'token' }));
    expect(apiGet).toHaveBeenCalledTimes(1);
  });

  it('shows the CMS default artwork the same way', async () => {
    apiGet.mockResolvedValue(response({ source: 'default' }, { content_id: 5 }));
    await coldLaunchSignedIn();
    expect(promo()[0].props.source.uri).toBe('https://cdn.rewardplanners.com/diwali.webp');
  });

  it('continues straight to the app when the backend returns none', async () => {
    apiGet.mockResolvedValue(response({ source: 'none' }, null));
    await coldLaunchSignedIn();
    expect(promo()).toHaveLength(0);
    expect(has('DASHBOARD')).toBe(true);
  });

  it('never waits past the budget for a slow API, and never shows a late campaign', async () => {
    let resolveLate: (value: unknown) => void = () => undefined;
    apiGet.mockReturnValue(new Promise(resolve => (resolveLate = resolve)));
    await coldLaunchSignedIn();
    expect(has('DASHBOARD')).toBe(false);

    await advance(LAUNCH_PROMO_BUDGET_MS + 1000);
    expect(has('DASHBOARD')).toBe(true);

    resolveLate(response());
    await advance(5000);
    expect(promo()).toHaveLength(0);
    expect(has('DASHBOARD')).toBe(true);
  });

  it('opens the app when the API is unreachable', async () => {
    apiGet.mockRejectedValue(Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }));
    await coldLaunchSignedIn();
    await advance(LAUNCH_PROMO_BUDGET_MS + 1000);
    expect(has('DASHBOARD')).toBe(true);
  });

  it('opens the app when the artwork cannot be downloaded', async () => {
    apiGet.mockResolvedValue(response());
    (Image.prefetch as jest.Mock).mockRejectedValue(new Error('404'));
    await coldLaunchSignedIn();
    expect(promo()).toHaveLength(0);
    expect(has('DASHBOARD')).toBe(true);
  });

  it('never shows an expired campaign', async () => {
    apiGet.mockResolvedValue(response({}, { expires_at: iso(-1000) }));
    await coldLaunchSignedIn();
    expect(promo()).toHaveLength(0);
    expect(has('DASHBOARD')).toBe(true);
  });

  it('suppresses a once_per_day campaign already seen today without substituting another', async () => {
    apiGet.mockResolvedValue(response({}, { display: { frequency_rule: 'once_per_day', display_seconds: 3, auto_dismiss: true, dismissible: true } }));
    await coldLaunchSignedIn();
    await showArtwork();
    await advance(3000);
    expect(has('DASHBOARD')).toBe(true);
    await act(async () => renderer.unmount());

    // Next cold launch, same IST day: only AsyncStorage survives.
    __resetLaunchForTests();
    __resetFrequencyForTests();
    mockDashboardRenders = 0;
    await coldLaunchSignedIn();
    expect(promo()).toHaveLength(0);
    expect(has('DASHBOARD')).toBe(true);
    expect(apiGet).toHaveBeenCalledTimes(2);
  });

  it('does not delay login and makes no request when nobody is signed in', async () => {
    setAuth(restoring);
    await mount();
    await act(async () => setAuth({ isInitializing: false }));
    await advance(0);
    expect(has('LOGIN')).toBe(true);
    expect(apiGet).not.toHaveBeenCalled();

    // Logging in later in the same session never replays a launch promotion.
    apiGet.mockResolvedValue(response());
    await act(async () => setAuth(signedIn));
    await advance(LAUNCH_PROMO_BUDGET_MS);
    expect(has('DASHBOARD')).toBe(true);
    expect(promo()).toHaveLength(0);
  });

  it('keeps the terms gate unblocked and shows no promotion after acceptance', async () => {
    apiGet.mockResolvedValue(response());
    setAuth(restoring);
    await mount();
    await act(async () => setAuth({ ...signedIn, termsAccepted: false }));
    await advance(0);
    expect(has('TERMS_GATE')).toBe(true);

    await act(async () => setAuth({ termsAccepted: true }));
    await advance(LAUNCH_PROMO_BUDGET_MS);
    expect(has('DASHBOARD')).toBe(true);
    expect(promo()).toHaveLength(0);
  });

  it('an update prompt releases the launch hold and wins over the promotion', async () => {
    let showUpdate: (value: unknown) => void = () => undefined;
    (checkAppVersion as jest.Mock).mockReturnValue(new Promise(resolve => (showUpdate = resolve)));
    apiGet.mockResolvedValue(response());
    await coldLaunchSignedIn();
    expect(promo()).toHaveLength(1);

    showUpdate({ success: true, maintenance: false, updateAvailable: true, forceUpdate: false, updateUrl: 'x' });
    await advance(0);
    expect(promo()).toHaveLength(0);
    expect(has('UPDATE_PROMPT')).toBe(true);
    expect(has('DASHBOARD')).toBe(true);
  });

  it('logout during the promotion returns to login and the campaign never reappears', async () => {
    apiGet.mockResolvedValue(response());
    await coldLaunchSignedIn();
    await showArtwork();
    await act(async () => setAuth({ user: null, accessToken: null, isAuthenticated: false, termsAccepted: null }));
    await advance(10_000);
    expect(has('LOGIN')).toBe(true);
    expect(promo()).toHaveLength(0);
  });

  it('logout while still resolving cancels the request', async () => {
    let signal: AbortSignal | undefined;
    apiGet.mockImplementation((_path: string, config: any) => {
      signal = config.signal;
      return new Promise(() => undefined);
    });
    await coldLaunchSignedIn();
    await act(async () => setAuth({ user: null, accessToken: null, isAuthenticated: false, termsAccepted: null }));
    await advance(0);
    expect(signal?.aborted).toBe(true);
    expect(has('LOGIN')).toBe(true);
  });

  it('a token refresh while visible neither restarts nor repeats the promotion', async () => {
    apiGet.mockResolvedValue(response());
    await coldLaunchSignedIn();
    await showArtwork();
    await act(async () => setAuth({ accessToken: 'rotated-token' }));
    await advance(0);
    expect(promo()).toHaveLength(1);
    expect(apiGet).toHaveBeenCalledTimes(1);
    await advance(3000);
    expect(has('DASHBOARD')).toBe(true);
    await act(async () => setAuth({ accessToken: 'rotated-again' }));
    await advance(LAUNCH_PROMO_BUDGET_MS);
    expect(promo()).toHaveLength(0);
  });

  it('a remounted navigator in the same session does not replay the launch', async () => {
    apiGet.mockResolvedValue(response());
    await coldLaunchSignedIn();
    await showArtwork();
    await advance(3000);
    await act(async () => renderer.unmount());
    await mount();
    expect(has('DASHBOARD')).toBe(true);
    expect(promo()).toHaveLength(0);
    expect(apiGet).toHaveBeenCalledTimes(1);
  });

  it('Skip opens the app immediately', async () => {
    apiGet.mockResolvedValue(response());
    await coldLaunchSignedIn();
    await showArtwork();
    const skip = renderer.root.findAll(node => node.props.testID === 'promo-splash-skip' && typeof node.props.onPress === 'function')[0];
    await act(async () => skip.props.onPress());
    await advance(0);
    expect(has('DASHBOARD')).toBe(true);
  });

  it('a CTA tap closes the splash and opens the destination exactly once', async () => {
    apiGet.mockResolvedValue(response({}, { navigation: { destination: 'product_details', targetId: 1125 } }));
    await coldLaunchSignedIn();
    await showArtwork();
    const area = renderer.root.findAll(node => node.props.testID === 'promo-splash-artwork' && typeof node.props.onPress === 'function')[0];
    expect(area.props.disabled).toBe(false);
    await act(async () => area.props.onPress());
    await advance(100);
    await advance(5000);
    const appRoutes: any[] = (navigationRef.getRootState()?.routes[0]?.state?.routes as any[]) ?? [];
    expect(appRoutes.map(route => route.name)).toEqual(['Dashboard', 'ProductDetails']);
    expect(appRoutes[1].params).toEqual({ productId: 1125 });
  });

  it('falls back to a still-valid cached campaign when the network is slow', async () => {
    apiGet.mockResolvedValueOnce(response());
    await coldLaunchSignedIn();
    await showArtwork();
    await advance(3000);
    await act(async () => renderer.unmount());

    __resetLaunchForTests();
    __resetSplashApiForTests();
    (Image.queryCache as jest.Mock).mockResolvedValue({ 'https://cdn.rewardplanners.com/diwali.webp': 'disk' });
    apiGet.mockReturnValue(new Promise(() => undefined));
    await coldLaunchSignedIn();
    await advance(LAUNCH_PROMO_BUDGET_MS);
    await advance(0);
    expect(promo()).toHaveLength(1);
  });
});

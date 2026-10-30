jest.mock('@react-native-firebase/app', () => ({ getApps: () => [{}], getApp: () => ({ options: {} }) }));
jest.mock('@react-native-firebase/messaging', () => ({ getMessaging: jest.fn(), getToken: jest.fn() }));
jest.mock('../../src/modules/common/auth/api/axios', () => ({ __esModule: true, default: { post: jest.fn() } }));

import { PushRegistrar } from '../../src/modules/common/notifications/pushRegistration';

const PRIMARY = 'reward-planners-2324d';
const LEGACY = 'rewardplanners-ebbe4';
const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { response: { status } });
const flush = async () => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
};

const setup = (overrides: Partial<ConstructorParameters<typeof PushRegistrar>[0]> = {}) => {
  const deps = {
    getToken: jest.fn().mockResolvedValue('device-token-AAAAAAAAAAAAAAAA'),
    getProjectId: jest.fn().mockReturnValue(PRIMARY),
    postToken: jest.fn().mockResolvedValue({ success: true, firebase_project_id: PRIMARY }),
    platform: 'android',
    log: jest.fn(),
    ...overrides,
  };
  return { deps, registrar: new PushRegistrar(deps) };
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('PushRegistrar', () => {
  it('registers with the primary project and records backend attribution', async () => {
    const { deps, registrar } = setup();
    registrar.start(1);
    await flush();

    expect(deps.postToken).toHaveBeenCalledWith({
      fcm_token: 'device-token-AAAAAAAAAAAAAAAA',
      device_platform: 'android',
      firebase_project_id: PRIMARY,
    });
    expect(registrar.getStatus()).toEqual(expect.objectContaining({ state: 'registered', backendProjectId: PRIMARY }));
  });

  it('never logs the full FCM token', async () => {
    const { deps, registrar } = setup();
    registrar.start(1);
    await flush();
    const logged = deps.log.mock.calls.map(call => call[0]).join('\n');
    expect(logged).not.toContain('device-token-AAAAAAAAAAAAAAAA');
  });

  it('does not claim attribution when the backend returns a null project', async () => {
    const { registrar } = setup({
      postToken: jest.fn().mockResolvedValue({ success: true, firebase_project_id: null }),
    });
    registrar.start(1);
    await flush();
    expect(registrar.getStatus().state).toBe('registered_unattributed');
  });

  it('reports the real runtime project and never relabels a legacy config as primary', async () => {
    const { deps, registrar } = setup({
      getProjectId: jest.fn().mockReturnValue(LEGACY),
      postToken: jest.fn().mockResolvedValue({ success: true, firebase_project_id: LEGACY }),
    });
    registrar.start(1);
    await flush();

    expect(deps.postToken.mock.calls[0][0].firebase_project_id).toBe(LEGACY);
    expect(registrar.getStatus().state).toBe('registered_unattributed');
  });

  it('retries token retrieval failures with backoff', async () => {
    const getToken = jest.fn()
      .mockRejectedValueOnce(new Error('SERVICE_NOT_AVAILABLE'))
      .mockResolvedValue('device-token-AAAAAAAAAAAAAAAA');
    const { deps, registrar } = setup({ getToken });
    registrar.start(1);
    await flush();
    expect(registrar.getStatus()).toEqual(expect.objectContaining({ state: 'retrying', lastError: 'token_unavailable' }));

    jest.advanceTimersByTime(2000);
    await flush();
    expect(deps.postToken).toHaveBeenCalledTimes(1);
    expect(registrar.getStatus().state).toBe('registered');
  });

  it.each([500, 429, 0])('retries transient backend failure %s', async status => {
    const postToken = jest.fn()
      .mockRejectedValueOnce(status ? httpError(status) : new Error('Network Error'))
      .mockResolvedValue({ firebase_project_id: PRIMARY });
    const { registrar } = setup({ postToken });
    registrar.start(1);
    await flush();
    expect(registrar.getStatus().state).toBe('retrying');

    jest.advanceTimersByTime(2000);
    await flush();
    expect(postToken).toHaveBeenCalledTimes(2);
  });

  it.each([400, 401, 403])('does not retry on HTTP %s', async status => {
    const postToken = jest.fn().mockRejectedValue(httpError(status));
    const { registrar } = setup({ postToken });
    registrar.start(1);
    await flush();
    jest.advanceTimersByTime(120000);
    await flush();

    expect(postToken).toHaveBeenCalledTimes(1);
    expect(registrar.getStatus()).toEqual(expect.objectContaining({ state: 'failed', lastError: `http_${status}` }));
  });

  it('stops after a bounded number of attempts', async () => {
    const postToken = jest.fn().mockRejectedValue(httpError(503));
    const { registrar } = setup({ postToken });
    registrar.start(1);
    for (let i = 0; i < 10; i += 1) {
      await flush();
      jest.advanceTimersByTime(60000);
    }
    await flush();
    expect(postToken).toHaveBeenCalledTimes(5);
    expect(registrar.getStatus().state).toBe('failed');
  });

  it('ignores a response that lands after the account switched', async () => {
    let resolveFirst: (v: any) => void = () => undefined;
    const postToken = jest.fn()
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve; }))
      .mockResolvedValue({ firebase_project_id: PRIMARY });
    const { registrar } = setup({ postToken });

    registrar.start(1);
    await flush();
    registrar.start(2);
    await flush();
    resolveFirst({ firebase_project_id: null });
    await flush();

    expect(postToken).toHaveBeenCalledTimes(2);
    expect(registrar.getStatus().state).toBe('registered');
  });

  it('cancels pending retries on logout', async () => {
    const postToken = jest.fn().mockRejectedValue(httpError(500));
    const { registrar } = setup({ postToken });
    registrar.start(1);
    await flush();
    registrar.stop();
    jest.advanceTimersByTime(120000);
    await flush();

    expect(postToken).toHaveBeenCalledTimes(1);
    expect(registrar.getStatus().state).toBe('idle');
  });

  it('registers a refreshed token and skips an unchanged one', async () => {
    const { deps, registrar } = setup();
    registrar.start(1);
    await flush();

    registrar.handleTokenRefresh('device-token-AAAAAAAAAAAAAAAA');
    await flush();
    expect(deps.postToken).toHaveBeenCalledTimes(1);

    registrar.handleTokenRefresh('device-token-BBBBBBBBBBBBBBBB');
    await flush();
    expect(deps.postToken).toHaveBeenCalledTimes(2);
    expect(deps.postToken.mock.calls[1][0].fcm_token).toBe('device-token-BBBBBBBBBBBBBBBB');
    expect(registrar.getLastToken()).toBe('device-token-BBBBBBBBBBBBBBBB');
  });

  it('does not re-register a fresh registration on every resume', async () => {
    const { deps, registrar } = setup();
    registrar.start(1);
    await flush();
    registrar.revalidate();
    registrar.start(1);
    await flush();
    expect(deps.postToken).toHaveBeenCalledTimes(1);
  });

  it('recovers a transient failure when the network returns', async () => {
    const postToken = jest.fn()
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue({ firebase_project_id: PRIMARY });
    const { registrar } = setup({ postToken });
    registrar.start(1);
    await flush();
    registrar.retryIfPending();
    await flush();
    expect(postToken).toHaveBeenCalledTimes(2);
    expect(registrar.getStatus().state).toBe('registered');
  });
});

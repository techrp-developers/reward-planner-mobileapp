import { Platform } from "react-native";
import { getMessaging, getToken } from "@react-native-firebase/messaging";
import api from "../auth/api/axios";
import {
  getRuntimeFirebaseProjectId,
  isFirebaseConfigured,
  isPrimaryFirebaseProject,
  maskToken,
} from "./pushConfig";

export type PushRegistrationState =
  | "idle"
  | "registering"
  // Backend confirmed the token AND echoed the primary project id.
  | "registered"
  // Backend stored the token but did not confirm project attribution (older
  // backend, unknown project, or a non-primary google-services.json).
  | "registered_unattributed"
  | "retrying"
  | "failed";

export type PushRegistrationStatus = {
  state: PushRegistrationState;
  runtimeProjectId: string | null;
  backendProjectId: string | null;
  lastError: string | null;
  updatedAt: number;
};

type RegistrarDeps = {
  getToken: () => Promise<string>;
  getProjectId: () => string | null;
  postToken: (body: Record<string, string>) => Promise<any>;
  platform: string;
  now?: () => number;
  log?: (message: string) => void;
};

const MAX_ATTEMPTS = 5;
const BASE_RETRY_MS = 2000;
const MAX_RETRY_MS = 60000;
// A signed-in app that resumes after this long re-confirms its registration.
const REVALIDATE_MS = 12 * 60 * 60 * 1000;

const errorStatus = (error: any) => Number(error?.response?.status || 0);

// Offline, timeouts, rate limiting and server errors are worth retrying;
// 400/401/403 will not succeed by repeating the same request.
const isRetryable = (status: number) => status === 0 || status === 429 || status >= 500;

export class PushRegistrar {
  private generation = 0;
  private userId: number | null = null;
  private attempts = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private inFlight: Promise<void> | null = null;
  private lastToken: string | null = null;
  private lastSuccess: { userId: number; token: string; at: number } | null = null;
  private lastFailureStatus = 0;
  private status: PushRegistrationStatus;
  private readonly now: () => number;

  constructor(private readonly deps: RegistrarDeps) {
    this.now = deps.now ?? Date.now;
    this.status = this.makeStatus("idle");
  }

  start(userId: number) {
    if (this.userId === userId && this.generation > 0 && this.status.state !== "idle") {
      this.revalidate();
      return;
    }
    this.resetForUser(userId);
    this.run(this.generation, null, true);
  }

  // Logout or account switch: drop timers and ignore any response still in flight.
  stop() {
    this.resetForUser(null);
    this.lastSuccess = null;
    this.status = this.makeStatus("idle");
  }

  handleTokenRefresh(token: string) {
    if (!token) return;
    this.lastToken = token;
    if (this.userId === null) return;
    this.attempts = 0;
    // Skips the call when this exact token is already confirmed for this user.
    this.run(this.generation, token, false);
  }

  // Network recovered: resume a registration that previously failed transiently.
  retryIfPending() {
    if (this.userId === null) return;
    if (this.status.state === "retrying" || (this.status.state === "failed" && isRetryable(this.lastFailureStatus))) {
      this.clearRetry();
      this.attempts = 0;
      this.run(this.generation, null, true);
    }
  }

  // App returned to foreground: re-register only when the last confirmation is old.
  revalidate() {
    if (this.userId === null) return;
    const fresh = this.lastSuccess && this.now() - this.lastSuccess.at < REVALIDATE_MS;
    if (fresh) return;
    this.retryIfPending();
    if (this.status.state !== "retrying" && !this.inFlight) this.run(this.generation, null, true);
  }

  getStatus = () => this.status;

  getLastToken = () => this.lastToken;

  private resetForUser(userId: number | null) {
    this.generation += 1;
    this.userId = userId;
    this.attempts = 0;
    this.inFlight = null;
    this.clearRetry();
  }

  private clearRetry() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private makeStatus(
    state: PushRegistrationState,
    patch: Partial<PushRegistrationStatus> = {},
  ): PushRegistrationStatus {
    return {
      state,
      runtimeProjectId: this.deps.getProjectId(),
      backendProjectId: null,
      lastError: null,
      updatedAt: this.now(),
      ...patch,
    };
  }

  private run(generation: number, tokenOverride: string | null, force: boolean) {
    if (this.inFlight && !tokenOverride) return this.inFlight;
    const task = this.register(generation, tokenOverride, force).finally(() => {
      if (this.inFlight === task) this.inFlight = null;
    });
    this.inFlight = task;
    return task;
  }

  private async register(generation: number, tokenOverride: string | null, force: boolean) {
    const userId = this.userId;
    if (userId === null) return;

    this.status = this.makeStatus("registering");
    this.attempts += 1;

    let token: string;
    try {
      token = tokenOverride || (await this.deps.getToken());
      if (!token) throw new Error("Firebase returned an empty registration token");
    } catch (error: any) {
      if (generation !== this.generation) return;
      this.lastFailureStatus = 0;
      this.fail(generation, "token_unavailable", 0, error);
      return;
    }

    if (generation !== this.generation) return;
    this.lastToken = token;

    const alreadyConfirmed =
      !force &&
      this.lastSuccess?.userId === userId &&
      this.lastSuccess.token === token &&
      this.now() - this.lastSuccess.at < REVALIDATE_MS;
    if (alreadyConfirmed) return;

    const projectId = this.deps.getProjectId();
    const body: Record<string, string> = {
      fcm_token: token,
      device_platform: this.deps.platform,
    };
    // Report the project the token actually came from. A missing value is
    // better than a guessed one: the backend treats it as unknown.
    if (projectId) body.firebase_project_id = projectId;

    try {
      const response = await this.deps.postToken(body);
      if (generation !== this.generation) return;

      const backendProjectId =
        typeof response?.firebase_project_id === "string" ? response.firebase_project_id : null;
      const attributed =
        isPrimaryFirebaseProject(projectId) && backendProjectId === projectId;

      this.attempts = 0;
      this.lastSuccess = { userId, token, at: this.now() };
      this.status = this.makeStatus(attributed ? "registered" : "registered_unattributed", {
        backendProjectId,
      });
      this.deps.log?.(
        `[Push] Registered ${maskToken(token)} for user ${userId}; ` +
          `runtime project=${projectId ?? "unknown"}, backend project=${backendProjectId ?? "null"}`,
      );
    } catch (error: any) {
      if (generation !== this.generation) return;
      const status = errorStatus(error);
      this.lastFailureStatus = status;
      this.fail(generation, status ? `http_${status}` : "network_error", status, error);
    }
  }

  private fail(generation: number, reason: string, status: number, error: any) {
    const canRetry = isRetryable(status) && this.attempts < MAX_ATTEMPTS;
    this.status = this.makeStatus(canRetry ? "retrying" : "failed", { lastError: reason });
    this.deps.log?.(`[Push] Registration ${reason} (attempt ${this.attempts}): ${error?.message || error}`);

    if (!canRetry) return;
    const delay = Math.min(BASE_RETRY_MS * 2 ** (this.attempts - 1), MAX_RETRY_MS);
    this.clearRetry();
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (generation === this.generation) this.run(generation, null, true);
    }, delay);
  }
}

export const pushRegistrar = new PushRegistrar({
  getToken: () => getToken(getMessaging()),
  getProjectId: getRuntimeFirebaseProjectId,
  postToken: async body => (await api.post("/v1/auth/update-fcm-token", body)).data,
  platform: Platform.OS === "ios" ? "ios" : "android",
  log: message => __DEV__ && console.log(message),
});

// Logout needs this device's token so the backend unlinks only this device.
export const getPushTokenForLogout = async (timeoutMs = 3000): Promise<string | null> => {
  const cached = pushRegistrar.getLastToken();
  if (cached || !isFirebaseConfigured()) return cached;

  try {
    return await Promise.race([
      getToken(getMessaging()),
      new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutMs)),
    ]);
  } catch {
    return null;
  }
};

import AsyncStorage from "@react-native-async-storage/async-storage";
import { DevSettings } from "react-native";
import type { SplashCampaign } from "./splashTypes";
import { splashLog } from "./splashLog";

// All dates are judged on the server's clock (offset learned from the last
// `server_time`) so a wrong device clock cannot replay or hide a campaign.
let serverOffsetMs = 0;

export const recordServerTime = (serverTimeIso: string, receivedAtMs = Date.now()) => {
  const serverMs = Date.parse(serverTimeIso);
  if (Number.isFinite(serverMs)) serverOffsetMs = serverMs - receivedAtMs;
};

export const getServerNow = () => Date.now() + serverOffsetMs;

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// Calendar day in India Standard Time, e.g. "2026-11-04".
export const istDayKey = (epochMs: number) => new Date(epochMs + IST_OFFSET_MS).toISOString().slice(0, 10);

const STORAGE_KEY = "@rp_splash_frequency_v1";
// Day records older than this can no longer suppress anything.
const RETAIN_DAYS = 3;

type Scope = { userScope: string; pageKey: string; slotKey: string };

// Per-user, per-placement, per-campaign identity. Never contains tokens.
export const frequencyKey = ({ userScope, pageKey, slotKey }: Scope, campaign: SplashCampaign) =>
  [userScope, pageKey, slotKey, campaign.placement_id, campaign.content_id].join("|");

// "Session" is the JS runtime: it starts on a cold launch and survives
// background/foreground switches, so it resets only when Android kills the app.
const shownThisSession = new Set<string>();
let dayRecords: Record<string, string> = {};
let loadPromise: Promise<void> | null = null;

export const loadFrequencyHistory = () => {
  loadPromise ??= AsyncStorage.getItem(STORAGE_KEY)
    .then(raw => {
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") dayRecords = parsed;
    })
    .catch(() => undefined);
  return loadPromise;
};

export const shouldDisplayCampaign = (scope: Scope, campaign: SplashCampaign, serverNow = getServerNow()) => {
  const key = frequencyKey(scope, campaign);
  const rule = campaign.display.frequency_rule;
  let allowed = true;
  if (rule === "once_per_session") allowed = !shownThisSession.has(key);
  else if (rule === "once_per_day") allowed = dayRecords[key] !== istDayKey(serverNow);
  splashLog("FREQUENCY_CHECK", { contentId: campaign.content_id, rule, allowed, istDay: istDayKey(serverNow) });
  return allowed;
};

// Called only once the artwork is actually visible on screen.
export const markCampaignShown = async (scope: Scope, campaign: SplashCampaign, serverNow = getServerNow()) => {
  const key = frequencyKey(scope, campaign);
  shownThisSession.add(key);
  if (campaign.display.frequency_rule !== "once_per_day") return;

  await loadFrequencyHistory();
  const oldest = istDayKey(serverNow - RETAIN_DAYS * 24 * 60 * 60 * 1000);
  dayRecords = Object.fromEntries(Object.entries(dayRecords).filter(([, day]) => day >= oldest));
  dayRecords[key] = istDayKey(serverNow);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dayRecords)).catch(() => undefined);
};

// Debug builds only: forget splash history (optionally one campaign) without
// touching auth or any other app storage.
export const clearSplashFrequencyHistory = async (contentId?: number) => {
  if (!__DEV__) return;
  await loadFrequencyHistory();
  const matches = (key: string) => contentId === undefined || key.endsWith(`|${contentId}`);
  [...shownThisSession].filter(matches).forEach(key => shownThisSession.delete(key));
  dayRecords = Object.fromEntries(Object.entries(dayRecords).filter(([key]) => !matches(key)));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dayRecords)).catch(() => undefined);
};

// Dev-menu entry; addMenu exists at runtime in debug builds but is untyped.
if (__DEV__ && process.env.NODE_ENV !== "test") {
  const devMenu = DevSettings as unknown as { addMenu?: (title: string, handler: () => void) => void };
  devMenu?.addMenu?.("Reset launch splash frequency", () => {
    clearSplashFrequencyHistory().then(() => console.log("[RP_SPLASH_ANDROID] frequency history cleared"));
  });
}

// Test-only reset of module state.
export const __resetFrequencyForTests = () => {
  shownThisSession.clear();
  dayRecords = {};
  loadPromise = null;
  serverOffsetMs = 0;
};

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image, Platform } from "react-native";
import api from "../../auth/api/axios";
import { normalizeLocalCmsImageUrl } from "../../../../config/apiConfig";
import { getServerNow, recordServerTime } from "./splashFrequency";
import { splashLog } from "./splashLog";
import {
  SPLASH_PAGE_KEY,
  SPLASH_SLOT_KEY,
  type ResolvedSplash,
  type ResolvedSplashResponse,
  type SplashCampaign,
  type SplashFrequencyRule,
} from "./splashTypes";

// The backend picks the audience from the bearer token the shared client
// attaches, so no audience parameter is sent.
const SPLASH_PATH = "/content/splashscreens/resolved";
// Generous on purpose: a response that misses this launch's wait still
// refreshes the cache and warms the artwork for the next launch.
const REQUEST_TIMEOUT_MS = 8000;

const FREQUENCY_RULES: SplashFrequencyRule[] = ["once_per_session", "once_per_day", "every_visit"];
const SOURCES = ["scheduled_campaign", "default", "none"];

const toTime = (iso: string | null | undefined) => (iso ? Date.parse(iso) : NaN);

const isAllowedImageUrl = (url: string) => /^https:\/\//i.test(url) || (__DEV__ && /^http:\/\//i.test(url));

const parseCampaign = (raw: any): SplashCampaign | null => {
  if (!raw || typeof raw !== "object") return null;
  const imageUrl = normalizeLocalCmsImageUrl(raw.image_url);
  const contentId = Number(raw.content_id);
  const display = raw.display ?? {};
  if (!imageUrl || !isAllowedImageUrl(imageUrl) || !Number.isFinite(contentId)) return null;

  return {
    content_id: contentId,
    placement_id: Number(raw.placement_id) || 0,
    title: typeof raw.title === "string" ? raw.title : "",
    cta_text: typeof raw.cta_text === "string" ? raw.cta_text : null,
    image_url: imageUrl,
    display_mode: typeof raw.display_mode === "string" ? raw.display_mode : "single",
    navigation: raw.navigation && typeof raw.navigation === "object" ? raw.navigation : null,
    link: typeof raw.link === "string" ? raw.link : null,
    priority: Number(raw.priority) || 0,
    starts_at: typeof raw.starts_at === "string" ? raw.starts_at : null,
    expires_at: typeof raw.expires_at === "string" ? raw.expires_at : null,
    display: {
      // An unknown rule falls back to the most conservative one.
      frequency_rule: FREQUENCY_RULES.includes(display.frequency_rule) ? display.frequency_rule : "once_per_session",
      display_seconds: Number(display.display_seconds),
      auto_dismiss: display.auto_dismiss !== false,
      dismissible: display.dismissible !== false,
    },
  };
};

export const parseResolvedSplash = (body: ResolvedSplashResponse | undefined): ResolvedSplash | null => {
  const data: any = body?.success ? body.data : null;
  if (!data || !SOURCES.includes(data.source)) return null;
  const campaign = data.source === "none" ? null : parseCampaign(data.campaign);
  return {
    source: campaign ? data.source : "none",
    page_key: String(data.page_key ?? SPLASH_PAGE_KEY),
    slot_key: String(data.slot_key ?? SPLASH_SLOT_KEY),
    platform: String(data.platform ?? Platform.OS),
    audience: String(data.audience ?? ""),
    server_time: String(data.server_time ?? ""),
    expires_at: data.expires_at ?? null,
    next_change_at: data.next_change_at ?? null,
    cache_ttl_seconds: Math.max(0, Number(data.cache_ttl_seconds) || 0),
    campaign,
  };
};

// Server-clock check; the backend already filtered the schedule, this only
// protects a response that sat in cache or on screen past its window.
export const isCampaignLive = (campaign: SplashCampaign, serverNow = getServerNow()) => {
  const startsAt = toTime(campaign.starts_at);
  const expiresAt = toTime(campaign.expires_at);
  return !(startsAt > serverNow) && !(expiresAt <= serverNow);
};

export const fetchResolvedSplash = async (signal?: AbortSignal): Promise<ResolvedSplash | null> => {
  const startedAt = Date.now();
  splashLog("API_REQUEST_STARTED", { path: SPLASH_PATH });
  try {
    const response = await api.get<ResolvedSplashResponse>(SPLASH_PATH, {
      params: { page_key: SPLASH_PAGE_KEY, slot_key: SPLASH_SLOT_KEY, platform: "android" },
      signal,
      timeout: REQUEST_TIMEOUT_MS,
    });
    const resolved = parseResolvedSplash(response.data);
    if (resolved?.server_time) recordServerTime(resolved.server_time);
    splashLog("API_RESPONSE_RECEIVED", {
      status: response.status,
      ms: Date.now() - startedAt,
      source: resolved?.source ?? "invalid",
      audience: resolved?.audience,
      contentId: resolved?.campaign?.content_id ?? null,
    });
    return resolved;
  } catch (error: any) {
    splashLog("API_REQUEST_FAILED", {
      ms: Date.now() - startedAt,
      status: error?.response?.status ?? null,
      code: error?.code ?? null,
    });
    throw error;
  }
};

// ─── Expiry-aware cache ─────────────────────────────────────────────────────
// Used only when this launch's request is slow or offline. A record is valid
// until the earliest of its TTL, the slot's next change and the expiries.

const CACHE_KEY = "@rp_splash_resolved_v1";

type CacheRecord = { userScope: string; resolved: ResolvedSplash; validUntil: number };

export const cacheValidUntil = (resolved: ResolvedSplash) => {
  const serverTime = toTime(resolved.server_time);
  const limits = [
    serverTime + resolved.cache_ttl_seconds * 1000,
    toTime(resolved.expires_at),
    toTime(resolved.next_change_at),
    toTime(resolved.campaign?.expires_at),
  ].filter(Number.isFinite);
  return Number.isFinite(serverTime) && resolved.cache_ttl_seconds > 0 ? Math.min(...limits) : 0;
};

export const writeCachedSplash = async (userScope: string, resolved: ResolvedSplash) => {
  const validUntil = cacheValidUntil(resolved);
  if (validUntil <= getServerNow()) {
    cachedRecordPromise = Promise.resolve(null);
    return AsyncStorage.removeItem(CACHE_KEY).catch(() => undefined);
  }
  const record: CacheRecord = { userScope, resolved, validUntil };
  cachedRecordPromise = Promise.resolve(record);
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(record)).catch(() => undefined);
};

let cachedRecordPromise: Promise<CacheRecord | null> | null = null;

const readCacheRecord = () => {
  cachedRecordPromise ??= AsyncStorage.getItem(CACHE_KEY)
    .then(raw => (raw ? (JSON.parse(raw) as CacheRecord) : null))
    .catch(() => null);
  return cachedRecordPromise;
};

export const readCachedSplash = async (userScope: string): Promise<ResolvedSplash | null> => {
  const record = await readCacheRecord();
  if (!record || record.userScope !== userScope || record.validUntil <= getServerNow()) return null;
  return record.resolved;
};

// ─── Artwork prefetch ───────────────────────────────────────────────────────
// One download per URL per process; artwork already in Fresco's cache is ready
// immediately.

const prefetches = new Map<string, Promise<boolean>>();

export const prefetchArtwork = (url: string): Promise<boolean> => {
  const existing = prefetches.get(url);
  if (existing) return existing;

  const startedAt = Date.now();
  splashLog("IMAGE_PREFETCH_STARTED", { url });
  const task = (Image.queryCache ? Image.queryCache([url]).catch(() => ({})) : Promise.resolve({} as Record<string, string>))
    .then(cached => (cached[url] ? true : Image.prefetch(url)))
    .then(
      ok => {
        splashLog("IMAGE_PREFETCH_FINISHED", { ok, ms: Date.now() - startedAt });
        return Boolean(ok);
      },
      () => {
        splashLog("IMAGE_PREFETCH_FINISHED", { ok: false, ms: Date.now() - startedAt });
        prefetches.delete(url);
        return false;
      },
    );
  prefetches.set(url, task);
  return task;
};

// Warm last launch's artwork while auth restores, before any request is made.
export const warmCachedArtwork = () =>
  readCacheRecord().then(record => {
    const url = record && record.validUntil > getServerNow() ? record.resolved.campaign?.image_url : null;
    if (url) prefetchArtwork(url);
  });

export const __resetSplashApiForTests = () => {
  prefetches.clear();
  cachedRecordPromise = null;
};

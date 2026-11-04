import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchResolvedSplash,
  isCampaignLive,
  prefetchArtwork,
  readCachedSplash,
  warmCachedArtwork,
  writeCachedSplash,
} from "./splashApi";
import { getServerNow, loadFrequencyHistory, markCampaignShown, shouldDisplayCampaign } from "./splashFrequency";
import { splashLog } from "./splashLog";
import { resolveSplashAction, runSplashActionWhenReady, type SplashAction } from "./splashNavigation";
import {
  SPLASH_PAGE_KEY,
  SPLASH_SLOT_KEY,
  type LaunchPhase,
  type ResolvedSplash,
  type SplashCampaign,
  type SplashDismissReason,
} from "./splashTypes";

// How long the launch may wait, once the user could otherwise enter the app,
// for the campaign response and its artwork. The request starts during auth
// restore, so most of its time overlaps startup that happens anyway.
export const LAUNCH_PROMO_BUDGET_MS = 1500;
// Extra bounded checks (cache, stored frequency) after the budget.
const LOCAL_CHECK_MS = 200;

// Where the user goes once startup gates resolve:
//   pending  auth restore or terms check still running (logo splash)
//   app      main app; the only destination that can show a promotion
//   other    login or terms acceptance; never delayed by a promotion
export type LaunchDestination = "pending" | "app" | "other";

type LaunchInput = {
  isInitializing: boolean;
  hasSession: boolean;
  destination: LaunchDestination;
  userId: number | null;
  // An update/maintenance notice takes priority over a promotion.
  interrupted: boolean;
};

export type LaunchPresentation = {
  phase: LaunchPhase;
  holding: boolean;
  campaign: SplashCampaign | null;
  actionable: boolean;
  onShown: () => void;
  onFinish: (reason: SplashDismissReason) => void;
};

type Prepared = { resolved: ResolvedSplash | null; imageReady: boolean };

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | null> =>
  new Promise(resolve => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });

const userScopeOf = (userId: number) => `u${userId}`;
const frequencyScope = (userId: number) => ({ userScope: userScopeOf(userId), pageKey: SPLASH_PAGE_KEY, slotKey: SPLASH_SLOT_KEY });

// One launch presentation per JS runtime: remounts, auth refreshes and
// re-logins never replay it.
let launchConsumed = false;

export function useLaunchPresentation({ isInitializing, hasSession, destination, userId, interrupted }: LaunchInput): LaunchPresentation {
  const [phase, setPhase] = useState<LaunchPhase>(() => (launchConsumed ? "finished" : "initializing"));
  const [campaign, setCampaign] = useState<SplashCampaign | null>(null);
  const phaseRef = useRef(phase);
  const abortRef = useRef<AbortController | null>(null);
  const preparationRef = useRef<Promise<Prepared | null> | null>(null);
  const pendingCacheWriteRef = useRef<ResolvedSplash | null>(null);
  const userIdRef = useRef(userId);
  const actionRef = useRef<SplashAction | null>(null);
  const cancelActionRef = useRef<(() => void) | null>(null);
  const decidingRef = useRef(false);
  userIdRef.current = userId;

  const moveTo = useCallback((next: LaunchPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const finishLaunch = useCallback(
    (reason: string, { abort = false } = {}) => {
      if (phaseRef.current === "finished") return;
      launchConsumed = true;
      if (abort) {
        abortRef.current?.abort();
        pendingCacheWriteRef.current = null;
      }
      if (reason !== "dismissed") splashLog("CAMPAIGN_SKIPPED_SELECTION", { reason });
      moveTo("finished");
    },
    [moveTo],
  );

  const flushCacheWrite = useCallback(() => {
    const resolved = pendingCacheWriteRef.current;
    const id = userIdRef.current;
    if (!resolved || id === null || abortRef.current?.signal.aborted) return;
    pendingCacheWriteRef.current = null;
    writeCachedSplash(userScopeOf(id), resolved);
  }, []);

  useEffect(() => {
    if (phaseRef.current === "finished") return;
    splashLog("LAUNCH_STARTED");
    warmCachedArtwork();
    loadFrequencyHistory();
  }, []);

  useEffect(() => {
    if (!isInitializing) splashLog("AUTH_READY", { destination });
  }, [isInitializing, destination]);

  useEffect(flushCacheWrite, [userId, flushCacheWrite]);

  // Start resolving as soon as the request can carry the restored session (so
  // the backend sees the right audience), while auth/terms still finish.
  useEffect(() => {
    if (phase !== "initializing") return;
    if (destination === "other") {
      finishLaunch("not_entering_app");
      return;
    }
    if (!hasSession && isInitializing) return;
    if (!hasSession) {
      finishLaunch("no_session");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    // Resolves null on failure, like a timeout, so the app just continues.
    preparationRef.current = fetchResolvedSplash(controller.signal)
      .then(async resolved => {
        if (controller.signal.aborted) return null;
        pendingCacheWriteRef.current = resolved;
        flushCacheWrite();
        const url = resolved?.campaign?.image_url;
        // Kept downloading even past this launch's budget: it warms the next one.
        const imageReady = url ? await prefetchArtwork(url) : false;
        return { resolved, imageReady };
      })
      .catch(() => null);
    moveTo("resolving_campaign");
  }, [phase, destination, hasSession, isInitializing, finishLaunch, flushCacheWrite, moveTo]);

  // Logout, losing eligibility or an update notice releases the hold at once.
  useEffect(() => {
    if (phase === "finished") return;
    if (interrupted) finishLaunch("update_prompt", { abort: true });
    else if (destination === "other" && phase !== "initializing") finishLaunch("not_entering_app", { abort: true });
  }, [interrupted, destination, phase, finishLaunch]);

  // Once the user could enter the app, wait a bounded time for a ready campaign.
  useEffect(() => {
    if (destination !== "app" || phase !== "resolving_campaign" || decidingRef.current || userId === null) return;
    decidingRef.current = true;
    splashLog("LAUNCH_HOLDING", { budgetMs: LAUNCH_PROMO_BUDGET_MS });
    const scope = frequencyScope(userId);

    (async () => {
      const network = await withTimeout(preparationRef.current ?? Promise.resolve(null), LAUNCH_PROMO_BUDGET_MS);
      let resolved = network?.resolved ?? null;
      let imageReady = network?.imageReady ?? false;

      // Slow or offline: fall back to a still-valid cached resolution whose
      // artwork is already on disk. A fresh "none" is never overridden.
      if (!network) {
        const cached = await withTimeout(readCachedSplash(scope.userScope), LOCAL_CHECK_MS);
        if (cached?.campaign) {
          resolved = cached;
          imageReady = (await withTimeout(prefetchArtwork(cached.campaign.image_url), LOCAL_CHECK_MS)) ?? false;
        }
      }
      await withTimeout(loadFrequencyHistory(), LOCAL_CHECK_MS);
      if (phaseRef.current !== "resolving_campaign") return;

      const selected = resolved?.campaign ?? null;
      if (!network && !selected) return finishLaunch("timeout_or_unavailable");
      if (!selected) return finishLaunch("no_campaign");
      splashLog("CAMPAIGN_SELECTED", { source: resolved?.source, contentId: selected.content_id, fromCache: !network });
      if (!isCampaignLive(selected, getServerNow())) return finishLaunch("expired");
      // A suppressed campaign is not replaced by another: startup just continues.
      if (!shouldDisplayCampaign(scope, selected)) return finishLaunch("frequency");
      if (!imageReady) return finishLaunch("image_unavailable");

      actionRef.current = resolveSplashAction(selected);
      setCampaign(selected);
      splashLog("CAMPAIGN_READY", { contentId: selected.content_id, actionable: Boolean(actionRef.current) });
      moveTo("campaign_ready");
    })();
  }, [destination, phase, userId, finishLaunch, moveTo]);

  const onShown = useCallback(() => {
    if (phaseRef.current !== "campaign_ready" || !campaign || userIdRef.current === null) return;
    moveTo("campaign_visible");
    splashLog("CAMPAIGN_SHOWN", { contentId: campaign.content_id, rule: campaign.display.frequency_rule });
    markCampaignShown(frequencyScope(userIdRef.current), campaign);
  }, [campaign, moveTo]);

  const onFinish = useCallback(
    (reason: SplashDismissReason) => {
      if (phaseRef.current !== "campaign_ready" && phaseRef.current !== "campaign_visible") return;
      const action = reason === "cta" ? actionRef.current : null;
      finishLaunch("dismissed");
      if (action) cancelActionRef.current = runSplashActionWhenReady(action);
    },
    [finishLaunch],
  );

  useEffect(() => {
    if (destination === "other") cancelActionRef.current?.();
  }, [destination]);

  // NetworkGuard unmounts the navigator while offline. Once a decision has
  // started, coming back online goes straight to the app, never a late replay.
  useEffect(() => () => {
    if (decidingRef.current) launchConsumed = true;
    abortRef.current?.abort();
    cancelActionRef.current?.();
  }, []);

  const holding = destination === "app" && phase !== "finished";
  const openedRef = useRef(false);
  useEffect(() => {
    if (destination === "app" && phase === "finished" && !openedRef.current) {
      openedRef.current = true;
      splashLog("MAIN_APP_OPENED");
    }
  }, [destination, phase]);

  return useMemo(
    () => ({ phase, holding, campaign, actionable: Boolean(actionRef.current), onShown, onFinish }),
    [phase, holding, campaign, onShown, onFinish],
  );
}

const LaunchPresentationContext = createContext<LaunchPresentation | null>(null);
export const LaunchPresentationProvider = LaunchPresentationContext.Provider;
export const useLaunchPresentationContext = () => useContext(LaunchPresentationContext);

export const __resetLaunchForTests = () => {
  launchConsumed = false;
};

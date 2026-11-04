// Debug-build launch diagnostics, readable in `adb logcat -s ReactNativeJS`.
// Never pass tokens or personal data; ids, timings and reasons only.
export type SplashLogEvent =
  | "LAUNCH_STARTED"
  | "AUTH_READY"
  | "API_REQUEST_STARTED"
  | "API_RESPONSE_RECEIVED"
  | "API_REQUEST_FAILED"
  | "CAMPAIGN_SELECTED"
  | "CAMPAIGN_SKIPPED_SELECTION"
  | "FREQUENCY_CHECK"
  | "IMAGE_PREFETCH_STARTED"
  | "IMAGE_PREFETCH_FINISHED"
  | "CAMPAIGN_READY"
  | "LAUNCH_HOLDING"
  | "IMAGE_LOADED"
  | "FADE_COMPLETED"
  | "CAMPAIGN_SHOWN"
  | "CAMPAIGN_SKIPPED"
  | "CAMPAIGN_CLOSED"
  | "MAIN_APP_OPENED";

const launchStartedAt = Date.now();

export const splashLog = (event: SplashLogEvent, details?: Record<string, unknown>) => {
  if (!__DEV__ || process.env.NODE_ENV === "test") return;
  console.log(`[RP_SPLASH_ANDROID] ${event} +${Date.now() - launchStartedAt}ms`, details ?? "");
};

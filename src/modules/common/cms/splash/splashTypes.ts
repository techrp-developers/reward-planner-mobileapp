// Contract of GET /content/splashscreens/resolved. The backend owns campaign
// selection (schedule, priority, platform, audience, defaults); the app only
// renders what it returns and applies the per-device display frequency.

export const SPLASH_PAGE_KEY = "app_launch";
export const SPLASH_SLOT_KEY = "promo_splash";

export type SplashSource = "scheduled_campaign" | "default" | "none";

export type SplashFrequencyRule = "once_per_session" | "once_per_day" | "every_visit";

export type SplashDisplay = {
  frequency_rule: SplashFrequencyRule;
  display_seconds: number;
  auto_dismiss: boolean;
  dismissible: boolean;
};

export type SplashNavigationTarget = {
  destination: string;
  targetId?: number | string | null;
  contentId?: number | string | null;
  title?: string | null;
};

export type SplashCampaign = {
  content_id: number;
  placement_id: number;
  title: string;
  cta_text: string | null;
  image_url: string;
  display_mode: string;
  navigation: SplashNavigationTarget | null;
  link: string | null;
  priority: number;
  starts_at: string | null;
  expires_at: string | null;
  display: SplashDisplay;
};

export type ResolvedSplash = {
  source: SplashSource;
  page_key: string;
  slot_key: string;
  platform: string;
  audience: string;
  server_time: string;
  expires_at: string | null;
  next_change_at: string | null;
  cache_ttl_seconds: number;
  campaign: SplashCampaign | null;
};

export type ResolvedSplashResponse = {
  success: boolean;
  data?: ResolvedSplash;
};

export type LaunchPhase =
  | "initializing"
  | "resolving_campaign"
  | "campaign_ready"
  | "campaign_visible"
  | "finished";

export type SplashDismissReason = "skip" | "auto" | "back" | "cta" | "image_error" | "expired" | "safety";

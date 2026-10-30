import { getApp, getApps } from "@react-native-firebase/app";

// Channel the backend targets in every FCM `android.notification.channelId`
// (server/app/common/utils/notificationPayload.js). Changing this id would
// orphan users' per-channel settings, so treat it as permanent.
export const GENERAL_CHANNEL_ID = "reward_planners_general";
// Quieter channels for non-urgent pushes. The backend names one in
// `android.notification.channelId` and mirrors it as data.android_channel_id;
// builds without these channels fall back to the manifest default (general).
export const UPDATES_CHANNEL_ID = "reward_planners_updates";
export const OFFERS_CHANNEL_ID = "reward_planners_offers";
export const KNOWN_CHANNEL_IDS = [GENERAL_CHANNEL_ID, UPDATES_CHANNEL_ID, OFFERS_CHANNEL_ID] as const;

// The only Firebase project new builds should be issuing tokens from. Tokens
// from the legacy project (rewardplanners-ebbe4) must never be reported as this.
export const PRIMARY_FIREBASE_PROJECT_ID = "reward-planners-2324d";

// Status bar: must stay the monochrome vector; a full-colour PNG renders as a blank square.
export const NOTIFICATION_SMALL_ICON = "ic_stat_notification";
// Colour brand mark shown beside notifications the app displays itself
// (foreground and data-only). A trimmed 256px copy of assets/menu/logo.png.
export const NOTIFICATION_LARGE_ICON = require("../../../assets/notifications/notification_large_icon.png");
export const NOTIFICATION_ACCENT_COLOR = "#6D5AE6";

export const isFirebaseConfigured = () => getApps().length > 0;

// Read from the packaged google-services.json at runtime rather than trusting
// a constant, so a wrong config file shows up as a mismatch instead of a lie.
export const getRuntimeFirebaseProjectId = (): string | null => {
  try {
    if (!isFirebaseConfigured()) return null;
    return getApp().options?.projectId || null;
  } catch {
    return null;
  }
};

export const isPrimaryFirebaseProject = (projectId: string | null | undefined) =>
  projectId === PRIMARY_FIREBASE_PROJECT_ID;

// Show only enough of a token to tell devices apart in diagnostics.
export const maskToken = (token: string | null | undefined) => {
  const value = String(token || "");
  if (!value) return "(none)";
  return value.length <= 12 ? "***" : `${value.slice(0, 6)}…${value.slice(-4)}`;
};

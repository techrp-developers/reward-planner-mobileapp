import { PermissionsAndroid, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import notifee from "@notifee/react-native";
import { canDisplayNotifications } from "./pushDisplay";

// Device-level flag: we explain and ask at most once. After that the user
// controls it from Android Settings (reachable from Notification settings).
const PROMPTED_KEY = "@rewardsplanners_push_permission_prompted";

export type NotificationPermissionState = "granted" | "denied" | "not_requested";

const needsRuntimePermission = () =>
  Platform.OS === "android" && Number(Platform.Version) >= 33;

const wasPrompted = async () => {
  try {
    return (await AsyncStorage.getItem(PROMPTED_KEY)) === "1";
  } catch {
    return true; // If storage fails, err on the side of not nagging.
  }
};

const markPrompted = () => AsyncStorage.setItem(PROMPTED_KEY, "1").catch(() => undefined);

export const getNotificationPermissionState = async (): Promise<NotificationPermissionState> => {
  if (await canDisplayNotifications()) return "granted";
  // Android 12 and below have no runtime prompt: "off" means disabled in Settings.
  if (!needsRuntimePermission()) return "denied";
  return (await wasPrompted()) ? "denied" : "not_requested";
};

// Only Android 13+ users who have never been asked see the explanation. On
// Android 12 and below notifications are on by default; if the user turned
// them off we respect that and only offer the Settings shortcut on request.
export const shouldOfferPermissionPrompt = async () =>
  (await getNotificationPermissionState()) === "not_requested";

// "Not now" on our explanation counts as the one ask.
export const declinePermissionPrompt = markPrompted;

// Shows the real Android 13+ system dialog, at most once per install. After a
// denial Android decides whether it may show again, so we never re-request;
// callers send the user to Settings instead.
export const requestNotificationPermission = async (): Promise<NotificationPermissionState> => {
  const current = await getNotificationPermissionState();
  if (current !== "not_requested") return current;

  await markPrompted();
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  ).catch(() => PermissionsAndroid.RESULTS.DENIED);
  return result === PermissionsAndroid.RESULTS.GRANTED ? "granted" : "denied";
};

export const openNotificationSystemSettings = (channelId?: string) =>
  notifee.openNotificationSettings(channelId).catch(() => undefined);

import notifee, {
  AndroidImportance,
  AndroidStyle,
  AuthorizationStatus,
  type Notification,
} from "@notifee/react-native";
import type { RemoteMessage } from "@react-native-firebase/messaging";
import {
  GENERAL_CHANNEL_ID,
  KNOWN_CHANNEL_IDS,
  NOTIFICATION_ACCENT_COLOR,
  NOTIFICATION_LARGE_ICON,
  NOTIFICATION_SMALL_ICON,
  OFFERS_CHANNEL_ID,
  UPDATES_CHANNEL_ID,
} from "./pushConfig";
import { getDedupeKey, sanitizeImageUrl } from "./pushPayload";

// Importance only applies when a channel is first created: Android keeps the
// user's (or the original) importance afterwards, so these are defaults, never
// a way to override what the user chose. Names and descriptions may update.
export const NOTIFICATION_CHANNELS = [
  {
    id: GENERAL_CHANNEL_ID,
    name: "Orders, chats & important alerts",
    description: "Order, booking and payment updates, direct messages and account security",
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: "default",
  },
  {
    id: UPDATES_CHANNEL_ID,
    name: "Rewards & updates",
    description: "Rewards, recognition, announcements and reminders",
    importance: AndroidImportance.DEFAULT,
    vibration: false,
    sound: "default",
  },
  {
    id: OFFERS_CHANNEL_ID,
    name: "Offers & promotions",
    description: "Deals and offers you opted in to. Silent by default",
    importance: AndroidImportance.LOW,
    vibration: false,
  },
];

export const ensureNotificationChannels = () => notifee.createChannels(NOTIFICATION_CHANNELS);

// Unknown or missing ids use the general channel, matching the manifest default.
export const resolveChannelId = (requested: unknown): string =>
  typeof requested === "string" && (KNOWN_CHANNEL_IDS as readonly string[]).includes(requested)
    ? requested
    : GENERAL_CHANNEL_ID;

export type ChannelState = { id: string; name: string; blocked: boolean; importance: number | null };

// What Android actually has installed (the user may have changed it).
export const getChannelStates = async (): Promise<ChannelState[]> => {
  const installed = await notifee.getChannels().catch(() => []);
  return NOTIFICATION_CHANNELS.map(channel => {
    const current = installed.find(item => item.id === channel.id);
    return {
      id: channel.id,
      name: channel.name,
      blocked: current ? Boolean(current.blocked) : false,
      importance: current?.importance ?? null,
    };
  });
};

export const canDisplayNotifications = async () => {
  try {
    const settings = await notifee.getNotificationSettings();
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  } catch {
    return false;
  }
};

// FCM data values must be strings; drop anything else before handing to Notifee.
const stringData = (data: RemoteMessage["data"]) =>
  Object.fromEntries(
    Object.entries(data || {}).filter(([, value]) => typeof value === "string"),
  ) as Record<string, string>;

export const buildLocalNotification = (message: RemoteMessage): Notification | null => {
  const title = String(message.notification?.title || message.data?.title || "").trim();
  const body = String(message.notification?.body || message.data?.message || message.data?.body || "").trim();
  if (!title && !body) return null;

  const imageUrl = sanitizeImageUrl(
    message.notification?.android?.imageUrl ?? message.data?.image_url ?? message.data?.image,
  );
  const key = getDedupeKey(message);

  return {
    // Same backend notification shown twice replaces itself instead of stacking.
    id: key ?? undefined,
    title: title || "Reward Planners",
    body,
    data: stringData(message.data),
    android: {
      channelId: resolveChannelId(
        message.notification?.android?.channelId ?? message.data?.android_channel_id,
      ),
      smallIcon: NOTIFICATION_SMALL_ICON,
      largeIcon: NOTIFICATION_LARGE_ICON,
      color: NOTIFICATION_ACCENT_COLOR,
      pressAction: { id: "default" },
      style: imageUrl
        ? { type: AndroidStyle.BIGPICTURE, picture: imageUrl }
        : { type: AndroidStyle.BIGTEXT, text: body },
    },
  };
};

// Displays with media first; a broken image must not swallow the notification.
export const displayLocalNotification = async (notification: Notification) => {
  try {
    await notifee.displayNotification(notification);
  } catch (error) {
    if (notification.android?.style?.type !== AndroidStyle.BIGPICTURE) throw error;
    await notifee.displayNotification({
      ...notification,
      android: {
        ...notification.android,
        style: { type: AndroidStyle.BIGTEXT, text: notification.body || "" },
      },
    });
  }
};

// Android already renders `notification` payloads when the app is not in the
// foreground. Only data-only messages need a local alert there.
export const shouldDisplayInBackground = (message: RemoteMessage) => !message.notification;

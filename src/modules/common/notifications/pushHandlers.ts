import type { Notification } from "@notifee/react-native";
import type { RemoteMessage } from "@react-native-firebase/messaging";
import { chatSocket } from "../../chat/services/chatSocket";
import {
  buildLocalNotification,
  canDisplayNotifications,
  displayLocalNotification,
  shouldDisplayInBackground,
} from "./pushDisplay";
import { getDedupeKey, parsePushData, RecentKeys } from "./pushPayload";
import { queueNotificationOpen, type OpenAppState } from "./pushNavigation";
import { notifyNotificationsChanged } from "./notificationEvents";

// Shared by the foreground and background paths so one FCM message delivered
// through both (or redelivered) produces a single alert.
const displayedKeys = new RecentKeys(100);

const showIfAllowed = async (message: RemoteMessage) => {
  const notification = buildLocalNotification(message);
  if (!notification || !(await canDisplayNotifications())) return;
  await displayLocalNotification(notification);
};

// App visible: FCM never auto-displays here, so this is the only alert path.
export const handleForegroundMessage = async (message: RemoteMessage) => {
  if (!displayedKeys.markFirstSeen(getDedupeKey(message))) return;

  // The push can arrive even when the chat socket is down; refresh open chat screens.
  if (message.data?.type === "chat_message") chatSocket.requestResync();
  notifyNotificationsChanged();
  await showIfAllowed(message);
};

// Headless/background: no navigation and no React context. Android has already
// shown `notification` payloads, so only data-only messages are displayed.
export const handleBackgroundMessage = async (message: RemoteMessage) => {
  if (!shouldDisplayInBackground(message)) return;
  if (!displayedKeys.markFirstSeen(getDedupeKey(message))) return;
  await showIfAllowed(message);
};

// Tap on a system-tray notification rendered by FCM.
export const queueRemoteOpen = (message: RemoteMessage | null, appState: OpenAppState) => {
  if (!message) return false;
  return queueNotificationOpen(parsePushData(message.data), appState, getDedupeKey(message));
};

// Tap on a notification we displayed locally through Notifee.
export const queueLocalOpen = (notification: Notification | undefined, appState: OpenAppState) => {
  // Debug test alerts carry no destination and must not report an open.
  if (!notification || notification.data?.debug_test) return false;
  const key = notification.id || getDedupeKey({ data: notification.data as Record<string, string> });
  return queueNotificationOpen(parsePushData(notification.data as Record<string, string>), appState, key);
};

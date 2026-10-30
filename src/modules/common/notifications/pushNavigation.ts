import { navigationRef, isAppStackMounted } from "../../../navigation/navigationRef";
import {
  markNotificationAsRead,
  reportNotificationOpened,
  type NotificationOpenedPayload,
} from "../../dashboard/notification/NotificationAPI";
import { resolveNotificationTarget } from "./notificationRouting";
import { RecentKeys, type PushData } from "./pushPayload";
import { notifyNotificationsChanged } from "./notificationEvents";
import { openConversationIfOwned } from "./chatNotificationTarget";

export type OpenAppState = Exclude<NotificationOpenedPayload["app_state"], "inbox">;

export type PendingOpen = {
  data: PushData;
  appState: OpenAppState;
  // User signed in when the tap happened; null means nobody was signed in.
  ownerUserId: number | null;
};

let activeUserId: number | null = null;
let pending: PendingOpen | null = null;
const openedKeys = new RecentKeys(50);
const listeners = new Set<() => void>();

export const setActivePushUser = (userId: number | null) => {
  activeUserId = userId;
};

// Taps can arrive from headless/background handlers before React or the
// navigator is ready, so they are parked here and consumed exactly once.
export const queueNotificationOpen = (
  data: PushData,
  appState: OpenAppState,
  dedupeKey: string | null,
) => {
  if (!openedKeys.markFirstSeen(dedupeKey)) return false;
  pending = { data, appState, ownerUserId: activeUserId };
  listeners.forEach(listener => listener());
  return true;
};

export const subscribePendingOpen = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const takePendingOpen = (currentUserId: number | null): PendingOpen | null => {
  if (!pending || currentUserId === null) return null;
  const next = pending;
  pending = null;
  // A tap that belonged to another signed-in account must not open its data.
  if (next.ownerUserId !== null && next.ownerUserId !== currentUserId) return null;
  return next;
};

export const clearPendingOpen = () => {
  pending = null;
};

export const hasPendingOpen = () => pending !== null;

export const performNotificationOpen = (open: PendingOpen) => {
  if (!isAppStackMounted()) return false;

  // Tapped while signed out: the notification may belong to someone else, so
  // after login only open the inbox, which the backend scopes to this user.
  const loginRequired = open.ownerUserId === null;
  const target = loginRequired
    ? { route: "Notification", params: undefined, destinationType: "inbox", isFallback: true }
    : resolveNotificationTarget({ ...open.data, metadata: { target_route: open.data.targetRoute } });
  const notificationId = open.data.notificationId;

  if (notificationId) {
    reportNotificationOpened(notificationId, {
      app_state: open.appState,
      outcome: loginRequired ? "login_required" : target.isFallback ? "fallback" : "opened_target",
      destination_type: target.destinationType,
    }).catch(() => undefined);

    if (!loginRequired) {
      markNotificationAsRead(notificationId)
        .catch(() => undefined)
        .finally(notifyNotificationsChanged);
    }
  }

  navigationRef.navigate("App", { screen: target.route, params: target.params });

  if (!loginRequired && "conversationId" in target && target.conversationId) {
    const openedFor = activeUserId;
    openConversationIfOwned(
      target.conversationId,
      (route, params) => navigationRef.navigate("App", { screen: route, params }),
      () => activeUserId === openedFor && isAppStackMounted(),
    ).catch(() => undefined);
  }
  return true;
};

import axios from "axios";

import api from "../../common/auth/api/axios";
import { getAuthHeaders, clearAuthToken } from "../../common/auth/api/AuthAPI";
import { BASE_API_URL } from "../../services/api/api";

export type NotificationItem = {
  notification_id: number;
  module: string;
  type: string;
  title: string;
  message: string;
  icon: string | null;
  reference_type: string | null;
  reference_id: string | null;
  action_url: string | null;
  metadata: Record<string, any> | null;
  priority: "low" | "normal" | "high" | string;
  is_read: number | boolean;
  created_at: string;
};

export type NotificationResponse = {
  success: boolean;
  data: NotificationItem[];
  message?: string;
};

export type NotificationBadgeResponse = {
  success: boolean;
  count: number;
  message?: string;
};

export const NOTIFICATION_PAGE_SIZE = 20;

export const getMyNotifications = async (
  page: { limit?: number; beforeId?: number } = {},
): Promise<NotificationResponse> => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(`${BASE_API_URL}/notification/my-notification`, {
      headers,
      params: {
        limit: page.limit ?? NOTIFICATION_PAGE_SIZE,
        ...(page.beforeId ? { before_id: page.beforeId } : {}),
      },
    });

    return {
      success: Boolean(res.data?.success),
      data: Array.isArray(res.data?.data) ? res.data.data : [],
      message: res.data?.message,
    };
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Get Notifications Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

export const getNotificationBadge = async (): Promise<NotificationBadgeResponse> => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.get(`${BASE_API_URL}/notification/notification-badge`, {
      headers,
    });

    return {
      success: Boolean(res.data?.success),
      count: Number(res.data?.count || 0),
      message: res.data?.message,
    };
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Get Notification Badge Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

export const markNotificationAsRead = async (notificationId: number) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.put(
      `${BASE_API_URL}/notification/read/${notificationId}`,
      {},
      { headers }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Mark Notification Read Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.put(
      `${BASE_API_URL}/notification/read-all`,
      {},
      { headers }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Mark All Notifications Read Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

export const deleteNotification = async (notificationId: number) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.delete(
      `${BASE_API_URL}/notification/${notificationId}`,
      { headers }
    );

    return res.data;
  } catch (error: any) {
    if (Number(error?.response?.status) === 401) {
      await clearAuthToken();
    }

    console.error("Delete Notification Error:", error?.response || error);
    throw error?.response?.data || error;
  }
};

export type NotificationOpenedPayload = {
  app_state: "foreground" | "background" | "terminated" | "inbox";
  outcome: "opened_target" | "fallback" | "login_required";
  destination_type?: string;
};

// Tap analytics only: callers fire and forget, never awaiting before navigation.
export const reportNotificationOpened = async (
  notificationId: number,
  payload: NotificationOpenedPayload,
) => {
  const res = await api.post(`/v1/notification/${notificationId}/opened`, payload);
  return res.data as { success: boolean; recorded?: boolean };
};

export type NotificationPreferences = {
  language: "en" | "hi" | "mr" | string;
  marketing_enabled: boolean;
  engagement_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  // false = backend defaults are being shown; that is NOT an opt-in.
  stored: boolean;
};

export type NotificationPreferencesUpdate = Partial<
  Pick<NotificationPreferences, "language" | "marketing_enabled" | "engagement_enabled">
> & {
  // The backend requires both quiet-hour bounds together.
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
};

const QUIET_HOUR_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// The backend requires quiet hours as a pair: both valid HH:MM, or both null.
// Returns the update to send, or null when the pair is invalid.
export const buildQuietHoursUpdate = (
  start: string | null,
  end: string | null,
): Pick<NotificationPreferencesUpdate, "quiet_hours_start" | "quiet_hours_end"> | null => {
  if (start === null && end === null) return { quiet_hours_start: null, quiet_hours_end: null };
  if (!start || !end || !QUIET_HOUR_PATTERN.test(start) || !QUIET_HOUR_PATTERN.test(end)) return null;
  if (start === end) return null;
  return { quiet_hours_start: start, quiet_hours_end: end };
};

// Backends may return TIME columns as HH:MM:SS; the UI and contract use HH:MM.
const toHourMinute = (value: unknown) =>
  typeof value === "string" && /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : null;

const normalizePreferences = (data: any): NotificationPreferences => ({
  language: String(data?.language || "en"),
  // Anything other than an explicit true is treated as not consented.
  marketing_enabled: data?.marketing_enabled === true,
  engagement_enabled: data?.engagement_enabled === true,
  quiet_hours_start: toHourMinute(data?.quiet_hours_start),
  quiet_hours_end: toHourMinute(data?.quiet_hours_end),
  stored: data?.stored === true,
});

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const res = await api.get("/v1/notification/preferences");
  return normalizePreferences(res.data?.data);
};

// Send only the fields the user explicitly changed.
export const updateNotificationPreferences = async (
  changes: NotificationPreferencesUpdate,
): Promise<NotificationPreferences> => {
  const res = await api.put("/v1/notification/preferences", changes);
  return normalizePreferences(res.data?.data);
};

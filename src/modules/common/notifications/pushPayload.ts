import { SERVER_URL } from "../../../config/apiConfig";

// Normalized view of the backend FCM `data` block. Every FCM data value is a
// string, and older backends omit notification_id, so all fields are optional.
export type PushData = {
  notificationId: number | null;
  module: string;
  type: string;
  referenceType: string;
  referenceId: string;
  actionUrl: string;
  screen: string;
  // Raw JSON navigator path from the backend; validated by notificationRouting.
  targetRoute: string;
  destinationType?: string;
  destinationId?: string;
  campaignId?: string;
  contentId?: string;
  imageUrl: string | null;
};

type RawData = Record<string, unknown> | undefined | null;

const text = (value: unknown, max = 512) =>
  typeof value === "string" || typeof value === "number"
    ? String(value).trim().slice(0, max)
    : "";

const parseNotificationId = (value: unknown): number | null => {
  const id = Number(text(value, 20));
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const ALLOWED_IMAGE_HOSTS = ["rewardplanners.com"];

// Only fetch notification media from our own HTTPS hosts (plus the local dev
// server), so a crafted payload cannot make devices hit arbitrary URLs.
export const sanitizeImageUrl = (value: unknown): string | null => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || raw.length > 2048 || /[\s\\]/u.test(raw)) return null;

  const match = raw.match(/^(https?):\/\/([^/:?#]+)(:\d+)?([/?#].*)?$/i);
  if (!match) return null;

  const [, protocol, host, port] = match;
  const hostname = host.toLowerCase();
  const origin = `${protocol}://${host}${port ?? ""}`.toLowerCase();
  const isLocalServer = __DEV__ && origin === SERVER_URL.toLowerCase();
  const isAllowedHost = ALLOWED_IMAGE_HOSTS.some(
    allowed => hostname === allowed || hostname.endsWith(`.${allowed}`),
  );

  if (isLocalServer) return raw;
  if (protocol.toLowerCase() !== "https" || !isAllowedHost || (port && port !== ":443")) return null;
  return raw;
};

export const parseNotificationMetadata = (value: unknown): RawData => {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return null; }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
};

export const getNotificationImage = (data: RawData, imageHint?: unknown): string | null => {
  const metadata = parseNotificationMetadata(data?.metadata);
  for (const candidate of [imageHint, data?.image_url, data?.imageUrl, data?.image, metadata?.image_url, metadata?.imageUrl, metadata?.image]) {
    const imageUrl = sanitizeImageUrl(candidate);
    if (imageUrl) return imageUrl;
  }
  return null;
};

export const parsePushData = (data: RawData, imageHint?: unknown): PushData => {
  const metadata = parseNotificationMetadata(data?.metadata);
  return {
    notificationId: parseNotificationId(data?.notification_id),
    module: text(data?.module, 64),
    type: text(data?.type, 64),
    referenceType: text(data?.reference_type, 64),
    referenceId: text(data?.reference_id, 128),
    actionUrl: text(data?.action_url, 512),
    screen: text(data?.screen, 64),
    targetRoute: text(data?.target_route ?? metadata?.target_route, 1024),
    destinationType: text(data?.destination_type ?? metadata?.destination_type, 64),
    destinationId: text(data?.destination_id ?? metadata?.destination_id, 128),
    campaignId: text(data?.campaign_id ?? metadata?.campaign_id, 20),
    contentId: text(data?.content_id ?? metadata?.content_id, 20),
    imageUrl: getNotificationImage(data, imageHint),
  };
};

type MessageLike = {
  messageId?: string;
  data?: RawData;
};

// Prefer the backend's persisted id; fall back to the FCM message id. Never
// key on title/body, which legitimately repeat across distinct notifications.
export const getDedupeKey = (message: MessageLike | null | undefined): string | null => {
  const notificationId = parseNotificationId(message?.data?.notification_id);
  if (notificationId) return `n:${notificationId}`;
  if (message?.messageId) return `m:${message.messageId}`;
  return null;
};

// Small bounded memory of recently seen keys so repeated deliveries or
// overlapping listeners do not alert or navigate twice.
export class RecentKeys {
  private readonly keys = new Set<string>();

  constructor(private readonly limit = 100) {}

  // Returns true the first time a key is seen; null keys are never deduped.
  markFirstSeen(key: string | null): boolean {
    if (!key) return true;
    if (this.keys.has(key)) return false;

    this.keys.add(key);
    if (this.keys.size > this.limit) {
      const oldest = this.keys.values().next().value;
      if (oldest !== undefined) this.keys.delete(oldest);
    }
    return true;
  }

  clear() {
    this.keys.clear();
  }
}

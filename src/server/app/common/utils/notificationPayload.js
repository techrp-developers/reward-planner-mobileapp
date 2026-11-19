const crypto = require("node:crypto");

const SCREEN_BY_MODULE = {
  bbps: "BbpsHome",
  common: "Notifications",
  ecommerce: "EcommerceHome",
  fitness: "FitnessDashboard",
  games: "GamesHome",
  service: "ServiceHome",
  todo: "TodoList",
  wallet: "Wallet",
};

const IDEMPOTENT_TYPES = new Set([
  "account_activated",
  "bbps_payment_success",
  "bbps_refund_completed",
  "delivery",
  "order_paid",
  "order_shipped",
  "order_out_for_delivery",
  "refund_completed",
  "service_order_paid",
  "service_refund_completed",
]);

const DEFAULT_DEDUPE_WINDOW_MS = 5 * 60 * 1000;
const GENERAL_CHANNEL = "reward_planners_general";
const OFFERS_CHANNEL = "reward_planners_offers";
const CHANNELS = new Set([GENERAL_CHANNEL, OFFERS_CHANNEL, "reward_planners_updates"]);
const PROMOTION_TYPES = new Set(["promotion", "promotional", "marketing", "campaign_marketing"]);

function resolveChannel(data, metadata) {
  if (CHANNELS.has(metadata.android_channel_id)) return metadata.android_channel_id;
  const isMarketing = (data.category ?? metadata.category) === "marketing" || PROMOTION_TYPES.has(data.type);
  return isMarketing ? OFFERS_CHANNEL : GENERAL_CHANNEL;
}

function parseMetadata(value) {
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return null; }
  }
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function notificationImage(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const raw = candidate.trim();
    if (!raw || raw.length > 2048 || /[\s\\]/u.test(raw)) continue;
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" && !url.username && !url.password && !url.port &&
          (url.hostname === "rewardplanners.com" || url.hostname.endsWith(".rewardplanners.com"))) {
        return raw;
      }
    } catch {
      continue;
    }
  }
  return undefined;
}

function notificationMetadata(data) {
  const metadata = { ...parseMetadata(data.metadata) };
  for (const field of ["target_route", "destination_type", "destination_id", "campaign_id", "content_id", "android_channel_id"]) {
    if (data[field] != null && data[field] !== "") metadata[field] = data[field];
  }
  const image = notificationImage(data.image_url, data.imageUrl, data.image, metadata.image_url, metadata.imageUrl, metadata.image);
  if (image) metadata.image_url = image;
  return metadata;
}

function buildWindowedIdempotencyKey(payload, now = Date.now()) {
  if (payload.allow_duplicates === true) return undefined;

  const configuredWindow = Number(payload.dedupe_window_ms);
  const windowMs = Number.isFinite(configuredWindow) && configuredWindow > 0
    ? configuredWindow
    : DEFAULT_DEDUPE_WINDOW_MS;
  const bucket = Math.floor(now / windowMs);
  const fingerprint = [
    payload.userId ?? payload.user_id ?? "",
    payload.module ?? "",
    payload.type ?? "",
    payload.reference_type ?? "",
    payload.reference_id ?? "",
    payload.title ?? "",
    payload.message ?? "",
    bucket,
  ];
  const campaign = payload.metadata?.campaign_id ?? payload.campaign_id;
  if (campaign != null && campaign !== "") fingerprint.push(campaign);

  return `window:${crypto.createHash("sha256").update(fingerprint.join("|")).digest("hex")}`;
}

function inferScreen(data) {
  if (data.screen) return data.screen;
  const url = String(data.action_url || "");
  if (url.includes("order-details")) return "OrderDetails";
  if (url.includes("service-order")) return "ServiceOrderDetails";
  if (url.includes("support")) return "Support";
  if (url.includes("wallet")) return "Wallet";
  if (url.includes("profile")) return "Profile";
  if (url.includes("cart")) return "Cart";
  return SCREEN_BY_MODULE[data.module] || "Notifications";
}

function buildNotificationPayload(data) {
  const metadata = notificationMetadata(data);
  const offer = resolveChannel(data, metadata) === OFFERS_CHANNEL;
  const payload = {
    priority: "normal",
    reference_type: "none",
    ...data,
    screen: offer && !data.screen ? "Notifications" : inferScreen(data),
    metadata,
  };

  const userId = payload.userId ?? payload.user_id;
  if (!payload.idempotency_key && IDEMPOTENT_TYPES.has(payload.type) &&
      userId && payload.reference_id != null) {
    payload.idempotency_key = [userId, payload.module, payload.type, payload.reference_id].join(":");
  }

  // Protect every producer from concurrent/retried sends. Event notifications
  // above retain their permanent key; ordinary notifications can recur after
  // the short window. Callers with a business-specific cadence should provide
  // an explicit idempotency_key.
  if (!payload.idempotency_key) {
    payload.idempotency_key = buildWindowedIdempotencyKey(payload);
  }

  return payload;
}

function buildPushMessage(data, fcmToken) {
  const metadata = notificationMetadata(data);
  const channelId = resolveChannel(data, metadata);
  const isOffer = channelId === OFFERS_CHANNEL;
  const id = Number(data.notification_id);
  const notificationId = Number.isSafeInteger(id) && id > 0 ? String(id) : undefined;
  const customData = {};
  for (const field of ["destination_type", "destination_id", "campaign_id", "content_id"]) {
    const value = metadata[field];
    if ((typeof value === "string" || typeof value === "number") && value !== "") customData[field] = String(value);
  }
  // Only the validated image can reach either display path.
  const imageUrl = notificationImage(metadata.image_url);
  if (imageUrl) customData.image_url = imageUrl;
  const route = parseMetadata(metadata.target_route);
  if (route) customData.target_route = JSON.stringify(route);

  return {
    notification: {
      title: data.title || "Notification",
      body: data.message || "",
    },
    data: {
      module: String(data.module || ""),
      type: String(data.type || ""),
      reference_type: String(data.reference_type || ""),
      reference_id: String(data.reference_id || ""),
      action_url: String(data.action_url || ""),
      screen: String(data.screen || ""),
      priority: String(data.priority || "normal"),
      ...customData,
      ...(notificationId ? { notification_id: notificationId } : {}),
      ...(channelId !== GENERAL_CHANNEL ? { android_channel_id: channelId } : {}),
    },
    android: {
      priority: isOffer ? "normal" : "high",
      notification: {
        channelId,
        ...(channelId === GENERAL_CHANNEL ? {
          sound: "default",
          defaultSound: true,
          vibrateTimingsMillis: [0, 1000, 500, 1000, 500],
        } : {}),
        ...(customData.image_url ? { imageUrl: customData.image_url } : {}),
        ...(notificationId ? { tag: `n:${notificationId}` } : {}),
      },
    },
    apns: { payload: { aps: { sound: "default" } } },
    token: fcmToken,
  };
}

module.exports = {
  buildNotificationPayload,
  buildPushMessage,
  buildWindowedIdempotencyKey,
  inferScreen,
  parseMetadata,
};

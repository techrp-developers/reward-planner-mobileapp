import type { AppStackParamList } from "../../../navigation/RootNavigator";
import { parseNotificationMetadata, type PushData } from "./pushPayload";

export type NotificationTarget = {
  route: keyof AppStackParamList;
  params?: Record<string, unknown>;
  // Reported to POST /notification/:id/opened as destination_type.
  destinationType: string;
  isFallback: boolean;
  // Set for chat pushes: the thread to open once it is found in the user's
  // own conversation list (see chatNotificationTarget.ts).
  conversationId?: number;
};

type RoutableNotification = Pick<
  PushData,
  "module" | "type" | "referenceType" | "referenceId" | "actionUrl" | "screen" |
  "destinationType" | "destinationId" | "campaignId" | "contentId"
> & {
  metadata?: Record<string, unknown> | string | null;
};

const FALLBACK_ROUTE: keyof AppStackParamList = "Notification";

// App-stack routes a backend `target_route` may name. Anything else (auth,
// checkout, address editing...) is ignored so payload data cannot open
// privileged or state-changing screens.
const TARGET_ROUTE_ALLOWLIST = new Set<keyof AppStackParamList>([
  "Notification",
  "Orders",
  "MyOrder",
  "OrderConfirmedScreen",
  "WalletHistory",
  "RewardStack",
  "ServiceStack",
  "BBPSHomeStack",
  "TodoList",
  "Chat",
  "Profile",
  "Cart",
  "MyTickets",
  "Home",
  "Dashboard",
  "ProductDetails",
  "Quiz",
]);

// Nested read-only screens a backend destination may open (path after "App"),
// each checked against the registered navigators. Exact matches only.
const NESTED_TARGET_PATHS = new Set([
  "RewardStack/Dashboard",
  "Chat/ChatInbox",
  "Home/ProductModule/Home",
  "Home/ProductModule/ProductDescription",
  "Home/ProductModule/Category",
  "Home/ProductModule/CampaignProducts",
  "Home/ServicesModule/Home",
  "Home/ServicesModule/ServiceDescription",
  "Home/PaymentsModule/Home",
]);

// Backend `screen` hints (notificationPayload.inferScreen) → registered routes.
const SCREEN_HINTS: Record<string, keyof AppStackParamList> = {
  Wallet: "WalletHistory",
  Cart: "Cart",
  Profile: "Profile",
  Support: "MyTickets",
  TodoList: "TodoList",
  BbpsHome: "BBPSHomeStack",
  FitnessDashboard: "RewardStack",
  ServiceHome: "ServiceStack",
  EcommerceHome: "Home",
  Notifications: "Notification",
};

const EXACT_ACTION_URLS: Record<string, keyof AppStackParamList> = {
  "/wallet": "WalletHistory",
  "/fitness": "RewardStack",
  "/fitness/wallet": "RewardStack",
  "/cart": "Cart",
  "/orders": "Orders",
  "/profile": "Profile",
  "/todo": "TodoList",
  "/bbps": "BBPSHomeStack",
  "/services": "ServiceStack",
  "/notifications": "Notification",
};

const target = (
  route: keyof AppStackParamList,
  destinationType: string,
  params?: Record<string, unknown>,
): NotificationTarget => ({ route, params, destinationType, isFallback: false });

const isPrimitive = (value: unknown) =>
  value === null || ["string", "number", "boolean"].includes(typeof value);

const fromTargetRoute = (metadata: ReturnType<typeof parseNotificationMetadata>) => {
  const raw = metadata?.target_route;
  const parsed = parseNotificationMetadata(raw);
  const path = Array.isArray(parsed?.path) ? parsed.path : null;

  if (!path || path.length < 2 || path[0] !== "App" || !path.every((part: unknown) => typeof part === "string")) return null;
  const hops = path.slice(1) as string[];
  const route = hops[0] as keyof AppStackParamList;
  const allowed = hops.length === 1
    ? TARGET_ROUTE_ALLOWLIST.has(route)
    : NESTED_TARGET_PATHS.has(hops.join("/"));
  if (!allowed) return null;

  const params = parsed?.params && typeof parsed.params === "object" ? parsed.params : {};
  const safeParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => isPrimitive(value)),
  );
  const leafParams = Object.keys(safeParams).length ? safeParams : undefined;
  // App > A > B > C becomes navigate("A", { screen: "B", params: { screen: "C", params } }).
  const nested = hops.slice(1).reduceRight<Record<string, unknown> | undefined>(
    (inner, screen) => ({ screen, ...(inner ? { params: inner } : {}) }),
    leafParams,
  );
  return target(route, "target_route", nested);
};

const positiveId = (value: unknown) => {
  const id = typeof value === "string" || typeof value === "number" ? Number(value) : 0;
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
};

const productTarget = (screen: string, destination: string, params: Record<string, unknown>) =>
  target("Home", destination, { screen: "ProductModule", params: { screen, params } });

export function resolveNotificationTarget(item: RoutableNotification): NotificationTarget {
  const actionUrl = item.actionUrl.trim();
  const referenceId = item.referenceId.trim();
  const destinationType = item.referenceType || item.module || "general";

  // Chat pushes only carry a conversation id, while ChatConversation needs the
  // full conversation object: open the inbox now and let the caller look the
  // thread up in the user's own conversations.
  if (item.module === "chat" || item.type === "chat_message") {
    const conversationId = Number(referenceId);
    return {
      ...target("Chat", "conversation", { screen: "ChatInbox" }),
      ...(item.referenceType === "conversation" && Number.isSafeInteger(conversationId) && conversationId > 0
        ? { conversationId }
        : {}),
    };
  }

  const metadata = parseNotificationMetadata(item.metadata);
  const explicit = fromTargetRoute(metadata);
  if (explicit) return explicit;

  const configuredDestination = item.destinationType || metadata?.destination_type;
  // CRM uses reference_type "campaign" to identify the sender campaign even
  // when the notification has no link to an ecommerce campaign.
  const referenceDestination = item.referenceType === "campaign" ? "" : item.referenceType;
  const destination = String(configuredDestination || referenceDestination).toLowerCase();
  const id = positiveId(item.destinationId || metadata?.destination_id || referenceId);
  switch (destination) {
    case "product":
    case "product_details":
      if (id) return productTarget("ProductDescription", "product", { productId: id });
      break;
    case "category":
    case "product_category":
      if (id) return productTarget("Category", "category", { categoryId: id });
      break;
    case "collection":
    case "product_collection":
    case "campaign":
    case "campaign_products": {
      const campaignId = id ?? positiveId(item.campaignId || metadata?.campaign_id);
      if (campaignId) return productTarget("CampaignProducts", "collection", { campaignId });
      break;
    }
    case "catalog":
    case "catalogue":
    case "promotion":
    case "promotional_catalog":
    case "promotional_catalogue":
    case "product_offer": {
      const contentId = id ?? positiveId(item.contentId || metadata?.content_id);
      if (contentId) return productTarget("CampaignProducts", "promotion", { contentId });
      break;
    }
    case "service":
    case "service_details":
      if (id) {
        return target("Home", "service", { screen: "ServicesModule", params: { screen: "ServiceDescription", params: { serviceId: id } } });
      }
      break;
    case "wallet":
    case "rewards":
      if (configuredDestination) return target("WalletHistory", destination);
      break;
  }

  const ecommerceOrderMatch = actionUrl.match(/^\/orders\/order-details\/(\d+)$/);
  if (ecommerceOrderMatch?.[1]) {
    return target("OrderConfirmedScreen", "order", { order_id: Number(ecommerceOrderMatch[1]) });
  }

  const serviceOrderMatch = actionUrl.match(/\/service-orders\/([^/?#]+)/);
  const serviceDocsMatch = actionUrl.match(/\/service-order-documents\/parent-documents\/([^/?#]+)/);
  const parentOrderId =
    serviceOrderMatch?.[1] ||
    serviceDocsMatch?.[1] ||
    (item.referenceType === "service_order" ? referenceId : "");
  if (parentOrderId) {
    return target("ServiceStack", "service_order", {
      screen: "ServiceOrderDetail",
      params: { parent_order_id: parentOrderId },
    });
  }

  const exactRoute = EXACT_ACTION_URLS[actionUrl];
  if (exactRoute) return target(exactRoute, destinationType);

  const hintedRoute = SCREEN_HINTS[item.screen];
  if (hintedRoute) return target(hintedRoute, destinationType);

  return { route: FALLBACK_ROUTE, destinationType, isFallback: true };
}

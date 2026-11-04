import { Linking } from "react-native";
import type { AppStackParamList } from "../../../../navigation/RootNavigator";
import { isAppStackMounted, navigationRef } from "../../../../navigation/navigationRef";
import type { SplashCampaign } from "./splashTypes";

export type SplashAction =
  | { kind: "route"; destination: string; route: keyof AppStackParamList; params: Record<string, unknown> }
  | { kind: "external"; url: string };

const positiveId = (value: unknown) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// Product-module screens live under App > Home > ProductModule; `initial: false`
// keeps the module's home screen underneath so Back lands somewhere sensible.
const productModule = (screen: string, params: Record<string, unknown>) => ({
  screen: "ProductModule",
  params: { screen, params, initial: false },
});

// Only these CMS destinations are routable; anything else is ignored and the
// user simply lands on the dashboard.
export const resolveSplashAction = (campaign: SplashCampaign): SplashAction | null => {
  const nav = campaign.navigation;
  const title = (typeof nav?.title === "string" && nav.title) || campaign.cta_text || campaign.title || "";

  if (nav) {
    const raw: any = nav;
    const targetId = positiveId(raw.targetId ?? raw.target_id);
    const contentId = positiveId(raw.contentId ?? raw.content_id) ?? positiveId(campaign.content_id);
    const route = (destination: string, name: keyof AppStackParamList, params: Record<string, unknown>): SplashAction =>
      ({ kind: "route", destination, route: name, params });

    switch (nav.destination) {
      case "product_details":
        return targetId ? route(nav.destination, "ProductDetails", { productId: targetId }) : null;
      case "product_offer":
        return contentId ? route(nav.destination, "Home", productModule("CampaignProducts", { contentId, title })) : null;
      case "category":
        return targetId ? route(nav.destination, "Home", productModule("Category", { categoryId: targetId, title })) : null;
      case "service_details":
        return targetId
          ? route(nav.destination, "ServiceStack", { screen: "ServiceDescription", params: { serviceId: targetId, title }, initial: false })
          : null;
      default:
        return null;
    }
  }

  return campaign.link && isSafeExternalLink(campaign.link) ? { kind: "external", url: campaign.link } : null;
};

// The backend only returns links that passed its approval policy; the app
// additionally refuses anything that is not plain HTTPS.
export const isSafeExternalLink = (link: string) => {
  try {
    const url = new URL(link);
    return url.protocol === "https:" && !url.username && !url.password && Boolean(url.hostname);
  } catch {
    return false;
  }
};

const ROUTE_WAIT_MS = 5000;

// Runs the CTA once the launch hold is released and the App stack has
// mounted. Nested navigators need not be mounted: React Navigation hands the
// nested `screen` params to them as they mount. Returns a cancel function.
export const runSplashActionWhenReady = (action: SplashAction, onDone?: (executed: boolean) => void) => {
  let settled = false;
  let unsubscribe: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const settle = (executed: boolean) => {
    if (settled) return;
    settled = true;
    unsubscribe?.();
    if (timer) clearTimeout(timer);
    onDone?.(executed);
  };

  if (action.kind === "external") {
    Linking.openURL(action.url).catch(() => undefined);
    settle(true);
    return () => settle(false);
  }

  const tryNavigate = () => {
    if (settled || !isAppStackMounted() || navigationRef.getRootState()?.routes?.[0]?.name !== "App") return;
    navigationRef.navigate("App", { screen: action.route, params: action.params });
    settle(true);
  };

  tryNavigate();
  if (!settled) {
    unsubscribe = navigationRef.addListener("state", tryNavigate);
    timer = setTimeout(() => settle(false), ROUTE_WAIT_MS);
  }
  return () => settle(false);
};

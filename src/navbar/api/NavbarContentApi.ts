import { cmsApi } from "../../config/cmsApiClient";
import { normalizeLocalCmsImageUrl } from "../../config/apiConfig";
import {
  DEFAULT_NAVBAR_BG,
  TAB_MODULE_MAP,
  TopTab,
  NavbarModule,
} from "../navbarConstants";

export interface NavbarBanner {
  imageUrl: string | null;
  bgColor: string;
}

export type NavbarBannerMap = Record<TopTab, NavbarBanner>;

export interface ResolvedZoneEntry {
  content_id?: number;
  module?: NavbarModule;
  zone?: "navbar_background" | "promotional_banner" | "offers_banner";
  content_type: "color" | "image";
  color_value: string | null;
  image_url: string | null;
  title?: string | null;
  cta_text?: string | null;
  redirect_link?: string | null;
  is_default?: number | boolean;
  status?: "default" | "draft" | "scheduled" | "active" | "expired" | string;
}

interface ResolvedNavbarResponse {
  success: boolean;
  message?: string;
  data?: Partial<Record<NavbarModule | string, ResolvedZoneEntry | null>>;
}

export const FALLBACK_NAVBAR_BANNER_MAP = Object.keys(TAB_MODULE_MAP).reduce(
  (acc, tab) => {
    const topTab = tab as TopTab;
    acc[topTab] = {
      imageUrl: null,
      bgColor: DEFAULT_NAVBAR_BG[topTab],
    };
    return acc;
  },
  {} as NavbarBannerMap,
);

const NAVBAR_MODULE_WHITELIST = Object.values(TAB_MODULE_MAP) as NavbarModule[];

const TOP_TAB_BY_MODULE = Object.entries(TAB_MODULE_MAP).reduce(
  (acc, [tab, module]) => {
    acc[module] = tab as TopTab;
    return acc;
  },
  {} as Record<NavbarModule, TopTab>,
);

const toNavbarBanner = (
  tab: TopTab,
  entry: ResolvedZoneEntry | null | undefined,
): NavbarBanner => ({
  imageUrl:
    entry?.content_type === "image" && entry.image_url
      ? normalizeLocalCmsImageUrl(entry.image_url)
      : null,
  bgColor:
    entry?.content_type === "color" && entry.color_value
      ? entry.color_value
      : DEFAULT_NAVBAR_BG[tab],
});

export const fetchNavbarContent = async (): Promise<NavbarBannerMap> => {
  const { data } = await cmsApi.get<ResolvedNavbarResponse>(
    "/content/resolved/navbar",
  );
  const raw = data.data ?? {};
  const map = { ...FALLBACK_NAVBAR_BANNER_MAP } as NavbarBannerMap;

  NAVBAR_MODULE_WHITELIST.forEach((module) => {
    const tab = TOP_TAB_BY_MODULE[module];
    map[tab] = toNavbarBanner(tab, raw[module]);
  });

  return map;
};

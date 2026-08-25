import ServiceTop from "./assete/Service_BG.png";
import PaymentTop from "./assete/Payment_BG.png";
import BusBookingTop from "./assete/Bus_BG.png";
import Background1 from "./assete/Background1.jpeg";

import type { NavbarModule } from "./api/NavbarContentApi";

export type TopTab = "Product" | "Services" | "Payments" | "DineOut";

export const TOP_TABS: TopTab[] = ["Product", "Services", "Payments", "DineOut"];

// Bundled banners kept only for other screens that still reference them
// directly (see Search.tsx, ServiceHead.tsx, Product_Head_Img.tsx, LoginHead.tsx).
// The navbar background itself is now CMS-driven and no longer reads BG_MAP.
export const BG_MAP: Record<TopTab, any> = {
  Product: Background1,
  Services: ServiceTop,
  Payments: PaymentTop,
  DineOut: BusBookingTop,
};

// Single source of truth for TopTab -> CMS module name. Reused by
// useNavbarBanners so the mapping never needs to be duplicated elsewhere.
export const TAB_MODULE_MAP: Record<TopTab, NavbarModule> = {
  Product: "product",
  Services: "service",
  Payments: "payment",
  DineOut: "dineout",
} as const;

export const TAB_THEME: Record<TopTab, { bgColor: string; activeTint?: string }> = {
  Product: { bgColor: "#5F341A" },
  Services: { bgColor: "#4F6BFF" },
  Payments: { bgColor: "#EAE2FF", activeTint: "#532C99" },
  DineOut: { bgColor: "#FFE3E8", activeTint: "#CE1538" },
};

export const isTopTab = (value?: string): value is TopTab => {
  if (!value) return false;
  return TOP_TABS.includes(value as TopTab);
};

import {
  MODULE_BY_TOP_TAB,
  TopTab,
  CmsModuleKey,
  isTopTab,
} from "../modules/common/cms/moduleMapping";

export type { TopTab } from "../modules/common/cms/moduleMapping";
export type NavbarModule = CmsModuleKey;

export const TAB_MODULE_MAP: Record<TopTab, NavbarModule> = MODULE_BY_TOP_TAB;

export const DEFAULT_NAVBAR_BG: Record<TopTab, string> = {
  Product: "#852BAF",
  Services: "#852BAF",
  Payments: "#5F341A",
  DineOut: "#5F341A",
};

export const TAB_THEME: Record<TopTab, { bgColor: string; activeTint: string }> = {
  Product: { bgColor: DEFAULT_NAVBAR_BG.Product, activeTint: "#FFD166" },
  Services: { bgColor: DEFAULT_NAVBAR_BG.Services, activeTint: "#FFD166" },
  Payments: { bgColor: DEFAULT_NAVBAR_BG.Payments, activeTint: "#FFD166" },
  DineOut: { bgColor: DEFAULT_NAVBAR_BG.DineOut, activeTint: "#FFD166" },
};

export { isTopTab };

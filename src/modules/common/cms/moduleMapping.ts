export type TopTab = 'Product' | 'Services' | 'Payments' | 'DineOut';
export type CmsModuleKey = 'product' | 'service' | 'payment' | 'dineout';
export type ModuleRouteKey =
  | 'ProductModule'
  | 'ServicesModule'
  | 'PaymentsModule'
  | 'DineOutModule';

export const MODULE_BY_TOP_TAB: Record<TopTab, CmsModuleKey> = {
  Product: 'product',
  Services: 'service',
  Payments: 'payment',
  DineOut: 'dineout',
};

export const TOP_TAB_BY_MODULE: Record<CmsModuleKey, TopTab> = {
  product: 'Product',
  service: 'Services',
  payment: 'Payments',
  dineout: 'DineOut',
};

export const ROUTE_BY_TOP_TAB: Record<TopTab, ModuleRouteKey> = {
  Product: 'ProductModule',
  Services: 'ServicesModule',
  Payments: 'PaymentsModule',
  DineOut: 'DineOutModule',
};

export const TOP_TAB_BY_ROUTE: Record<ModuleRouteKey, TopTab> = {
  ProductModule: 'Product',
  ServicesModule: 'Services',
  PaymentsModule: 'Payments',
  DineOutModule: 'DineOut',
};

export const TOP_TABS = Object.keys(MODULE_BY_TOP_TAB) as TopTab[];
export const CMS_MODULE_KEYS = Object.values(MODULE_BY_TOP_TAB) as CmsModuleKey[];

export const isTopTab = (value: unknown): value is TopTab =>
  TOP_TABS.includes(value as TopTab);

export const isCmsModuleKey = (value: unknown): value is CmsModuleKey =>
  CMS_MODULE_KEYS.includes(value as CmsModuleKey);

export type DashboardLayoutId = 'main' | 'ecommerce' | 'services' | 'bbps';

export type MainDashboardSectionKey =
  | 'header'
  | 'birthdays'
  | 'stepProgress'
  | 'exploreModules'
  | 'moduleBanner'
  | 'rewardsOverview';

export type EcommerceDashboardSectionKey =
  | 'categories'
  | 'bestSeller'
  | 'topRated'
  | 'offerHome'
  | 'newArrivals'
  | 'mostView'
  | 'recommended'
  | 'features'
  | 'recent'
  | 'productCategory';

export type DashboardSectionKey =
  | MainDashboardSectionKey
  | EcommerceDashboardSectionKey
  | string;

export type DashboardSection = {
  key: DashboardSectionKey;
  enabled: boolean;
  order: number;
  variant?: string;
  content?: Record<string, unknown>;
};

export type DashboardLayout = {
  id: DashboardLayoutId;
  version: number;
  sections: DashboardSection[];
  updatedAt?: string;
};

const section = (key: DashboardSectionKey, order: number): DashboardSection => ({
  key,
  enabled: true,
  order,
});

export const DEFAULT_DASHBOARD_LAYOUTS: Record<DashboardLayoutId, DashboardLayout> = {
  main: {
    id: 'main',
    version: 1,
    sections: [
      section('header', 10),
      section('birthdays', 20),
      section('stepProgress', 30),
      section('exploreModules', 40),
      section('moduleBanner', 50),
      section('rewardsOverview', 60),
    ],
  },
  ecommerce: {
    id: 'ecommerce',
    version: 1,
    sections: [
      section('categories', 10),
      section('bestSeller', 20),
      section('topRated', 30),
      section('offerHome', 40),
      section('newArrivals', 50),
      section('mostView', 60),
      section('recommended', 70),
      section('features', 80),
      section('recent', 90),
      section('productCategory', 100),
    ],
  },
  services: { id: 'services', version: 1, sections: [] },
  bbps: { id: 'bbps', version: 1, sections: [] },
};

export function normaliseDashboardLayout(
  value: unknown,
  id: DashboardLayoutId,
  supportedKeys: readonly string[],
): DashboardLayout {
  const fallback = DEFAULT_DASHBOARD_LAYOUTS[id];
  if (!value || typeof value !== 'object') return fallback;

  const candidate = value as Partial<DashboardLayout>;
  if (!Array.isArray(candidate.sections)) return fallback;

  const supported = new Set(supportedKeys);
  const seen = new Set<string>();
  const sections = candidate.sections
    .filter((item): item is DashboardSection => {
      if (!item || typeof item !== 'object') return false;
      const key = String((item as DashboardSection).key ?? '');
      if (!supported.has(key) || seen.has(key)) return false;
      seen.add(key);
      return (item as DashboardSection).enabled !== false;
    })
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));

  return {
    id,
    version: Number(candidate.version) || fallback.version,
    updatedAt: candidate.updatedAt,
    sections,
  };
}

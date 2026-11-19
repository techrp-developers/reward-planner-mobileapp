import { cmsApi } from '../../../config/cmsApiClient';
import { normalizeLocalCmsImageUrl } from '../../../config/apiConfig';
import { CMS_MODULE_KEYS, type CmsModuleKey } from './moduleMapping';

export type { CmsModuleKey } from './moduleMapping';

export interface CmsModule {
  module_key: CmsModuleKey | string;
  label: string;
  icon_url: string | null;
  active_icon_url: string | null;
  dashboard_icon_url: string | null;
  normal_color: string | null;
  active_color: string | null;
  gradient_start_color: string | null;
  gradient_end_color: string | null;
  route_key: string | null;
  sort_order: number;
  is_active: 0 | 1;
}

export interface CmsContentTarget {
  target_type?: string | null;
  target_id?: number | string | null;
  target_ids?: Array<number | string> | string | null;
}

export interface CmsZoneEntry extends CmsContentTarget {
  content_id: number;
  content_type: 'color' | 'image';
  color_value: string | null;
  text_color: string | null;
  image_url: string | null;
  title: string;
  cta_text: string | null;
  redirect_link: string | null;
  is_default: 0 | 1;
  status: 'default' | 'draft' | 'scheduled' | 'active' | 'expired';
  display_mode?: 'single' | 'carousel' | 'grid_2' | 'grid_3';
  images?: CmsOfferImage[];
}

export interface CmsOfferImage extends CmsContentTarget {
  image_id: number | null;
  image_url: string;
  sort_order: number;
  is_active: 0 | 1;
}

export interface CmsOffersBannerEntry extends CmsZoneEntry {
  images?: CmsOfferImage[];
}

export interface CmsResolvedZones {
  navbar_background?: CmsZoneEntry | null;
  promotional_banner?: CmsZoneEntry | null;
  offers_banner?: CmsOffersBannerEntry | null;
  brand_promotional_banner?: CmsZoneEntry | null;
}

interface CmsModulesResponse {
  success: boolean;
  message?: string;
  data?: CmsModule[];
}

interface CmsResolvedZonesResponse {
  success: boolean;
  message?: string;
  data?: CmsResolvedZones;
}

export type CmsNavbarBackgroundMap = Partial<Record<CmsModuleKey, CmsZoneEntry | null>>;

interface CmsResolvedNavbarResponse {
  success: boolean;
  message?: string;
  data?: Record<string, CmsZoneEntry | null>;
}

const normalizeModule = (module: CmsModule): CmsModule => ({
  ...module,
  icon_url: normalizeLocalCmsImageUrl(module.icon_url),
  active_icon_url: normalizeLocalCmsImageUrl(module.active_icon_url),
  dashboard_icon_url: normalizeLocalCmsImageUrl(module.dashboard_icon_url),
});

const normalizeOfferImage = (image: CmsOfferImage): CmsOfferImage => ({
  ...image,
  image_url: normalizeLocalCmsImageUrl(image.image_url) || '',
});

const normalizeZoneEntry = <T extends CmsZoneEntry>(
  entry: T | null | undefined,
): T | null => {
  if (!entry) {
    return null;
  }

  return {
    ...entry,
    image_url: normalizeLocalCmsImageUrl(entry.image_url),
    images: Array.isArray(entry.images) ? entry.images.map(normalizeOfferImage) : undefined,
  };
};

const normalizeResolvedZones = (
  zones: CmsResolvedZones | null | undefined,
): CmsResolvedZones => ({
  navbar_background: normalizeZoneEntry(zones?.navbar_background),
  promotional_banner: normalizeZoneEntry(zones?.promotional_banner),
  offers_banner: normalizeZoneEntry(zones?.offers_banner),
  brand_promotional_banner: normalizeZoneEntry(zones?.brand_promotional_banner),
});

export const fetchResolvedModules = async (): Promise<CmsModule[]> => {
  const { data } = await cmsApi.get<CmsModulesResponse>('/content/resolved/modules');
  return Array.isArray(data.data) ? data.data.map(normalizeModule) : [];
};

export const fetchResolvedNavbar = async (): Promise<CmsNavbarBackgroundMap> => {
  const { data } = await cmsApi.get<CmsResolvedNavbarResponse>('/content/resolved/navbar');
  const map: CmsNavbarBackgroundMap = {};
  CMS_MODULE_KEYS.forEach((key) => {
    map[key] = normalizeZoneEntry(data.data?.[key]);
  });
  return map;
};

export const fetchResolvedZones = async (
  module: CmsModuleKey,
): Promise<CmsResolvedZones> => {
  const { data } = await cmsApi.get<CmsResolvedZonesResponse>(
    `/content/resolved/${module}`,
  );
  return normalizeResolvedZones(data.data);
};

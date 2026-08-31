import { fetchResolvedZones } from "../../common/cms/cmsContentApi";
import { MODULE_BY_TOP_TAB } from "../../common/cms/moduleMapping";
import type {
  CmsOffersBannerEntry,
  CmsResolvedZones,
  CmsZoneEntry,
} from "../../common/cms/cmsContentApi";

export type { CmsOfferImage as ContentZoneImage } from "../../common/cms/cmsContentApi";

export interface ProductResolvedContent {
  navbar_background: CmsZoneEntry | null;
  promotional_banner: CmsZoneEntry | null;
  offers_banner: CmsOffersBannerEntry | null;
}

export const fetchProductContent = async (): Promise<ProductResolvedContent> => {
  const data: CmsResolvedZones = await fetchResolvedZones(MODULE_BY_TOP_TAB.Product);

  return {
    navbar_background: data.navbar_background ?? null,
    promotional_banner: data.promotional_banner ?? null,
    offers_banner: data.offers_banner ?? null,
  };
};

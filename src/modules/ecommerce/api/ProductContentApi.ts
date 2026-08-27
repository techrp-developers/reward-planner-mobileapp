import axios from "axios";
import { CMS_API_BASE_URL } from "../../../config/apiConfig";
import type { NavbarContentEntry } from "../../../navbar/api/NavbarContentApi";

const cmsApi = axios.create({
  baseURL: CMS_API_BASE_URL,
  timeout: 20000,
});

// offers_banner can carry a set of gallery images (multi-image carousel) in
// addition to the single legacy image_url. navbar_background/promotional_banner
// never have this field, so it's kept off the shared NavbarContentEntry type.
export interface ContentZoneImage {
  image_id: number | null;
  content_id: number;
  image_url: string;
  sort_order: number;
  is_active: number;
}

export interface OffersBannerEntry extends NavbarContentEntry {
  images?: ContentZoneImage[];
}

export interface ProductResolvedContent {
  navbar_background: NavbarContentEntry | null;
  promotional_banner: NavbarContentEntry | null;
  offers_banner: OffersBannerEntry | null;
}

interface ProductContentResponse {
  success: boolean;
  message: string;
  data: ProductResolvedContent;
}

// Public CMS-resolved content for the Product home screen (navbar background,
// promotional banner, offers banner). The backend has already applied
// scheduling/priority/default resolution — this call just fetches whatever
// it decided is active for each zone.
export const fetchProductContent = async (): Promise<ProductResolvedContent> => {
  const { data } = await cmsApi.get<ProductContentResponse>("/content/resolved/product");
  return data.data;
};

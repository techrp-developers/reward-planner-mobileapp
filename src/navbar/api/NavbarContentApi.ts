import { cmsApi } from "../../config/cmsApiClient";

export type NavbarModule = "product" | "service" | "payment" | "dineout";

export interface NavbarContentEntry {
  content_id: number;
  module: NavbarModule;
  zone: "navbar_background" | "promotional_banner" | "offers_banner";

  content_type: "color" | "image";

  color_value: string | null;
  image_url: string | null;

  title: string;
  cta_text: string | null;
  redirect_link: string | null;

  start_at: string | null;
  end_at: string | null;

  priority: number;
  is_default: number;
  is_published: number;

  created_by_name: string | null;
  created_at: string;
  updated_at: string;

  status: "default" | "draft" | "scheduled" | "active" | "expired";
}

export interface NavbarContentData {
  product: NavbarContentEntry | null;
  service: NavbarContentEntry | null;
  payment: NavbarContentEntry | null;
  dineout: NavbarContentEntry | null;
}

interface NavbarContentResponse {
  success: boolean;
  message: string;
  data: NavbarContentData;
}

// Public CMS-resolved navbar background per module (product/service/payment/
// dineout). The backend has already applied scheduling/priority/default
// resolution — this call just fetches whatever it decided is active.
export const fetchNavbarContent = async (): Promise<NavbarContentData> => {
  const { data } = await cmsApi.get<NavbarContentResponse>("/content/resolved/navbar");
  return data.data;
};

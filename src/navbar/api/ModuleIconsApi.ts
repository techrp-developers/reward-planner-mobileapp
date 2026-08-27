import axios from "axios";
import { CMS_API_BASE_URL } from "../../config/apiConfig";

const cmsApi = axios.create({
  baseURL: CMS_API_BASE_URL,
  timeout: 20000,
});

export interface ApiModuleIcon {
  module_key: string;
  label: string;
  icon_url: string | null;
  active_icon_url: string | null;
  normal_color: string | null;
  active_color: string | null;
  gradient_start_color: string | null;
  gradient_end_color: string | null;
  route_key: string | null;
  sort_order: number;
  is_active: number | boolean;
}

interface ModuleIconResponse {
  success: boolean;
  message?: string;
  data: ApiModuleIcon[];
}

export const getModules = async (): Promise<ApiModuleIcon[]> => {
  // Public/customer-facing endpoint — no auth role required, unlike
  // /content/modules which is gated to vendor_manager/admin on the backend.
  const { data } = await cmsApi.get<ModuleIconResponse>("/content/resolved/modules");
  return Array.isArray(data.data) ? data.data : [];
};

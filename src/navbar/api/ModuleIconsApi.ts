import { cmsApi } from "../../config/cmsApiClient";

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
  const { data } = await cmsApi.get<ModuleIconResponse>("/content/modules");
  return Array.isArray(data.data) ? data.data : [];
};

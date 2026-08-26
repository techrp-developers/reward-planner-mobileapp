import { api } from "../../modules/common/auth/api/axios";

export interface ModuleIcon {
  icon_id: number;
  module_key: string;
  icon_type: "image" | "svg";
  icon_url: string | null;
  active_icon_url: string | null;
  label: string;
  sort_order: number;
  is_active: number | boolean;
  route_key: string | null;
}

interface ModuleIconResponse {
  success: boolean;
  message?: string;
  data: ModuleIcon[];
}

export const fetchModules = async (): Promise<ModuleIcon[]> => {
  const { data } = await api.get<ModuleIconResponse>("/content/modules");
  return Array.isArray(data.data) ? data.data : [];
};

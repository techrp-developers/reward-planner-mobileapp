import { useQuery } from "@tanstack/react-query";

import { normalizeLocalCmsImageUrl } from "../../config/apiConfig";
import { fetchModules, ModuleIcon } from "../api/ModuleIconsApi";

export const moduleIconsQueryKey = ["content", "modules"] as const;

const MODULE_ICONS_STALE_TIME = 5 * 60 * 1000;

const isActiveModule = (module: ModuleIcon) =>
  module.is_active === true || Number(module.is_active) === 1;

const normalizeModuleIcon = (module: ModuleIcon): ModuleIcon => ({
  ...module,
  icon_url: normalizeLocalCmsImageUrl(module.icon_url),
  active_icon_url: normalizeLocalCmsImageUrl(module.active_icon_url),
});

export const useModuleIcons = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: moduleIconsQueryKey,
    queryFn: fetchModules,
    staleTime: MODULE_ICONS_STALE_TIME,
    select: (modules) =>
      modules
        .filter(isActiveModule)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map(normalizeModuleIcon),
  });

  return {
    modules: data ?? [],
    isLoading,
    isError,
  };
};

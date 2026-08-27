import { useQuery } from "@tanstack/react-query";

import { normalizeLocalCmsImageUrl } from "../../config/apiConfig";
import { getModules, ApiModuleIcon } from "../api/ModuleIconsApi";

export const moduleIconsQueryKey = ["content", "resolved", "modules"] as const;

const MODULE_ICONS_STALE_TIME = 5 * 60 * 1000;

const isActiveModule = (module: ApiModuleIcon) =>
  module.is_active === true || Number(module.is_active) === 1;

const normalizeModuleIcon = (module: ApiModuleIcon): ApiModuleIcon => ({
  ...module,
  icon_url: normalizeLocalCmsImageUrl(module.icon_url),
  active_icon_url: normalizeLocalCmsImageUrl(module.active_icon_url),
});

export const useModuleIcons = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: moduleIconsQueryKey,
    queryFn: getModules,
    staleTime: MODULE_ICONS_STALE_TIME,
    select: (modules) =>
      modules
        .filter(isActiveModule)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        .map(normalizeModuleIcon),
  });

  return {
    // API failure or an empty CMS response both resolve to an empty list —
    // the navbar simply renders no module tabs rather than falling back to
    // any hardcoded module set.
    modules: data ?? [],
    isLoading,
    isError,
  };
};

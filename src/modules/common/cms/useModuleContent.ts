import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import { fetchResolvedZones, CmsModuleKey } from './cmsContentApi';

export const resolvedContentQueryKey = ['cms', 'resolved'] as const;
export const CMS_CONTENT_STALE_TIME = 30_000;
export const moduleContentQueryKey = (module: CmsModuleKey) =>
  [...resolvedContentQueryKey, module] as const;

export const moduleContentQueryOptions = (module: CmsModuleKey) => ({
  queryKey: moduleContentQueryKey(module),
  queryFn: () => fetchResolvedZones(module),
  staleTime: CMS_CONTENT_STALE_TIME,
  refetchOnMount: true,
});

export const useModuleContent = (module: CmsModuleKey) => {
  const isFocused = useIsFocused();

  const query = useQuery({
    ...moduleContentQueryOptions(module),
    enabled: isFocused,
  });

  return {
    ...query,
    moduleContent: query.data ?? null,
  };
};

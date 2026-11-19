import React from 'react';
import { AppState } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchResolvedModules,
  fetchResolvedNavbar,
  type CmsModule,
  type CmsNavbarBackgroundMap,
} from './cmsContentApi';
import { CMS_CONTENT_STALE_TIME, resolvedContentQueryKey } from './useModuleContent';

type CmsAppShellState = {
  modules: CmsModule[];
  navbar: CmsNavbarBackgroundMap;
  isLoading: boolean;
  error: unknown;
};

const defaultState: CmsAppShellState = {
  modules: [],
  navbar: {},
  isLoading: false,
  error: null,
};

const CmsAppShellContext = React.createContext<CmsAppShellState>(defaultState);

export const CmsAppShellProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const modules = useQuery({
    queryKey: [...resolvedContentQueryKey, 'shell-modules'],
    queryFn: fetchResolvedModules,
    staleTime: CMS_CONTENT_STALE_TIME,
    retry: 2,
  });
  const navbar = useQuery({
    queryKey: [...resolvedContentQueryKey, 'shell-navbar'],
    queryFn: fetchResolvedNavbar,
    staleTime: CMS_CONTENT_STALE_TIME,
    retry: 2,
  });

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void queryClient.invalidateQueries({ queryKey: resolvedContentQueryKey }, { cancelRefetch: false });
      }
    });
    const refresh = setInterval(() => {
      if (AppState.currentState === 'active') {
        void queryClient.refetchQueries(
          { queryKey: resolvedContentQueryKey, type: 'active', stale: true },
          { cancelRefetch: false },
        );
      }
    }, CMS_CONTENT_STALE_TIME);
    return () => {
      subscription.remove();
      clearInterval(refresh);
    };
  }, [queryClient]);

  const state = React.useMemo<CmsAppShellState>(() => ({
    modules: modules.data ?? defaultState.modules,
    navbar: navbar.data ?? defaultState.navbar,
    isLoading: modules.isLoading || navbar.isLoading,
    error: modules.error ?? navbar.error,
  }), [modules.data, modules.error, modules.isLoading, navbar.data, navbar.error, navbar.isLoading]);

  return (
    <CmsAppShellContext.Provider value={state}>
      {children}
    </CmsAppShellContext.Provider>
  );
};

export const useCmsAppShell = () => React.useContext(CmsAppShellContext);

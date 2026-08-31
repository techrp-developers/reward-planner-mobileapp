import React from 'react';
import {
  fetchResolvedModules,
  fetchResolvedNavbar,
  type CmsModule,
  type CmsNavbarBackgroundMap,
} from './cmsContentApi';

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
  const [state, setState] = React.useState<CmsAppShellState>({
    ...defaultState,
    isLoading: true,
  });

  React.useEffect(() => {
    let cancelled = false;

    console.log('[CMS] AppShell fetch starting');

    Promise.all([fetchResolvedModules(), fetchResolvedNavbar()])
      .then(([modules, navbar]) => {
        console.log('[CMS] AppShell fetch resolved:', {
          modules: JSON.stringify(modules),
          navbar: JSON.stringify(navbar),
        });
        if (cancelled) {
          console.log('[CMS] AppShell fetch resolved but effect was cancelled — state not stored');
          return;
        }
        const nextState = { modules, navbar, isLoading: false, error: null };
        console.log('[CMS] AppShell storing state:', JSON.stringify(nextState));
        setState(nextState);
      })
      .catch((error) => {
        console.log('[CMS] AppShell fetch failed:', error?.message ?? error);
        if (!cancelled) {
          setState({ ...defaultState, isLoading: false, error });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CmsAppShellContext.Provider value={state}>
      {children}
    </CmsAppShellContext.Provider>
  );
};

export const useCmsAppShell = () => React.useContext(CmsAppShellContext);

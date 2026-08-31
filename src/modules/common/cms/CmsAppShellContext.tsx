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

    Promise.all([fetchResolvedModules(), fetchResolvedNavbar()])
      .then(([modules, navbar]) => {
        if (!cancelled) {
          setState({ modules, navbar, isLoading: false, error: null });
        }
      })
      .catch((error) => {
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

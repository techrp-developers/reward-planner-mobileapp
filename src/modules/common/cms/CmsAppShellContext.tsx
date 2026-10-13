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

    // A one-shot fetch with no retry would permanently blank the app shell
    // if it happens to land during a transient network blip (e.g. the adb
    // reverse tunnel dropping on a USB reconnect) — retry a few times
    // before giving up, since nothing else re-triggers this effect.
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 1500;
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const load = async () => {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
          const [modules, navbar] = await Promise.all([fetchResolvedModules(), fetchResolvedNavbar()]);

          if (cancelled) {
            return;
          }
          const nextState = { modules, navbar, isLoading: false, error: null };
          setState(nextState);
          return;
        } catch (error: any) {
          if (cancelled) {
            return;
          }
          if (attempt === MAX_ATTEMPTS) {
            console.warn("[CMS] Unable to load app shell:", error?.message ?? error);
            setState({ ...defaultState, isLoading: false, error });
            return;
          }
          await delay(RETRY_DELAY_MS * attempt);
        }
      }
    };

    load();

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

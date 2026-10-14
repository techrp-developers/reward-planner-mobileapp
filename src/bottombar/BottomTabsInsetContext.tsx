import { createContext, useContext } from 'react';

// Height of the floating BottomTabs overlay (incl. the system bottom inset) that
// MainLayout draws on top of module screens. 0 when no tab bar is shown, e.g.
// when a module stack is opened directly from RootNavigator.
export const BottomTabsInsetContext = createContext(0);

export function useBottomTabsInset() {
  return useContext(BottomTabsInsetContext);
}

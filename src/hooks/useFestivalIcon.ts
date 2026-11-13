import { useEffect } from 'react';
import { AppState, NativeModules, Platform } from 'react-native';
import { refreshFestivalIcon } from '../services/iconService';

export const useFestivalIcon = (): void => {
  useEffect(() => {
    // This checkout has no iOS native switcher; leave iOS unchanged until it is registered.
    const bridge = Platform.OS === 'android' ? NativeModules.AppIconSwitcherModule : NativeModules.AppIconSwitcher;
    if (!bridge?.setAppIcon) return;
    const refresh = () => {
      void refreshFestivalIcon().catch(error => {
        console.warn('[AppIcon] Keeping current icon:', error?.message);
      });
    };
    if (AppState.currentState === 'active') refresh();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, []);
};

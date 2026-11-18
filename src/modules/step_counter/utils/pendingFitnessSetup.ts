import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const keyFor = (userId: number) => `@rewardsplanners/rp-move-pending/${userId}`;

export function logFitnessAndroid(event: string) {
  if (__DEV__ && Platform.OS === 'android') console.log('[RP_MOVE_ANDROID_FLOW]', event);
}

export async function savePendingFitnessSetup(userId: number) {
  await AsyncStorage.setItem(keyFor(userId), String(Date.now()));
  logFitnessAndroid('ENTER_HEALTH_SETUP');
}

export async function readPendingFitnessSetup(userId: number): Promise<boolean> {
  const stored = await AsyncStorage.getItem(keyFor(userId));
  if (stored === null) return false;
  const age = Date.now() - Number(stored);
  if (!/^\d+$/.test(stored) || age < 0 || age > MAX_AGE_MS) {
    await clearPendingFitnessSetup(userId);
    return false;
  }
  return true;
}

export function clearPendingFitnessSetup(userId: number) {
  return AsyncStorage.removeItem(keyFor(userId));
}

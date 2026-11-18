import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAppLanguage, type AppLanguage } from './languages';

const preferenceKey = (userId: number) => `@rewardsplanners/app-language/v1/${userId}`;
const pendingWrites = new Map<number, Promise<void>>();

export async function readLanguagePreference(userId: number): Promise<AppLanguage | null> {
  try {
    await pendingWrites.get(userId)?.catch(() => undefined);
    const stored = await AsyncStorage.getItem(preferenceKey(userId));
    return isAppLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeLanguagePreference(userId: number, language: AppLanguage): Promise<void> {
  const previous = pendingWrites.get(userId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(() => AsyncStorage.setItem(preferenceKey(userId), language));
  pendingWrites.set(userId, next);
  return next.finally(() => {
    if (pendingWrites.get(userId) === next) pendingWrites.delete(userId);
  });
}

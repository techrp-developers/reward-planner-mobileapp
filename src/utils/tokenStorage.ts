import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Keychain from "react-native-keychain";

export const ACCESS_TOKEN_SERVICE = "rp_access_token";
export const REFRESH_TOKEN_SERVICE = "rp_refresh_token";
export const AUTH_USER_NAME_KEY = "@rewardsplanners_user_name";

export async function saveAccessToken(token: string) {
  await Keychain.setGenericPassword("access", token, { service: ACCESS_TOKEN_SERVICE });
}

export async function saveRefreshToken(token: string) {
  await Keychain.setGenericPassword("refresh", token, { service: REFRESH_TOKEN_SERVICE });
}

export async function saveSession(accessToken: string, refreshToken: string, userName: string) {
  await Promise.all([
    saveAccessToken(accessToken),
    saveRefreshToken(refreshToken),
    AsyncStorage.setItem(AUTH_USER_NAME_KEY, userName),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  const result = await Keychain.getGenericPassword({ service: ACCESS_TOKEN_SERVICE });
  return result ? result.password : null;
}

export async function getRefreshToken(): Promise<string | null> {
  const result = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_SERVICE });
  return result ? result.password : null;
}

export async function updateAccessToken(token: string) {
  await saveAccessToken(token);
}

export async function clearAccessToken() {
  await Keychain.resetGenericPassword({ service: ACCESS_TOKEN_SERVICE });
}

export async function getCachedUserName(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_USER_NAME_KEY);
}

export async function clearSession() {
  await Promise.all([
    Keychain.resetGenericPassword({ service: ACCESS_TOKEN_SERVICE }),
    Keychain.resetGenericPassword({ service: REFRESH_TOKEN_SERVICE }),
    AsyncStorage.removeItem(AUTH_USER_NAME_KEY),
  ]);
}

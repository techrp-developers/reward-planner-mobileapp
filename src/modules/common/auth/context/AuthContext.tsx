import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import DeviceInfo from "react-native-device-info";
import api, { API_BASE_URL, setSessionHandlers } from "../api/axios";
import { clearAuthToken, persistAuthToken } from "../api/AuthAPI";
import { fetchTermsStatus } from "../../../ecommerce/api/TermsConditionAPI";
import { isTokenExpiringSoon } from "../utils/jwtUtils";

type AuthUser = {
  user_id: number;
  name?: string;
  email?: string;
  phone?: string;
  status?: number;
  is_verified?: number;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  loading: boolean;
  // null = not yet checked; false = must accept; true = already accepted
  termsAccepted: boolean | null;
  setTermsAccepted: (v: boolean) => void;
  // null = no pending popup; number = reward coins to show once, post-login.
  firstLoginReward: number | null;
  markFirstLoginRewardShown: () => void;
  authenticateWithTokens: (result: VerifyOtpResponse) => Promise<void>;
  bootstrapSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const extractUser = (payload: any): AuthUser | null => {
  const user = payload?.user || payload?.data?.user || payload?.data || null;

  if (!user) return null;

  return user;
};

const generateDeviceId = () => {
  const randomPart = Math.random().toString(36).substring(2, 12);
  const timePart = Date.now().toString(36);

  return `rp-${Platform.OS}-${timePart}-${randomPart}`;
};

const getDeviceName = () => {
  try {
    const brand = String(DeviceInfo.getBrand() || "").trim();
    const model = String(DeviceInfo.getModel() || "").trim();
    const systemName = String(DeviceInfo.getSystemName() || Platform.OS).trim();
    const systemVersion = String(DeviceInfo.getSystemVersion() || "").trim();
    const modelName = brand && model.toLowerCase().startsWith(brand.toLowerCase())
      ? model
      : [brand, model].filter(Boolean).join(" ");
    const operatingSystem = [systemName, systemVersion].filter(Boolean).join(" ");

    return `${modelName || "Unknown device"} (${operatingSystem})`.slice(0, 255);
  } catch {
    if (Platform.OS === "android") return "Android device";
    if (Platform.OS === "ios") return "iOS device";
    return "Unknown device";
  }
};

const getOrCreateDeviceId = async () => {
  const existingDeviceId = await secureGetItem(DEVICE_ID_KEY);

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const newDeviceId = generateDeviceId();
  await secureSetItem(DEVICE_ID_KEY, newDeviceId);
  return newDeviceId;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser]               = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading]         = useState(false);

  // null  = not yet checked (show Splash while waiting)
  // false = API returned terms_accepted: false  → show TermsGate
  // true  = API returned terms_accepted: true   → show App directly
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);

  // Pending first-login reward popup; set right after login, cleared once
  // the Dashboard has shown it and the user dismissed it.
  const [firstLoginReward, setFirstLoginReward] = useState<number | null>(null);

  const accessTokenRef    = useRef<string | null>(null);
  const isLoggingOutRef   = useRef(false);
  const restoreRetryRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateAccessToken = useCallback((nextAccessToken: string | null) => {
    accessTokenRef.current = nextAccessToken;
    setAccessToken(nextAccessToken);
  }, []);

  const clearLocalSession = useCallback(async () => {
    updateAccessToken(null);
    setUser(null);
    setTermsAccepted(null);
    setFirstLoginReward(null);
    await clearSession();
  }, [updateAccessToken]);

  const fetchProfile = useCallback(async () => {
    const profileRes = await fetchUserInfo();
    const nextUser = extractUser(profileRes || {});
    setUser(nextUser);
    return nextUser;
  }, []);

  const syncOnboardingState = useCallback(async (payload: any) => {
    const user = extractUser(payload);
    setUser(user);
    setTermsAccepted(isOnboardingComplete(user));
    return user;
  }, []);

  const authenticateWithTokens = useCallback(
    async (result: VerifyOtpResponse) => {
      setLoading(true);
      try {
        if (!result?.accessToken || !result?.refreshToken) {
          throw new Error("Invalid OTP verification response");
        }

        // verifyOtp() already persisted the session (Keychain + cached
        // username) — this just brings in-memory state up to match. Do NOT
        // call clearSession() here: it wipes the tokens verifyOtp just saved.
        updateAccessToken(result.accessToken);
        await syncOnboardingState(result);
      } finally {
        setLoading(false);
      }
    },
    [syncOnboardingState, updateAccessToken],
  );

  const markFirstLoginRewardShown = useCallback(() => {
    setFirstLoginReward(null);
  }, []);

  const restoreSession = useCallback(async () => {
    const currentAccessToken = accessTokenRef.current;

    if (currentAccessToken && !isTokenExpiringSoon(currentAccessToken)) {
      await fetchProfile();
      return;
    }

    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      updateAccessToken(null);
      setUser(null);
      setTermsAccepted(null);
      return;
    }

    try {
      const refreshRes = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, {
        refreshToken,
      });

      const nextAccessToken = refreshRes.data?.accessToken || null;
      const nextRefreshToken = refreshRes.data?.refreshToken || null;

      if (!nextAccessToken || !nextRefreshToken) {
        throw new Error("Missing token pair from refresh");
      }

      // The backend rotates refresh tokens, so save both replacements before
      // making any authenticated follow-up request.
      await Promise.all([
        persistAuthToken(nextAccessToken),
        secureSetItem(REFRESH_TOKEN_KEY, nextRefreshToken),
      ]);
      updateAccessToken(nextAccessToken);

      await fetchProfile();

      // Re-check terms on every session restore so the gate shows
      // correctly if the user was previously mid-onboarding.
      await checkTerms();
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 401 || status === 403) {
        await clearLocalSession();
      }
      throw error;
    }
  }, [clearLocalSession, fetchProfile, updateAccessToken]);

  const bootstrapSession = useCallback(async () => {
    const maxRestoreAttempts = 3;
    let restoreAttempts = 0;

    const attemptRestore = async () => {
      restoreAttempts += 1;

      try {
        await restoreSession();
        setIsInitializing(false);
      } catch (error: any) {
        const status = Number(error?.response?.status || 0);

        if (status === 401 || status === 403) {
          // The stored refresh session is definitively invalid/revoked.
          setIsInitializing(false);
          return;
        }

        // A local/offline backend must not hold the app on Splash forever.
        // Preserve the stored session and retry briefly in the background.
        setIsInitializing(false);

        if (restoreAttempts < maxRestoreAttempts) {
          restoreRetryRef.current = setTimeout(attemptRestore, 5000);
        }
      }
    };

    await attemptRestore();
  }, [restoreSession]);

  useEffect(() => {
    setSessionHandlers({
      getAccessToken: () => accessTokenRef.current,

      getRefreshToken: async () => getRefreshToken(),

      onSessionRefresh: async (nextAccessToken, nextRefreshToken) => {
        await Promise.all([
          persistAuthToken(nextAccessToken),
          secureSetItem(REFRESH_TOKEN_KEY, nextRefreshToken),
        ]);
        updateAccessToken(nextAccessToken);
      },

      onLogout: async () => {
        await clearLocalSession();
      },
    });

    return () => {
      setSessionHandlers(null);
    };
  }, [clearLocalSession, updateAccessToken]);

  useEffect(() => {
    bootstrapSession();

    return () => {
      if (restoreRetryRef.current) {
        clearTimeout(restoreRetryRef.current);
      }
    };
  }, [bootstrapSession]);

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) return;

    isLoggingOutRef.current = true;
    setLoading(true);

    try {
      await logoutRequest();
    } catch (error) {
      if (__DEV__) console.log("[AuthContext] logout failed, clearing local session anyway", error);
    } finally {
      await clearLocalSession();
      isLoggingOutRef.current = false;
      setLoading(false);
    }
  }, [clearLocalSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isInitializing,
      loading,
      termsAccepted,
      setTermsAccepted,
      firstLoginReward,
      markFirstLoginRewardShown,
      authenticateWithTokens,
      bootstrapSession,
      restoreSession,
      logout,
    }),
    [
      user,
      accessToken,
      isInitializing,
      loading,
      termsAccepted,
      firstLoginReward,
      markFirstLoginRewardShown,
      authenticateWithTokens,
      bootstrapSession,
      restoreSession,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

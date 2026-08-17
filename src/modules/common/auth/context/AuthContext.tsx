import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { setSessionHandlers } from "../api/axios";
import {
  fetchUserInfo,
  isOnboardingComplete,
  logout as logoutRequest,
  restoreSession as restoreAuthSession,
  VerifyOtpResponse,
} from "../api/AuthAPI";
import {
  clearSession,
  getRefreshToken,
  saveSession,
  updateAccessToken as persistAccessTokenInKeychain,
} from "../../../../utils/tokenStorage";
import { isTokenExpiringSoon } from "../utils/jwtUtils";
<<<<<<< HEAD
=======

const REFRESH_TOKEN_KEY = "@rewardsplanners_refresh_token";
const DEVICE_ID_KEY = "@rewardsplanners_device_id";
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28

type AuthUser = {
  user_id: number;
  name?: string;
  email?: string;
  phone?: string;
  status?: number;
  is_verified?: number;
};

<<<<<<< HEAD
=======
type RegisterPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  cpassword: string;
};

>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
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
<<<<<<< HEAD
  authenticateWithTokens: (result: VerifyOtpResponse) => Promise<void>;
=======
  register: (payload: RegisterPayload) => Promise<any>;
  verifyEmail: (token: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<any>;
  requestLoginOtp: (identifier: string) => Promise<any>;
  verifyLoginOtp: (identifier: string, otp: string) => Promise<any>;
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
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

<<<<<<< HEAD
  const authenticateWithTokens = useCallback(
    async (result: VerifyOtpResponse) => {
      setLoading(true);
      try {
        if (!result?.accessToken || !result?.refreshToken) {
          throw new Error("Invalid OTP verification response");
=======
  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      const response = await api.post("/v1/auth/register", payload);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    if (!token?.trim()) return false;

    const response = await axios.get(`${API_BASE_URL}/v1/auth/verify-email`, {
      params: { token: token.trim() },
      responseType: "text",
    });

    return response.status >= 200 && response.status < 300;
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    const response = await api.post("/v1/auth/resend-verification", { email });
    return response.data;
  }, []);

  const requestLoginOtp = useCallback(async (identifier: string) => {
    setLoading(true);
    try {
      const response = await api.post("/v1/auth/request-otp", { login: identifier });
      return response.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyLoginOtp = useCallback(
    async (identifier: string, otp: string) => {
      setLoading(true);
      try {
        const deviceId   = await getOrCreateDeviceId();
        const deviceName = getDeviceName();
        const response = await api.post("/v1/auth/verify-otp", {
          login: identifier,
          otp,
          device_id:   deviceId,
          device_name: deviceName,
        });

        const nextAccessToken  = response.data?.accessToken  || null;
        const nextRefreshToken = response.data?.refreshToken || null;

        if (!nextAccessToken || !nextRefreshToken) {
          throw new Error("Invalid OTP login response");
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
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
      const refreshRes = await restoreAuthSession();
      const nextAccessToken = refreshRes?.accessToken || null;

      if (!nextAccessToken) {
        throw new Error("Missing access token from refresh");
      }

      updateAccessToken(nextAccessToken);
      await persistAccessTokenInKeychain(nextAccessToken);
      const profile = await fetchProfile();
      setTermsAccepted(isOnboardingComplete(profile as any));
    } catch (error: any) {
      const status = error?.response?.status;

      if (status === 401 || status === 403) {
        await clearLocalSession();
      }
      throw error;
    }
  }, [clearLocalSession, fetchProfile, updateAccessToken]);

  const bootstrapSession = useCallback(async () => {
    try {
      await restoreSession();
    } catch (error) {
      // Fallback to AuthStack on restore failure.
      if (__DEV__) console.log("[AuthContext] bootstrapSession restore failed", error);
    } finally {
      setIsInitializing(false);
    }
  }, [restoreSession]);

  useEffect(() => {
    setSessionHandlers({
      getAccessToken: () => accessTokenRef.current,

      getRefreshToken: async () => getRefreshToken(),

      onAccessTokenRefresh: async (nextAccessToken) => {
        updateAccessToken(nextAccessToken);
        await persistAccessTokenInKeychain(nextAccessToken);
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
<<<<<<< HEAD
      authenticateWithTokens,
=======
      register,
      verifyEmail,
      resendVerification,
      requestLoginOtp,
      verifyLoginOtp,
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
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
<<<<<<< HEAD
      authenticateWithTokens,
=======
      register,
      verifyEmail,
      resendVerification,
      requestLoginOtp,
      verifyLoginOtp,
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
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

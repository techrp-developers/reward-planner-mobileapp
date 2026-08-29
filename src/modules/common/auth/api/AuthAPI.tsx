  import axios from "axios";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import api from "./axios";
  import { API_BASE_URL } from '../../../../config/apiConfig';
  import {
    clearAccessToken,
    clearSession,
    getAccessToken,
    getCachedUserName,
    getRefreshToken,
    saveSession,
    updateAccessToken,
  } from "../../../../utils/tokenStorage";
  const AUTH_USER_NAME_KEY = "@rewardsplanners_user_name";

let authToken: string | null = null;

const extractToken = (responseData: any) => {
  return (
    responseData?.token ||
    responseData?.accessToken ||
    responseData?.access_token ||
    responseData?.data?.token ||
    responseData?.data?.accessToken ||
    responseData?.data?.access_token ||
    responseData?.data?.jwt ||
    responseData?.jwt ||
    responseData?.data?.tokens?.access?.token ||
    responseData?.tokens?.access?.token ||
    null
  );
};

const extractUserName = (responseData: any) => {
  return (
    responseData?.name ||
    responseData?.user?.name ||
    responseData?.user?.full_name ||
    responseData?.user?.username ||
    responseData?.data?.name ||
    responseData?.data?.user?.name ||
    responseData?.data?.user?.full_name ||
    responseData?.data?.user?.username ||
    null
  );
};

const normalizeToken = (token?: string | null) => {
  const cleaned = String(token || "").trim();

  if (!cleaned || cleaned === "logged-in-session") {
    return null;
  }

  if (cleaned.toLowerCase().startsWith("bearer ")) {
    return cleaned.slice(7).trim() || null;
  }

  return cleaned;
};

const applyAuthHeader = (token?: string | null) => {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

export const setAuthToken = (token?: string | null) => {
  authToken = normalizeToken(token);
  applyAuthHeader(authToken);
};

export const persistAuthToken = async (token?: string | null) => {
  const normalizedToken = normalizeToken(token);
  setAuthToken(normalizedToken);

  if (normalizedToken) {
    await updateAccessToken(normalizedToken);
    return;
  }

  await clearAccessToken();
};

export const hydrateAuthToken = async () => {
  const storedToken = await getAccessToken();
  const normalizedToken = normalizeToken(storedToken);

  if (!normalizedToken && storedToken) {
    await clearAccessToken();
  }

  setAuthToken(normalizedToken);
  return normalizedToken;
};

export const clearAuthToken = async () => {
  setAuthToken(null);
  await clearAccessToken();
};

export const setStoredUserName = async (name?: string | null) => {
  const normalizedName = String(name || "").trim();

  if (!normalizedName) {
    await AsyncStorage.removeItem(AUTH_USER_NAME_KEY);
    return;
  }

  await AsyncStorage.setItem(AUTH_USER_NAME_KEY, normalizedName);
};

export const getStoredUserName = async () => {
  const storedName = await getCachedUserName();
  const normalizedName = String(storedName || "").trim();
  return normalizedName || null;
};

export const getAuthToken = () => authToken;
export const isAuthenticated = () => Boolean(authToken);

export const getAuthHeaders = async () => {
  const token = getAuthToken() || (await hydrateAuthToken());

  if (!token) {
    applyAuthHeader(null);
    return {};
  }

  setAuthToken(token);

  return {
    Authorization: `Bearer ${token}`,
  };
};

export interface ApiUser {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  terms_accepted: 0 | 1;
  fitness_onboarding_done: 0 | 1;
}

export interface AuthSuccessResponse {
  success: true;
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

export interface CheckIdentifierResponse {
  success: true;
  registered: true;
  type: "phone" | "email";
}

export const isOnboardingComplete = (user?: Partial<ApiUser> | null) => {
  return Boolean(user?.terms_accepted && user?.fitness_onboarding_done);
};

export const fetchUserInfo = async () => {
  const hasInMemoryToken = isAuthenticated();

  if (!hasInMemoryToken) {
    const token = await hydrateAuthToken();
    if (!token) {
      return null;
    }
  }

  try {
    const headers = await getAuthHeaders();

    if (!headers.Authorization) {
      return null;
    }

    const res = await api.get("/v1/auth/user-info", { headers });
    const responseData = res?.data || {};
    const user = responseData?.user || responseData?.data?.user || responseData?.data || null;

    const fullName = user?.name || user?.full_name || user?.username || null;
    const nameParts = fullName ? fullName.trim().split(/\s+/) : [];
    const firstName = nameParts[0] || null;
    const lastName = nameParts.slice(1).join(" ") || null;

    const defaultAddress = user?.defaultAddress || null;
    const city = defaultAddress?.city || null;
    const pincode = defaultAddress?.zipcode || null;
    const state = defaultAddress?.state || null;

    return {
      ...responseData,
      user: {
        ...(user || {}),
        first_name: firstName,
        last_name: lastName,
        city,
        pincode,
        state,
      },
      name: fullName,
    };
  } catch (error: any) {
    const status = error?.response?.status;

    if (status === 401) {
      console.debug("User info fetch: Unauthorized (token may be expired)");
      await clearAuthToken();
      return null;
    }

    if (status >= 500) {
      console.warn("User info fetch: Server error", status);
      return null;
    }

    console.debug("User info fetch failed:", error?.message || error);
    return null;
  }
};

  export type DeleteCustomerResponse = {
    success: boolean;
    status?: string;
    message: string;
    data?: {
      gracePeriodDays: number;
      deletionRequestedAt: string;
      permanentDeletionAt: string;
    };
  };

  export const deleteCustomer = async (): Promise<DeleteCustomerResponse> => {
    try {
      const res = await api.delete("/v1/auth/delete-customer");

      return res.data;
    } catch (error) {
      console.error('Delete customer API failed', error);
      throw error;
    }
  };

export const updateProfile = async (formData: FormData) => {
  const res = await api.put("/v1/auth/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

  export type ActivateAccountPayload = {
    email: string;
  };

  export const activateAccount = async (payload: ActivateAccountPayload) => {
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/activate-account`,
      payload
    );
    return res.data;
  };

  export type VerifyActivationOtpPayload = {
    email: string;
    otp: string | number;
  };

  export const verifyActivationOtp = async (
    payload: VerifyActivationOtpPayload
  ) => {
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/verify-activation-otp`,
      payload
    );

    const token = extractToken(res.data);
    if (token) {
      await persistAuthToken(token);
    }

    const userName = extractUserName(res.data);
    if (userName) {
      await setStoredUserName(userName);
    }

    return res.data;
  };

  export type SetPasswordPayload = {
    email: string;
    password: string;
  };

  export const setPassword = async (payload: SetPasswordPayload) => {
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/set-password`,
      payload
    );

    const token = extractToken(res.data);
    if (token) {
      await persistAuthToken(token);
    }

    const userName = extractUserName(res.data);
    if (userName) {
      await setStoredUserName(userName);
    }

    return res.data;
  };

  // =============================== Forgot Password ==============================

  export type ForgotPasswordPayload = {
    email: string;
  };

  export const forgotPassword = async (payload: ForgotPasswordPayload) => {
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/forgot-password`,
      payload
    );
    return res.data;
  };

  // =============================== Resend OTP ==============================

  export type ResendOtpPayload = {
    email: string;
  };

  export const resendOtp = async (payload: ResendOtpPayload) => {
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/resend-otp`,
      payload
    );
    return res.data;
  };

  // =============================== Verify Forgot Password OTP ==============================

  export type VerifyForgotPasswordOtpPayload = {
    email: string;
    otp: string;
  };

  export const verifyForgotPasswordOtp = async (
    payload: VerifyForgotPasswordOtpPayload
  ) => {
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/verify-forgot-password-otp`,
      payload
    );
    return res.data;
  };

  // =============================== Reset Password ==============================

  export type ResetPasswordPayload = {
    email: string;
    newPassword: string;
  };

  export const resetPassword = async (payload: ResetPasswordPayload) => {
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/reset-password`,
      payload
    );
    return res.data;
  };

  // =============================== Resend Activation OTP ==============================

  export type ResendActivationOtpPayload = {
    email: string;
  };

  export const resendActivationOtp = async (
    payload: ResendActivationOtpPayload
  ) => {
    const res = await axios.post(
      `${API_BASE_URL}/v1/auth/resend-activation-otp`,
      payload
    );
    return res.data;
  };

  // =============================== OTP Login ==============================
  // Consumed by OTPScreen / LocationAccessScreen via AuthContext's
  // authenticateWithTokens(). Restored after a merge silently dropped these.

  const withLog = <A extends any[], R>(label: string, fn: (...args: A) => Promise<R>) => {
    return async (...args: A): Promise<R> => {
      if (__DEV__) console.log(`[${label}] called with`, ...args);
      try {
        const result = await fn(...args);
        if (__DEV__) console.log(`[${label}] success`, result);
        return result;
      } catch (err) {
        if (__DEV__) console.log(`[${label}] failed`, err);
        throw err;
      }
    };
  };

  export type CheckExistenceResponse = {
    success: boolean;
    registered: boolean;
    type?: "phone" | "email";
  };

  export type SendOtpResponse = {
    success: boolean;
    message: string;
  };

  export type OtpUser = ApiUser;

  export type VerifyOtpResponse = AuthSuccessResponse;

  export const checkIdentifier = withLog("checkIdentifier", async (
    identifier: string,
  ): Promise<CheckIdentifierResponse> => {
    const { data } = await api.post<CheckIdentifierResponse>("/v1/auth/check", { identifier });
    return data;
  });

  export const sendOtp = withLog("sendOtp", async (
    identifier: string,
  ): Promise<SendOtpResponse> => {
    const { data } = await api.post<SendOtpResponse>("/v1/auth/request-otp", { login: identifier });
    return data;
  });

  export const verifyOtp = withLog("verifyOtp", async (
    identifier: string,
    otp: string,
  ): Promise<VerifyOtpResponse> => {
    const { data } = await api.post<AuthSuccessResponse>("/v1/auth/verify-otp", { login: identifier, otp });
    await saveSession(data.accessToken, data.refreshToken, data.user.name);
    setAuthToken(data.accessToken);
    return data;
  });

  export const refreshAccessToken = withLog("refreshAccessToken", async (
    refreshToken: string,
  ): Promise<{ success: boolean; accessToken: string }> => {
    const { data } = await api.post<{ success: boolean; accessToken: string }>("/v1/auth/refresh", { refreshToken });
    return data;
  });

  export const logout = withLog("logout", async (): Promise<void> => {
    try {
      await api.post("/v1/auth/logout");
    } catch (err) {
      console.log("[logout] server call failed (clearing local session anyway)", err);
    } finally {
      await clearSession();
      setAuthToken(null);
    }
  });

  export const restoreSession = async (): Promise<{ accessToken: string; refreshToken?: string } | null> => {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return null;
    }

    try {
      // The backend rotates refresh tokens on every call (revokes this one,
      // issues a new one) — callers MUST persist data.refreshToken if present,
      // or the next restore will fail with an already-revoked token.
      const { data } = await api.post<{ success: boolean; accessToken: string; refreshToken?: string }>("/v1/auth/refresh", { refreshToken });
      return data;
    } catch (err) {
      console.log("[restoreSession] failed, session invalid", err);
      return null;
    }
  };

  export const completeOnboarding = withLog("completeOnboarding", async () => {
    const { data } = await api.post<{ success: boolean }>('/v1/auth/complete-onboarding');
    return data;
  });


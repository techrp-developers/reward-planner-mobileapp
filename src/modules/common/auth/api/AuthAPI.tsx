  import axios from "axios";
  import AsyncStorage from "@react-native-async-storage/async-storage";
  import api from "./axios";
  import { API_BASE_URL } from '../../../../config/apiConfig';
  const AUTH_TOKEN_KEY = "@rewardsplanners_auth_token";
  const AUTH_USER_NAME_KEY = "@rewardsplanners_user_name";

let authToken: string | null = null;

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


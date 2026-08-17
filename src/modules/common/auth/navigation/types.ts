import type { VerifyOtpResponse } from "../api/AuthAPI";

// Matches the backend's /v1/auth/check `type` field exactly.
export type AuthMethod = "phone" | "email";

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
<<<<<<< HEAD
  OTPScreen: {
    method: AuthMethod;
    destination: string;
    maskedDestination?: string;
  };
  LocationAccess: {
    verifyResult: VerifyOtpResponse;
  };
  Onboarding: undefined;
=======
  LoginOTP: { identifier: string };
  // Legacy routes retained only for isolated screen type-checking. They are no
  // longer registered in either auth navigator or exposed by the login UI.
  AccountActivate: undefined;
  ForgotPassword: undefined;
  OTPScreen: { email: string; type?: "forgot-password" | "activation" };
  SetNewPassword: { email: string; type?: "forgot-password" | "activation" };
  AccountActivationSuccess: undefined;
  PasswordSuccess: undefined;
  VerifyEmail: { email: string };
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
};

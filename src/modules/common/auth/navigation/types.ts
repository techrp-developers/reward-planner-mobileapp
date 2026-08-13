export type AuthStackParamList = {
  Login: undefined;
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
};

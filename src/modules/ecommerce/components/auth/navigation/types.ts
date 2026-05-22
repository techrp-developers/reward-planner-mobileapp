// navigation/types.ts

export type AuthStackParamList = {
  Login: undefined;
  AccountActivate: undefined;
  OTPScreen: { email: string };
  SetNewPassword: { email: string };
  AccountActivationSuccess: undefined;
  VerifyEmail: { email: string };
};
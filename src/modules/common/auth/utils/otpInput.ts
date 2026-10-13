import { OTP_LENGTH } from '../constants/otp';
export const authErrorMessage = (error: unknown, fallback: string): string => {
  const failure = error as { response?: { data?: { message?: string } }; message?: string };
  return failure?.response?.data?.message || failure?.message || fallback;
};
export const rateLimitDelay = (error: unknown): number => {
  const failure = error as { response?: { status?: number; headers?: Record<string, string> } };
  if (failure?.response?.status !== 429) return 0;
  const value = failure.response.headers?.['retry-after'];
  const seconds = Number(value);
  if (value && Number.isFinite(seconds)) return Math.max(1, seconds);
  const date = value ? Date.parse(value) : NaN;
  return Number.isFinite(date) ? Math.max(1, Math.ceil((date - Date.now()) / 1000)) : 60;
};

export const emptyOtp = (): string[] => Array(OTP_LENGTH).fill('');
export const updateOtpDigits = (current: string[], text: string, index: number) => {
  const digits = [...current];
  const value = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
  const start = value.length === OTP_LENGTH ? 0 : index;
  if (!value) digits[index] = '';
  else value.slice(0, OTP_LENGTH - start).split('').forEach((digit, offset) => { digits[start + offset] = digit; });
  const focusIndex = Math.min(OTP_LENGTH - 1, start + value.length);
  return { digits, focusIndex };
};

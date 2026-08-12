import { useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  addSmsListener,
  extractOtp,
  removeSmsListener,
  startSmsRetriever,
} from "@pushpendersingh/react-native-otp-verify";
import { OTP_LENGTH, SMS_AUTOFILL_TIMEOUT_SECONDS } from "../constants/otp";

type UseOtpAutofillResult = {
  code: string | null;
  starting: boolean;
  error: string | null;
};

// Android-only: listens for the OTP SMS via Google's SMS Retriever API (zero
// permissions). iOS relies on textContentType="oneTimeCode" on the input
// itself, so this hook is a no-op there. `active` should be false until the
// OTP has actually been sent, so the listener's 5-minute window isn't burned
// while the user is still on the entry screen.
export function useOtpAutofill(active: boolean): UseOtpAutofillResult {
  const [code, setCode] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "android" || !active) {
      return;
    }

    let cancelled = false;
    let subscription: { remove: () => void } | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const start = async () => {
      setStarting(true);
      setError(null);
      setCode(null);

      try {
        await startSmsRetriever();
        if (cancelled) return;

        subscription = addSmsListener((sms) => {
          if (sms.status === "success" && sms.message) {
            const otp = extractOtp(sms.message, OTP_LENGTH);
            if (otp) setCode(otp);
            return;
          }
          if (sms.status === "timeout") {
            setError("No SMS received — you can enter the code manually.");
            return;
          }
          if (sms.status === "error") {
            setError("Couldn't read the SMS automatically — enter the code manually.");
          }
        });

        timeoutId = setTimeout(() => {
          setError((prev) => prev ?? "Having trouble? Enter the code manually.");
        }, SMS_AUTOFILL_TIMEOUT_SECONDS * 1000);
      } catch {
        if (!cancelled) {
          setError("SMS autofill unavailable — enter the code manually.");
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      subscription?.remove();
      removeSmsListener().catch(() => {});
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [active]);

  return { code, starting, error };
}

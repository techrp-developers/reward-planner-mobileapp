import { useCallback, useState } from "react";
import { Platform } from "react-native";
import {
  PhoneNumberHintErrorCodes,
  showPhoneNumberHint,
} from "@shayrn/react-native-android-phone-number-hint";

type UsePhoneHintResult = {
  requestHint: () => Promise<string | null>;
  unavailable: boolean;
};

// Android-only Google Phone Number Hint picker. Resolves null (never throws)
// on cancellation or when the API genuinely isn't available, so callers can
// always fall back to manual entry without special-casing errors.
export function usePhoneHint(): UsePhoneHintResult {
  const [unavailable, setUnavailable] = useState(false);

  const requestHint = useCallback(async (): Promise<string | null> => {
    if (Platform.OS !== "android") return null;

    try {
      return await showPhoneNumberHint();
    } catch (error: any) {
      const code = error?.code;

      if (
        code === PhoneNumberHintErrorCodes.API_NOT_CONNECTED ||
        code === PhoneNumberHintErrorCodes.RESOLUTION_REQUIRED ||
        code === PhoneNumberHintErrorCodes.SIGN_IN_REQUIRED
      ) {
        setUnavailable(true);
      }

      // USER_CANCELLED and every other case: silent fallback to manual entry.
      return null;
    }
  }, []);

  return { requestHint, unavailable };
}

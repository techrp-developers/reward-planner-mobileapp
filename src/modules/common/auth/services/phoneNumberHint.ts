import { NativeModules, Platform } from "react-native";

type PhoneNumberHintModule = {
  requestPhoneNumberHint: () => Promise<string | null>;
};

const nativeModule = NativeModules.PhoneNumberHint as PhoneNumberHintModule | undefined;

export const isPhoneNumberHintAvailable = () =>
  Platform.OS === "android" && typeof nativeModule?.requestPhoneNumberHint === "function";

export const requestPhoneNumberHint = async () => {
  if (!isPhoneNumberHintAvailable()) {
    return null;
  }

  return nativeModule!.requestPhoneNumberHint();
};

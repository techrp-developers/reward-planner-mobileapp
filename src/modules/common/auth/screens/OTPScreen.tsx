import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useRoute, RouteProp } from "@react-navigation/native";
import Logo from "../../../../assets/homepage/login_logo.svg";
import { useAlert } from "../../../ecommerce/components/alerts";
import { useAuth } from "../context/AuthContext";
import type { AuthStackParamList } from "../navigation/types";
import { useAppTheme } from "../../../../theme/ThemeContext";

type OTPScreenRouteProp = RouteProp<AuthStackParamList, "LoginOTP">;
const OTP_LENGTH = 6;
const createEmptyOtp = () => Array(OTP_LENGTH).fill("");

function OTPScreen() {
  const route = useRoute<OTPScreenRouteProp>();
  const alert = useAlert();
  const { verifyLoginOtp, requestLoginOtp } = useAuth();
  const { isDark } = useAppTheme();

  const identifier = route.params?.identifier || "";

  const resendAvailableAt = route.params?.resendAvailableAt || Date.now() + 60000;
  const initialTimer = Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));

  const [otpValues, setOtpValues] = useState<string[]>(createEmptyOtp);
  const [timer, setTimer] = useState(initialTimer);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(initialTimer > 0);
  const otpRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (timer === 0) {
      setResendCooldown(false);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    const digits = text.replace(/\D/g, "");

    // Autofill and clipboard paste can deliver the complete OTP to one input.
    // Distribute it across the visible boxes without adding SMS-reading logic.
    if (digits.length > 1) {
      const nextOtp = [...otpValues];
      const startIndex = digits.length >= OTP_LENGTH ? 0 : index;

      digits.slice(0, OTP_LENGTH - startIndex).split("").forEach((digit, offset) => {
        nextOtp[startIndex + offset] = digit;
      });

      setOtpValues(nextOtp);

      const nextEmptyIndex = nextOtp.findIndex((digit) => !digit);
      const focusIndex = nextEmptyIndex >= 0 ? nextEmptyIndex : OTP_LENGTH - 1;
      otpRefs.current[focusIndex]?.focus();
      return;
    }

    const newOtp = [...otpValues];
    newOtp[index] = digits;
    setOtpValues(newOtp);

    if (digits && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = useCallback(async () => {
    if (verifyingRef.current) return;

    const otp = otpValues.join("");
    if (otp.length !== OTP_LENGTH) {
      alert.error("Validation", `Please enter all ${OTP_LENGTH} digits of the login code`);
      return;
    }

    try {
      verifyingRef.current = true;
      setLoading(true);

      await verifyLoginOtp(identifier, otp);
    } catch (error: any) {
      alert.error(
        "Verification Failed",
        error?.response?.data?.message || "Invalid OTP"
      );
    } finally {
      setLoading(false);
      verifyingRef.current = false;
    }
  }, [alert, identifier, otpValues, verifyLoginOtp]);

  useEffect(() => {
    const otp = otpValues.join("");

    if (otp.length === OTP_LENGTH) {
      handleVerify();
    }
  }, [handleVerify, otpValues]);

  const handleResend = async () => {
    if (resendCooldown || resendLoading) return;

    try {
      setResendLoading(true);

      await requestLoginOtp(identifier);

      alert.info("Resent", "A new login code was sent to your registered contact");
      setTimer(60);
      setResendCooldown(true);
      setOtpValues(createEmptyOtp());
      otpRefs.current[0]?.focus();
    } catch (error: any) {
      alert.error(
        "Resend Failed",
        error?.response?.data?.message || "Failed to resend OTP"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? "#09090B" : "#F5F0FF" }]}>
      <View style={styles.logoWrap}>
        <Logo width={160} height={160} />
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? "#111113" : "#FFFFFF" }]}>
        <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#852BAF" }]}>
          Login Verification
        </Text>

        <Text style={[styles.subText, { color: isDark ? "#D4D4D8" : "#555" }]}>
          Enter the {OTP_LENGTH}-digit code sent to {identifier || "your registered contact"}
        </Text>

        <View style={styles.otpRow}>
          {otpValues.map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                otpRefs.current[i] = ref;
              }}
              maxLength={OTP_LENGTH}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              importantForAutofill="yes"
              selectTextOnFocus
              style={[
                styles.otpInput,
                {
                  backgroundColor: isDark ? "#18181B" : "#F9F9F9",
                  borderColor: isDark ? "rgba(255,255,255,0.10)" : "#E0E0E0",
                  color: isDark ? "#FFFFFF" : "#111827",
                },
              ]}
              value={otpValues[i]}
              onChangeText={(text) => handleOtpChange(text, i)}
              onKeyPress={(e) => handleOtpKeyPress(e, i)}
              editable={!loading}
            />
          ))}
        </View>

        <Text style={[styles.timerText, { color: isDark ? "#A1A1AA" : "#777" }]}>
          Didn't receive an OTP?{" "}
          {timer > 0 ? (
            <Text>Resend in {timer}s</Text>
          ) : resendLoading ? (
            <Text style={[styles.resend, { color: isDark ? "#F472B6" : "#852BAF" }]}>Sending...</Text>
          ) : (
            <Text style={[styles.resend, { color: isDark ? "#F472B6" : "#852BAF" }]} onPress={handleResend}>
              Resend
            </Text>
          )}
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleVerify}
          disabled={loading}
        >
          <LinearGradient
            colors={["#FC8BAD", "#A654CD"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.verifyBtn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyText}>Verify</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default OTPScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  logoWrap: {
    alignItems: "center",
    marginTop: 20,
  },

  card: {
    flex: 1,
    marginTop: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#852BAF",
    marginBottom: 10,
  },

  subText: {
    fontSize: 13,
    color: "#555",
    textAlign: "center",
    marginBottom: 25,
  },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "92%",
    marginBottom: 20,
  },

  otpInput: {
    width: 45,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 18,
  },

  timerText: {
    fontSize: 12,
    color: "#777",
    marginBottom: 25,
  },

  resend: {
    fontWeight: "600",
  },

  verifyBtn: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    minWidth: 200,
  },

  verifyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

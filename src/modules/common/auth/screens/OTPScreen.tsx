<<<<<<< HEAD
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import Logo from "../../../../assets/homepage/login_logo.svg";
import GradientBackground from "../../components/GradientBackground";
import AuthButton from "../../components/AuthButton";
import OtpBoxRow from "../../components/OtpBoxRow";
import { useAlert } from "../../../ecommerce/components/alerts";
=======
import React, { useState, useEffect, useRef } from "react";
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
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
import { useAppTheme } from "../../../../theme/ThemeContext";
import { useOtpTimer } from "../hooks/useOtpTimer";
import { useOtpAutofill } from "../hooks/useOtpAutofill";
import { sendOtp, verifyOtp } from "../api/AuthAPI";
import {
  OTP_LENGTH,
  OTP_MAX_RESEND_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "../constants/otp";
import { maskEmail, maskPhone } from "../utils/validators";
import type { AuthStackParamList } from "../navigation/types";

<<<<<<< HEAD
type Nav = NativeStackNavigationProp<AuthStackParamList, "OTPScreen">;
type OTPScreenRouteProp = RouteProp<AuthStackParamList, "OTPScreen">;

function OTPScreen() {
  const navigation = useNavigation<Nav>();
=======
type OTPScreenRouteProp = RouteProp<AuthStackParamList, "LoginOTP">;

function OTPScreen() {
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
  const route = useRoute<OTPScreenRouteProp>();
  const alert = useAlert();
  const { verifyLoginOtp, requestLoginOtp } = useAuth();
  const { isDark } = useAppTheme();
  const { authenticateWithTokens } = useAuth();

<<<<<<< HEAD
  const { method, destination, maskedDestination } = route.params;
  const displayDestination =
    maskedDestination || (method === "phone" ? maskPhone(destination) : maskEmail(destination));

  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  const { secondsLeft, canResend, reset: resetTimer } = useOtpTimer(OTP_RESEND_COOLDOWN_SECONDS);
  const autofill = useOtpAutofill(true);

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // SMS autofill (Android) delivered a code — feed it into the boxes the
  // same way manual entry would, which triggers OtpBoxRow's onComplete.
  useEffect(() => {
    if (autofill.code) {
      const digits = autofill.code.slice(0, OTP_LENGTH).split("");
      setOtpValues(Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] ?? ""));
    }
  }, [autofill.code]);
=======
  const identifier = route.params?.identifier || "";

  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(true);
  const otpRefs = useRef<Array<TextInput | null>>([null, null, null, null]);
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28

  useEffect(() => {
    if (autofill.error) {
      alert.warning("Autofill", autofill.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autofill.error]);

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeX]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (verifying) return;

      try {
        setVerifying(true);
        setHasError(false);

<<<<<<< HEAD
        const result = await verifyOtp(destination, code);
        await authenticateWithTokens(result);
      } catch (error: any) {
        if (__DEV__) console.log("[OTPScreen] verify failed", { method, destination, error });
        setHasError(true);
        triggerShake();
        setOtpValues(Array(OTP_LENGTH).fill(""));
=======
    if (text && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28

        const status = error?.response?.status;
        if (!error?.response) {
          alert.error("Network Error", "Please check your connection and try again.");
        } else if (status === 429) {
          alert.warning("Too Many Attempts", "You've made too many attempts. Please wait and try again.");
        } else {
          // 401 covers no-OTP-found / expired / invalid alike — the
          // backend's message text already distinguishes them.
          alert.error(
            "Verification Failed",
            error?.response?.data?.message || "Invalid OTP. Please try again.",
          );
        }
      } finally {
        setVerifying(false);
      }
    },
    [verifying, method, destination, navigation, alert, triggerShake],
  );

<<<<<<< HEAD
  const handleResend = useCallback(async () => {
    if (!canResend || resending) return;

    if (resendCount >= OTP_MAX_RESEND_ATTEMPTS) {
      alert.warning("Resend Limit Reached", "You've reached the maximum number of resend attempts.");
=======
  const handleVerify = async () => {
    const otp = otpValues.join("");
    if (otp.length !== 6) {
      alert.error("Validation", "Please enter all 6 digits of the login code");
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
      return;
    }

    try {
<<<<<<< HEAD
      setResending(true);
      await sendOtp(destination);
      setResendCount((prev) => prev + 1);
      resetTimer();
      setOtpValues(Array(OTP_LENGTH).fill(""));
      setHasError(false);
      alert.success("Code Sent", `A new OTP has been sent to ${displayDestination}.`);
    } catch (error: any) {
      if (__DEV__) console.log("[OTPScreen] resend failed", { method, destination, error });
      const status = error?.response?.status;
      if (status === 429) {
        alert.warning("Resend Limit Reached", "Please wait before requesting another OTP.");
      } else if (!error?.response) {
        alert.error("Network Error", "Please check your connection and try again.");
      } else {
        alert.error("Couldn't Resend", error?.response?.data?.message || "Please try again.");
      }
=======
      setLoading(true);

      await verifyLoginOtp(identifier, otp);
    } catch (error: any) {
      alert.error(
        "Verification Failed",
        error?.response?.data?.message || "Invalid OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown || resendLoading) return;

    try {
      setResendLoading(true);

      await requestLoginOtp(identifier);

      alert.info("Resent", "A new login code was sent to your registered contact");
      setTimer(60);
      setResendCooldown(true);
      setOtpValues(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (error: any) {
      alert.error(
        "Resend Failed",
        error?.response?.data?.message || "Failed to resend OTP"
      );
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
    } finally {
      setResending(false);
    }
  }, [canResend, resending, resendCount, method, destination, resetTimer, alert, displayDestination]);

  return (
<<<<<<< HEAD
    <GradientBackground>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Logo width={110} height={110} />
=======
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? "#09090B" : "#F5F0FF" }]}>
      <View style={styles.logoWrap}>
        <Logo width={160} height={160} />
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? "#111113" : "#FFFFFF" }]}>
        <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#852BAF" }]}>
          Login Verification
        </Text>

        <Text style={[styles.subText, { color: isDark ? "#D4D4D8" : "#555" }]}>
          Enter the 6-digit code sent to {identifier || "your registered contact"}
        </Text>

        <View style={styles.otpRow}>
          {[0, 1, 2, 3, 4, 5].map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                otpRefs.current[i] = ref;
              }}
              maxLength={1}
              keyboardType="number-pad"
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
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
        </View>

        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#852BAF" }]}>
            Verify {method === "phone" ? "Mobile Number" : "Email"}
          </Text>
          <View style={styles.destinationRow}>
            <Text style={[styles.subText, { color: isDark ? "#D4D4D8" : "#555" }]}>
              Code sent to {displayDestination}
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.editLink, { color: isDark ? "#F472B6" : "#852BAF" }]}> Edit</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.otpWrap, shakeStyle]}>
          <OtpBoxRow
            length={OTP_LENGTH}
            value={otpValues}
            onChange={setOtpValues}
            onComplete={handleVerify}
            disabled={verifying}
            error={hasError}
          />
        </Animated.View>

        {verifying && (
          <View style={styles.verifyingRow}>
            <ActivityIndicator size="small" color={isDark ? "#A1A1AA" : "#852BAF"} />
            <Text style={[styles.verifyingText, { color: isDark ? "#A1A1AA" : "#852BAF" }]}>
              Verifying...
            </Text>
          </View>
        )}

        <Text style={[styles.timerText, { color: isDark ? "#A1A1AA" : "#777" }]}>
          Didn't receive a code?{" "}
          {!canResend ? (
            <Text>Resend in {secondsLeft}s</Text>
          ) : resending ? (
            <Text style={[styles.resend, { color: isDark ? "#F472B6" : "#852BAF" }]}>Sending...</Text>
          ) : (
            <Text
              style={[styles.resend, { color: isDark ? "#F472B6" : "#852BAF" }]}
              onPress={handleResend}
            >
              Resend
            </Text>
          )}
        </Text>

        <AuthButton
          label="Verify"
          onPress={() => handleVerify(otpValues.join(""))}
          loading={verifying}
          disabled={otpValues.join("").length !== OTP_LENGTH}
        />
      </View>
    </GradientBackground>
  );
}

export default React.memo(OTPScreen);

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  destinationRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  subText: {
    fontSize: 13,
    textAlign: "center",
  },
  editLink: {
    fontSize: 13,
    fontWeight: "700",
  },
  otpWrap: {
    marginBottom: 16,
  },
  verifyingRow: {
    flexDirection: "row",
<<<<<<< HEAD
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
=======
    justifyContent: "space-between",
    width: "92%",
    marginBottom: 20,
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
  },
  verifyingText: {
    fontSize: 12,
    marginLeft: 6,
  },
  timerText: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
  },
  resend: {
    fontWeight: "600",
  },
});

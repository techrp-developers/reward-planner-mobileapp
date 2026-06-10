import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Logo from "../../../../assets/homepage/login_logo.svg";
import { activateAccount, verifyActivationOtp } from "../../../ecommerce/api/AuthAPI";
import { useAlert } from "../../../ecommerce/components/alerts";

type AuthModalStackParamList = {
  Login: undefined;
  AccountActivate: undefined;
  OTPScreen: { email: string };
  SetNewPassword: { email: string };
  AccountActivationSuccess: undefined;
  VerifyEmail: { email: string };
};

type OTPScreenNavigationProp = NativeStackNavigationProp<AuthModalStackParamList>;
type OTPScreenRouteProp = RouteProp<AuthModalStackParamList, "OTPScreen">;

function OTPScreen() {
  const navigation = useNavigation<OTPScreenNavigationProp>();
  const route = useRoute<OTPScreenRouteProp>();
  const alert = useAlert();
  const email = route.params?.email || "";

  const [otpValues, setOtpValues] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const otpRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

  // Countdown logic
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
    const newOtp = [...otpValues];
    newOtp[index] = text;
    setOtpValues(newOtp);

    // Auto-focus next input
    if (text && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (
    e: any,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = otpValues.join("");
    if (otp.length !== 4) {
      alert.error("Validation", "Please enter all 4 digits of OTP");
      return;
    }

    try {
      setLoading(true);
      await verifyActivationOtp({ email, otp });
      alert.success("Verified", "OTP verified successfully");
      // Navigate to SetNewPassword
      navigation.navigate("SetNewPassword", { email });
    } catch (error: any) {
      console.log("OTP verification error:", error?.response?.data || error?.message);
      alert.error(
        "Verification Failed",
        error?.response?.data?.message || "Invalid OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown) return;

    try {
      await activateAccount({ email });
      alert.info("Resent", "New OTP sent to your email");
      setTimer(60);
      setResendCooldown(true);
      setOtpValues(["", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (error: any) {
      alert.error(
        "Resend Failed",
        error?.response?.data?.message || "Failed to resend OTP"
      );
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.logoWrap}>
        <Logo width={160} height={160} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Email OTP Verification</Text>

        <Text style={styles.subText}>
          Enter the OTP sent to {email || "your email"}
        </Text>

        {/* OTP Inputs */}
        <View style={styles.otpRow}>
          {[0, 1, 2, 3].map((_, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                otpRefs.current[i] = ref;
              }}
              maxLength={1}
              keyboardType="number-pad"
              style={styles.otpInput}
              value={otpValues[i]}
              onChangeText={(text) => handleOtpChange(text, i)}
              onKeyPress={(e) => handleOtpKeyPress(e, i)}
            />
          ))}
        </View>

        {/* Timer */}
        <Text style={styles.timerText}>
          Didn’t receive an OTP?{" "}
          {timer > 0 ? (
            <Text>Resend in {timer} seconds</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resendCooldown}>
              <Text style={styles.resend}>Resend</Text>
            </TouchableOpacity>
          )}
        </Text>

        {/* Verify Button */}
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
            <Text style={styles.verifyText}>
              {loading ? "Verifying..." : "Verify"}
            </Text>
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
    backgroundColor: "#F5F0FF",
  },

  logoWrap: {
    alignItems: "center",
    marginTop: 20,
  },

  card: {
    flex: 1,
    marginTop: 20,
    backgroundColor: "#FFFFFF",
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
    width: "70%",
    marginBottom: 20,
  },

  otpInput: {
    width: 45,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    textAlign: "center",
    fontSize: 18,
    backgroundColor: "#F9F9F9",
  },

  timerText: {
    fontSize: 12,
    color: "#777",
    marginBottom: 25,
  },

  resend: {
    color: "#852BAF",
    fontWeight: "600",
  },

  verifyBtn: {
    width: "70%",
    paddingVertical: 14,
        paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  verifyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
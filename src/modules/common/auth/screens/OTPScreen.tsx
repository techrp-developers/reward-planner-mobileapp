import { useTranslation } from 'react-i18next';
import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import type { AuthStackParamList } from "../navigation/types";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { AuthButton, AuthLayout, authStyles } from "../../components/AuthLayout";
import { OTP_LENGTH, OTP_RESEND_COOLDOWN_SECONDS } from "../constants/otp";
import { useOtpTimer } from "../hooks/useOtpTimer";
import { authErrorMessage, emptyOtp, isUserInactiveError, rateLimitDelay, updateOtpDigits } from "../utils/otpInput";
import { useAlert } from "../../../ecommerce/components/alerts";

type Props = NativeStackScreenProps<AuthStackParamList, "LoginOTP">;

export default function OTPScreen({ route, navigation }: Props) {
  const { t: authText } = useTranslation('auth');
  const { verifyLoginOtp, requestLoginOtp } = useAuth();
  const { theme, isDark } = useAppTheme();
  const alert = useAlert();
  const { identifier, resendAvailableAt } = route.params;
  const isPhone = !identifier.includes("@");
  const destination = isPhone ? `+91 ${identifier.slice(0, 5)} ${identifier.slice(5)}` : identifier;
  const [digits, setDigits] = useState(emptyOtp);
  const digitsRef = useRef(digits);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inFlight = useRef(false);
  const verified = useRef(false);
  const lastAutoCode = useRef<string | null>(null);
  const mounted = useRef(true);
  const cooldown = useOtpTimer(OTP_RESEND_COOLDOWN_SECONDS, resendAvailableAt);
  const rateLimit = useOtpTimer(0);

  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => inputs.current[0]?.focus(), 250);
    return () => { mounted.current = false; clearTimeout(timer); };
  }, []);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !verifying && !resending });
    const back = BackHandler.addEventListener("hardwareBackPress", () => inFlight.current);
    return () => back.remove();
  }, [navigation, verifying, resending]);

  const applyDigits = (next: string[]) => {
    digitsRef.current = next;
    setDigits(next);
  };

  const verify = async (code: string, automatic: boolean) => {
    if (inFlight.current || verified.current || !rateLimit.canResend || code.length !== OTP_LENGTH) return;
    if (automatic && lastAutoCode.current === code) return;
    lastAutoCode.current = code;
    inFlight.current = true;
    setVerifying(true);
    setError("");
    setNotice("");
    try {
      await verifyLoginOtp(identifier, code);
      verified.current = true;
    } catch (failure) {
      if (!mounted.current) return;
      if (isUserInactiveError(failure)) {
        alert.error(authText('auth:inactiveTitle'), authErrorMessage(failure, authText('auth:inactive')));
        return;
      }
      const retryAfter = rateLimitDelay(failure);
      if (retryAfter) {
        rateLimit.reset(retryAfter);
        cooldown.reset(Math.max(retryAfter, cooldown.secondsLeft));
      }
      setError(authErrorMessage(failure, authText('auth:verifyFailed')));
      inputs.current[0]?.focus();
    } finally {
      inFlight.current = false;
      if (mounted.current) setVerifying(false);
    }
  };

  const onDigitChange = (text: string, index: number) => {
    if (inFlight.current || verified.current) return;
    const next = updateOtpDigits(digitsRef.current, text, index);
    const code = next.digits.join("");
    if (code !== digitsRef.current.join("")) {
      lastAutoCode.current = null;
      setError("");
      setNotice("");
    }
    applyDigits(next.digits);
    if (text.replace(/\D/g, "")) inputs.current[next.focusIndex]?.focus();
    if (next.digits.every(digit => /^\d$/.test(digit))) void verify(code, true);
  };

  const resend = async () => {
    if (inFlight.current || verified.current || !cooldown.canResend || !rateLimit.canResend) return;
    inFlight.current = true;
    setResending(true);
    setError("");
    setNotice("");
    try {
      await requestLoginOtp(identifier);
      if (!mounted.current) return;
      cooldown.reset();
      lastAutoCode.current = null;
      applyDigits(emptyOtp());
      setNotice(isPhone ? authText('auth:newCodeWhatsapp') : authText('auth:newCodeEmail'));
    } catch (failure) {
      if (!mounted.current) return;
      if (isUserInactiveError(failure)) {
        alert.error(authText('auth:inactiveTitle'), authErrorMessage(failure, authText('auth:inactive')));
        return;
      }
      const retryAfter = rateLimitDelay(failure);
      if (retryAfter) {
        cooldown.reset(retryAfter);
        rateLimit.reset(retryAfter);
      }
      setError(authErrorMessage(failure, authText('auth:resendFailed')));
    } finally {
      inFlight.current = false;
      if (mounted.current) {
        setResending(false);
        setTimeout(() => { if (mounted.current) inputs.current[0]?.focus(); }, 100);
      }
    }
  };

  const changeDestination = () => {
    if (inFlight.current || verified.current) return;
    navigation.goBack();
  };
  const busy = verifying || resending;
  const complete = digits.every(digit => /^\d$/.test(digit));

  return (
    <AuthLayout onBack={busy ? undefined : changeDestination}>
      <Text style={[authStyles.title, { color: theme.text }]}>{isPhone ? authText('auth:verifyMobile') : authText('auth:verifyEmail')}</Text>
      <Text style={[styles.caption, { color: theme.secondaryText }]}>{isPhone ? authText('auth:whatsappCode') : authText('auth:emailCode')}</Text>
      <Text style={[styles.destination, { color: theme.text }]}>{destination}</Text>
      <Text style={[styles.caption, { color: theme.secondaryText }]}>{authText('auth:enterCode', { length: OTP_LENGTH })}</Text>
      <View style={styles.otpRow}>
        {digits.map((digit, index) => <TextInput
          key={index}
          ref={ref => { inputs.current[index] = ref; }}
          testID={`otp-digit-${index}`}
          accessibilityLabel={authText('auth:codeDigit', { position: index + 1, length: OTP_LENGTH })}
          value={digit} keyboardType="number-pad" inputMode="numeric"
          // Allow a full pasted code in any field; updateOtpDigits distributes it.
          selectTextOnFocus selection={{ start: 0, end: digit.length }}
          textContentType={Platform.OS === "ios" ? "oneTimeCode" : "none"}
          autoComplete={Platform.OS === "ios" ? "one-time-code" : "sms-otp"}
          importantForAutofill="yes"
          autoCorrect={false} editable={!busy}
          onFocus={() => setFocusedIndex(index)}
          onChangeText={text => onDigitChange(text, index)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Backspace" && !digitsRef.current[index] && index > 0 && !inFlight.current) {
              const next = [...digitsRef.current];
              next[index - 1] = "";
              lastAutoCode.current = null;
              applyDigits(next);
              setError("");
              inputs.current[index - 1]?.focus();
            }
          }}
          style={[styles.otpInput, {
            color: theme.text, backgroundColor: theme.card,
            borderColor: error ? (isDark ? "#FDA4AF" : "#C62842") : focusedIndex === index ? theme.primary : theme.border,
          }]}
        />)}
      </View>
      {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[authStyles.error, isDark && styles.darkError]}>{error}</Text>}
      {!!notice && <Text accessibilityLiveRegion="polite" style={[styles.notice, { color: theme.secondaryText }]}>{notice}</Text>}
      <AuthButton title={verifying ? authText('auth:verifying') : authText('auth:verify')} onPress={() => { void verify(digitsRef.current.join(""), false); }}
        busy={verifying} disabled={!complete || resending || !rateLimit.canResend} />
      <Text style={[styles.autoHint, { color: theme.secondaryText }]}>{rateLimit.secondsLeft > 0 ? authText('auth:retryIn', { count: rateLimit.secondsLeft }) : authText('auth:verifyAutomatic')}</Text>
      <TouchableOpacity accessibilityRole="button" disabled={busy || !cooldown.canResend || !rateLimit.canResend}
        onPress={() => { void resend(); }}>
        <Text style={[authStyles.link, { color: busy || !cooldown.canResend ? theme.secondaryText : theme.primary }]}>
          {resending ? authText('auth:sending') : cooldown.secondsLeft > 0 ? authText('auth:resendIn', { count: cooldown.secondsLeft }) : authText('auth:resendOtp')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={changeDestination} disabled={busy}>
        <Text style={[authStyles.link, { color: theme.primary, opacity: busy ? 0.5 : 1 }]}>{isPhone ? authText('auth:changeMobile') : authText('auth:changeEmail')}</Text>
      </TouchableOpacity>
      <Text style={[styles.help, { color: theme.secondaryText }]}>{authText(isPhone ? 'auth:otpHelpPhone' : 'auth:otpHelpEmail')}</Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  caption: { fontSize: 14, lineHeight: 21 },
  destination: { fontSize: 17, fontWeight: "600", marginTop: 8, marginBottom: 20 },
  otpRow: { flexDirection: "row", gap: 7, marginTop: 18, marginBottom: 20 },
  otpInput: { flex: 1, minWidth: 0, height: 54, borderRadius: 11, borderWidth: 1.5, fontSize: 23, fontWeight: "600", textAlign: "center", paddingHorizontal: 0, paddingVertical: 8 },
  autoHint: { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 12, marginBottom: 10 },
  notice: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  help: { fontSize: 12, lineHeight: 19, textAlign: "center", marginTop: 8 },
  darkError: { color: "#FDA4AF" },
});
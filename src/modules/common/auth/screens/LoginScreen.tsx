import { useTranslation } from 'react-i18next';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../context/AuthContext";
import type { AuthStackParamList } from "../navigation/types";
import { normalizeIndianMobile, parseLoginIdentifier } from "../utils/loginIdentifier";
import { authErrorMessage, isUserInactiveError, rateLimitDelay } from "../utils/otpInput";
import { useAlert } from "../../../ecommerce/components/alerts";
import { useAppTheme } from "../../../../theme/ThemeContext";
import { AuthButton, AuthLayout, authStyles } from "../../components/AuthLayout";
import { AuthPressable } from "../../components/AuthMotion";
import { requestPhoneNumberHint as getPhoneNumberHint } from "../services/phoneNumberHint";
import { useOtpTimer } from "../hooks/useOtpTimer";
import { OTP_RESEND_COOLDOWN_SECONDS } from "../constants/otp";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;
type Method = "phone" | "email";

export default function LoginScreen({ navigation }: Props) {
  const { t: authText } = useTranslation(['auth', 'common']);
  const { requestLoginOtp } = useAuth();
  const { theme, isDark } = useAppTheme();
  const alert = useAlert();
  const [method, setMethod] = useState<Method | null>(null);
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const input = useRef<TextInput>(null);
  const sendingRef = useRef(false);
  const hintGeneration = useRef(0);
  const lastSent = useRef<{ identifier: string; deadline: number } | null>(null);
  const limiter = useOtpTimer(0);

  useEffect(() => () => { hintGeneration.current += 1; }, []);

  const backToMethods = useCallback(() => {
    if (sendingRef.current) return;
    hintGeneration.current += 1;
    setHintLoading(false);
    setMethod(null);
    setError("");
  }, []);

  useFocusEffect(useCallback(() => {
    if (!method) return;
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      backToMethods();
      return true;
    });
    return () => listener.remove();
  }, [method, backToMethods]));

  useEffect(() => {
    if (!method || hintLoading) return;
    const timeout = setTimeout(() => input.current?.focus(), 180);
    return () => clearTimeout(timeout);
  }, [method, hintLoading]);

  const chooseMethod = async (nextMethod: Method) => {
    setMethod(nextMethod);
    setError("");
    if (nextMethod !== "phone" || Platform.OS !== "android") return;
    const generation = ++hintGeneration.current;
    setHintLoading(true);
    const hint = await getPhoneNumberHint().catch(() => null);
    if (generation !== hintGeneration.current) return;
    const normalized = hint ? normalizeIndianMobile(hint) : null;
    if (normalized) setMobile(normalized);
    setHintLoading(false);
  };

  const onContinue = async () => {
    if (sendingRef.current || !limiter.canResend || hintLoading) return;
    const parsed = parseLoginIdentifier(method === "phone" ? mobile : email);
    if (parsed.kind !== method || (parsed.kind !== "phone" && parsed.kind !== "email")) {
      setError(method === "phone" ? authText('auth:invalidMobile') : authText('auth:invalidEmail'));
      return;
    }
    setError("");
    // Returning to edit the destination must not resend the same code early.
    if (lastSent.current?.identifier === parsed.normalized && lastSent.current.deadline > Date.now()) {
      navigation.navigate("LoginOTP", { identifier: parsed.normalized, resendAvailableAt: lastSent.current.deadline });
      return;
    }
    sendingRef.current = true;
    setSending(true);
    try {
      await requestLoginOtp(parsed.normalized);
      const deadline = Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000;
      lastSent.current = { identifier: parsed.normalized, deadline };
      navigation.navigate("LoginOTP", { identifier: parsed.normalized, resendAvailableAt: deadline });
    } catch (failure) {
      if (isUserInactiveError(failure)) {
        alert.error(authText('auth:inactiveTitle'), authErrorMessage(failure, authText('auth:inactive')));
        return;
      }
      const retryAfter = rateLimitDelay(failure);
      if (retryAfter) limiter.reset(retryAfter);
      setError(authErrorMessage(failure, authText('auth:sendFailed')));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <AuthLayout welcome={!method} onBack={method && !sending ? backToMethods : undefined}>
      {!method ? <>
        <Text style={[authStyles.title, { color: theme.text }]}>{authText('auth:welcome')}</Text>
        <Text style={[authStyles.description, { color: theme.secondaryText }]}>{authText('auth:benefits')}</Text>
        <AuthButton animatePress title={authText('auth:continueMobile')} onPress={() => { void chooseMethod("phone"); }} />
        <AuthPressable onPress={() => { void chooseMethod("email"); }} accessibilityRole="button" accessibilityLabel={authText('common:continueEmail')} style={[styles.emailButton, { borderColor: theme.border }]}>
          <MaterialCommunityIcons name="email-outline" size={21} color={theme.text} />
          <Text style={[styles.emailButtonText, { color: theme.text }]}>{authText('common:continueEmail')}</Text>
        </AuthPressable>
        <Text style={[styles.hint, { color: theme.secondaryText }]}>{authText('auth:signInSecurely')}</Text>
      </> : <>
        <Text style={[authStyles.title, { color: theme.text }]}>{method === "phone" ? authText('common:mobileNumber') : authText('auth:emailTitle')}</Text>
        <Text style={[authStyles.description, { color: theme.secondaryText }]}>
          {method === "phone" ? authText('auth:registeredMobile') : authText('auth:registeredEmail')}
        </Text>
        <Text style={[authStyles.label, { color: theme.text }]}>{method === "phone" ? authText('auth:mobileLabel') : authText('auth:emailLabel')}</Text>
        <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: error ? "#C62842" : theme.border }]}>
          {method === "phone" && <Text style={[styles.prefix, { color: theme.text }]}>+91</Text>}
          <TextInput key={method} ref={input} value={method === "phone" ? mobile : email}
            onChangeText={value => {
              setError("");
              if (method === "phone") setMobile(normalizeIndianMobile(value) || value);
              else setEmail(value);
            }}
            accessibilityLabel={method === "phone" ? authText('auth:mobileLabel') : authText('auth:emailLabel')}
            placeholder={method === "phone" ? "98765 43210" : "you@company.com"}
            placeholderTextColor={theme.secondaryText} keyboardType={method === "phone" ? "phone-pad" : "email-address"}
            textContentType={method === "phone" ? "telephoneNumber" : "emailAddress"}
            autoComplete={method === "phone" ? "tel-national" : "email"}
            importantForAutofill="yes"
            autoCorrect={false} autoCapitalize="none" editable={!sending && !hintLoading}
            returnKeyType="done" onSubmitEditing={() => { void onContinue(); }}
            style={[styles.input, { color: theme.text }]} />
        </View>
        {hintLoading && <Text style={[styles.hint, { color: theme.secondaryText }]}>{authText('auth:chooseNumber')}</Text>}
        {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[authStyles.error, isDark && styles.darkError]}>{error}</Text>}
        <AuthButton title={sending ? authText('auth:sending') : limiter.secondsLeft > 0 ? authText('auth:retryIn', { count: limiter.secondsLeft }) : authText('common:continue')}
          onPress={() => { void onContinue(); }} busy={sending} disabled={hintLoading || !limiter.canResend} />
        <Text style={[styles.hint, { color: theme.secondaryText }]}>{authText('auth:employerContact')}</Text>
      </>}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  emailButton: { flexDirection: "row", gap: 10, minHeight: 54, borderWidth: 1, borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 14, padding: 12 },
  emailButtonText: { flexShrink: 1, textAlign: "center", fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 18, marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, minHeight: 56, marginBottom: 20 },
  prefix: { fontSize: 17, fontWeight: "600", marginRight: 12 },
  input: { flex: 1, minWidth: 0, fontSize: 17, paddingVertical: 15 },
  darkError: { color: "#FDA4AF" },
});

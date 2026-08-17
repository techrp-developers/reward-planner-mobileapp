import React, { useCallback, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
<<<<<<< HEAD

import SplashScreen from "../../../../assets/sampleImages/final splash screen.png";
import AuthButton from "../../components/AuthButton";
import AuthTextInput from "../../components/AuthTextInput";
=======
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../../../ecommerce/components/alerts";
import Logo from "../../../../assets/homepage/login_logo.svg";
import type { AuthStackParamList } from "../navigation/types";
import {
  getLoginIdentifierKeyboardType,
  parseLoginIdentifier,
} from "../utils/loginIdentifier";
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
import { useAppTheme } from "../../../../theme/ThemeContext";
import { useAlert } from "../../../ecommerce/components/alerts";
import { checkIdentifier, sendOtp } from "../api/AuthAPI";
import { parseIdentifier } from "../utils/validators";
import type { AuthStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

<<<<<<< HEAD
function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { isDark } = useAppTheme();
  const alert = useAlert();

  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
=======
export default function LoginScreen({ navigation }: Props) {
  const { requestLoginOtp, loading } = useAuth();
  const { isDark } = useAppTheme();
  const alert = useAlert();
  const [identifier, setIdentifier] = useState("");
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28

  const handleLogin = useCallback(async () => {
    const parsed = parseIdentifier(identifier);

<<<<<<< HEAD
    if (parsed.kind === "unknown") {
      setError("Enter a valid email address or 10-digit mobile number.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const checkResult = await checkIdentifier(parsed.normalized);

      if (!checkResult.registered) {
        alert.warning("Not Registered", "We couldn't find an account for this email or phone number.");
        return;
      }

      await sendOtp(parsed.normalized);

      navigation.navigate("OTPScreen", {
        method: checkResult.type ?? parsed.kind,
        destination: parsed.normalized,
      });
    } catch (err: any) {
      if (__DEV__) console.log("[LoginScreen] login failed", { identifier: parsed.normalized, err });

      const status = err?.response?.status;
      if (status === 404) {
        alert.warning("Not Registered", "We couldn't find an account for this email or phone number.");
      } else if (!err?.response) {
        alert.error("Network Error", "Please check your connection and try again.");
      } else {
        alert.error(
          "Couldn't Send Code",
          err?.response?.data?.message || "Something went wrong. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }, [identifier, alert, navigation]);
=======
      if (parsedIdentifier.kind === "empty") {
        alert.error("Login Error", "Please enter your email address or phone number");
        return;
      }

      if (parsedIdentifier.kind === "invalid") {
        alert.error("Login Error", "Enter a valid email address or 10-digit phone number");
        return;
      }

      await requestLoginOtp(parsedIdentifier.normalized);
      navigation.navigate("LoginOTP", { identifier: parsedIdentifier.normalized });
    } catch (error: any) {
      const data = error?.response?.data;

      const message = data?.message || "Unable to send the login code";

      alert.error("Login Error", String(message));
    }
  }, [identifier, requestLoginOtp, navigation, alert]);
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? "#09090B" : "#F5F0FF" }]}>
      <Image source={SplashScreen} style={styles.bgImage} resizeMode="cover" />

      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: isDark ? "#18181B" : "#FFFFFF" }]}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons name="chevron-left" size={22} color={isDark ? "#FFFFFF" : "#1F2937"} />
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: isDark ? "#09090B" : "#FFFFFF" }]}>
        <Text style={styles.title}>
          <Text style={styles.titlePurple}>Reward </Text>
          <Text style={styles.titlePink}>Planners</Text>
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? "#A1A1AA" : "#6B7280" }]}>
          Login to your account
        </Text>

        <View style={styles.inputSpacing}>
          <AuthTextInput
            icon="account-outline"
            placeholder="Email Address/Phone Number"
            value={identifier}
            onChangeText={(value) => {
              setIdentifier(value);
              if (error) setError(null);
            }}
            keyboardType="email-address"
            error={error ?? undefined}
            autoFocus
          />
        </View>

<<<<<<< HEAD
        <AuthButton
          label="Log in"
          onPress={handleLogin}
          loading={submitting}
          disabled={!identifier.trim()}
        />
      </View>
    </View>
=======
                  <TextInput
                    placeholder="Email Address or Phone Number"
                    placeholderTextColor={isDark ? "#71717A" : "#999"}
                    autoCapitalize="none"
                    keyboardType={getLoginIdentifierKeyboardType(identifier)}
                    style={[styles.input, { color: isDark ? "#FFFFFF" : "#333" }]}
                    value={identifier}
                    onChangeText={setIdentifier}
                  />
                </View>

                <Text style={[styles.helperText, { color: isDark ? "#A1A1AA" : "#777" }]}>
                  Registered email or mobile number
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#FC8BAD", "#A654CD"]}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 0, y: 0 }}
                  style={styles.loginBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginText}>Send Login Code</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>

        </KeyboardAvoidingView>
      </SafeAreaView>
>>>>>>> 6e32a67f0be08c611df537476ffc8985ed3f0e28
  );
}

export default React.memo(LoginScreen);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  bgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "42%",
    opacity: 0.18,
  },
  backButton: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 2,
  },
  card: {
    flex: 1,
    marginTop: "38%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  titlePurple: {
    color: "#7B2CBF",
  },
  titlePink: {
    color: "#EC4899",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  inputSpacing: {
    width: "100%",
    marginBottom: 20,
  },
});

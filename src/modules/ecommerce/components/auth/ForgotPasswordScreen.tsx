import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Logo from "../../../../assets/homepage/login_logo.svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "./navigation/types";

type ForgotPasswordNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "ForgotPassword"
>;

function ForgotPassword() {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
      <View style={styles.logoWrap}>
        <Logo width={160} height={160} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Forgot Password</Text>

        <Text style={styles.subText}>
          Enter the email address associated with your account,
          and we’ll send password reset instructions.
        </Text>

        <View style={styles.inputWrap}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            style={styles.input}
          />
        </View>

        {/* Gradient Button */}
        <TouchableOpacity activeOpacity={0.85}>
          <LinearGradient
            colors={["#FC8BAD", "#A654CD"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.loginBtn}
          >
            <Text style={styles.loginText}>Send Reset Link</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomWrap}>
        <Text style={styles.bottomText}>
          Return to Login Screen -{" "}
          <Text onPress={() => navigation.navigate("LoginAccount")} style={styles.signUp}>Login</Text>
        </Text>
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default ForgotPassword;
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#D4D4D5",
  },

  keyboardWrap: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  logoWrap: {
    alignItems: "center",
    marginTop: 24,
  },

  card: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#852BAF",
    marginBottom: 15,
  },

  subText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 20,
    lineHeight: 18,
  },

  inputWrap: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "#F9F9F9",
  },

  input: {
    fontSize: 14,
    color: "#333",
  },

  loginBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  loginText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  bottomWrap: {
    backgroundColor: "#F2E8FF",
    paddingVertical: 18,
    alignItems: "center",
    paddingHorizontal: 20,
  },

  bottomText: {
    fontSize: 13,
    color: "#555",
  },

  signUp: {
    color: "#852BAF",
    fontWeight: "700",
  },
});
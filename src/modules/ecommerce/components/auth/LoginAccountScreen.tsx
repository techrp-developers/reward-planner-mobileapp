import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

import Logo from "../../../../assets/homepage/login_logo.svg";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "./navigation/types";
import { login } from "../../api/AuthAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LoginAccountNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "LoginAccount"
>;

function LoginAccount() {
  const navigation = useNavigation<LoginAccountNavigationProp>();
  const insets = useSafeAreaInsets();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const goToMainTabs = () => {
    const rootNavigation = navigation.getParent() as any;
    rootNavigation?.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      await login({ email, password });
      setShowSuccessModal(true);
    } catch (error: any) {
      console.log("Login error:", error?.response?.data || error?.message);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  };

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
        <Logo width={180} height={180} />
      </View>

      <View style={styles.card}>

        <Text style={styles.title}>Login to Your Account</Text>

        {/* Email Input */}
        <View style={styles.inputWrap}>
          <MaterialCommunityIcons
            name="email-outline"
            size={18}
            color="#999"
            style={styles.inputIcon}
          />
          <TextInput
            placeholder="Email Address"
            placeholderTextColor="#999"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputWrap}>
          <MaterialCommunityIcons
            name="lock-outline"
            size={18}
            color="#999"
            style={styles.inputIcon}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry={!passwordVisible}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <MaterialCommunityIcons
              name={passwordVisible ? "eye-off-outline" : "eye-outline"}
              size={18}
              color="#A654CD"
            />
          </TouchableOpacity>
          
        </View>

        {/* Forgot Password */}
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity activeOpacity={0.85} onPress={handleLogin} disabled={loading}>
          <LinearGradient
            colors={["#FC8BAD", "#A654CD"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.loginBtn}
          >
            <Text style={styles.loginText}>{loading ? "Logging in..." : "Log in"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
        </ScrollView>
         <View style={[styles.bottomWrap, { paddingBottom: insets.bottom + 10 }]}> 
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Don’t have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("CreateAccount")}>
              <Text style={styles.signUp}>Sign Up</Text>
            </TouchableOpacity>
          </View>
      </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconWrap}>
              <MaterialCommunityIcons name="check" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Login Successful</Text>
            <Text style={styles.modalSubtext}>Welcome back! Reward Planners.</Text>

            <TouchableOpacity activeOpacity={0.9} onPress={goToMainTabs}>
              <LinearGradient
                colors={["#FC8BAD", "#A654CD"]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default LoginAccount;
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F0FF",
  },
  keyboardWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  logoWrap: {
    alignItems: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#852BAF",
    marginBottom: 20,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  forgotText: {
    fontSize: 13,
    color: "#852BAF",
    marginBottom: 20,
  },
  loginBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  loginText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
  bottomWrap: {
    backgroundColor: "#F5F0FF",
    paddingVertical: 14,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  bottomText: {
    fontSize: 13,
    color: "#666",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  signUp: {
    color: "#7B2CBF",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  successIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7B2CBF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalSubtext: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  modalButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
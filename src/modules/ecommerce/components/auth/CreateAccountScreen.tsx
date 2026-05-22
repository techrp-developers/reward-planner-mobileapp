import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Logo from "../../../../assets/homepage/login_logo.svg";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "./navigation/types";
import { register } from "../../api/AuthAPI";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CreateAccountNavigationProp = NativeStackNavigationProp<
    AuthStackParamList,
    "CreateAccount"
>;

function CreateAccount() {
    const insets = useSafeAreaInsets();
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const navigation = useNavigation<CreateAccountNavigationProp>();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [cpassword, setCpassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({
        visible: false,
        title: "",
        message: "",
        isSuccess: false,
    });

    const showNotification = (title: string, message: string, isSuccess: boolean) => {
        setNotification({
            visible: true,
            title,
            message,
            isSuccess,
        });
    };

    const handleRegister = async () => {
                if (!name || !email || !phone || !password || !cpassword) {
                        showNotification("Validation Error", "Please fill all fields.", false);
                        return;
                }

                if (password !== cpassword) {
                        showNotification("Validation Error", "Passwords do not match.", false);
                        return;
                }

                try {
                        setLoading(true);

                        await register({
                                name,
                                email,
                                phone,
                                password,
                                cpassword,
                        });

                            showNotification(
                                "Registration Successful",
                                "Your account has been created successfully.",
                                true
                            );
                } catch (error: any) {
                        console.log("Register error:", error?.response?.data || error?.message);
                            showNotification(
                                "Registration Failed",
                                error?.response?.data?.message || "Something went wrong. Please try again.",
                                false
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
                        <Text style={styles.title}>Create Your Account</Text>

                {/* Name */}
                <View style={styles.inputWrap}>
                    <TextInput
                        placeholder="Name"
                        placeholderTextColor="#999"
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {/* Email */}
                <View style={styles.inputWrap}>
                    <TextInput placeholder="Email ID"
                        placeholderTextColor="#999"
                        style={styles.input}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail} />
                </View>

                {/* Phone */}
                <View style={styles.inputWrap}>
                    <TextInput
                        placeholder="Phone Number"
                        placeholderTextColor="#999"
                        style={styles.input}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />
                </View>

                {/* Create Password */}
                <View style={styles.inputWrap}>
                    <TextInput
                        placeholder="Create Password"
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
                            size={20}
                            color="#A654CD"
                        />
                    </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputWrap}>
                    <TextInput
                        placeholder="Confirm Password"
                        placeholderTextColor="#999"
                        secureTextEntry={!confirmVisible}
                        style={styles.input}
                        value={cpassword}
                        onChangeText={setCpassword}
                    />
                    <TouchableOpacity
                        onPress={() => setConfirmVisible(!confirmVisible)}
                    >
                        <MaterialCommunityIcons
                            name={confirmVisible ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color="#A654CD"
                        />
                    </TouchableOpacity>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleRegister}
                    disabled={loading}
                >          <LinearGradient
                    colors={["#FC8BAD", "#A654CD"]}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 0 }}
                    style={styles.loginBtn}
                >
                        <Text style={styles.loginText}>{loading ? "Signing up..." : "Sign up"}</Text>
                    </LinearGradient>
                </TouchableOpacity>
                    </View>
                </ScrollView>

                <View style={[styles.bottomWrap, { paddingBottom: insets.bottom + 10 }]}> 
                    <View style={styles.bottomRow}>
                        <Text style={styles.bottomText}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate("LoginAccount")}>
                            <Text style={styles.signUp}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <Modal
                visible={notification.visible}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setNotification((prev) => ({ ...prev, visible: false }))
                }
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View
                            style={
                                notification.isSuccess
                                    ? styles.successIconWrap
                                    : styles.errorIconWrap
                            }
                        >
                            <MaterialCommunityIcons
                                name={notification.isSuccess ? "check" : "alert-circle-outline"}
                                size={24}
                                color="#FFFFFF"
                            />
                        </View>
                        <Text style={styles.modalTitle}>{notification.title}</Text>
                        <Text style={styles.modalSubtext}>{notification.message}</Text>

                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => {
                                setNotification((prev) => ({ ...prev, visible: false }));
                                if (notification.isSuccess) {
                                    navigation.navigate("LoginAccount");
                                }
                            }}
                        >
                            <LinearGradient
                                colors={
                                    notification.isSuccess
                                        ? ["#FC8BAD", "#A654CD"]
                                        : ["#F97316", "#EF4444"]
                                }
                                start={{ x: 1, y: 0 }}
                                end={{ x: 0, y: 0 }}
                                style={styles.modalButton}
                            >
                                <Text style={styles.modalButtonText}>
                                    {notification.isSuccess ? "Go to Login" : "Try Again"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

export default CreateAccount;

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
        marginTop: -40,
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
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 15,
        height: 48,
        backgroundColor: "#F9F9F9",
    },

    input: {
        flex: 1,
        fontSize: 14,
        color: "#333",
    },

    loginBtn: {
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },

    loginText: {
        color: "#FFFFFF",
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
        color: "#555",
    },

    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },

    signUp: {
        color: "#852BAF",
        fontWeight: "700",
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
    errorIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#EF4444",
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
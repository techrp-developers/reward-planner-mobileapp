import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import TrackLogin from "../../../../assets/homepage/tracklogin.svg";
import RewardLogin from "../../../../assets/homepage/Reward_login.svg";
import EligibleLogin from "../../../../assets/homepage/eligiblelogin.svg";
import TaxLogin from "../../../../assets/homepage/taxlogin.svg";
import LoginHead from "../../constants/heading/LoginHead";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "./navigation/types";
type LoginNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Login"
>;
function Login() {
  const navigation = useNavigation<LoginNavigationProp>();
      return (
        <SafeAreaView style={styles.safe} edges={["left", "right"]}>

            {/* Header */}
            <LoginHead />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Welcome Row */}
                <View style={styles.headerRow}>
                    <Text style={styles.welcomeText}>
                        Welcome to Rewardplanners
                    </Text>

                    <View style={styles.langRow}>
                        <Text style={{ fontSize: 16 }}>🇮🇳</Text>
                        <Text style={styles.langText}>EN</Text>
                    </View>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                    activeOpacity={0.85}
                     onPress={() => navigation.navigate("LoginAccount")}
>
                    <LinearGradient
                        colors={["#8665FF", "#5B47A3"]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.signBtn}
                    >
                        <Text style={styles.signText}>Sign In</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Features */}
                <View style={styles.featuresWrap}>
                    <FeatureItem
                        icon={<RewardLogin width={30} height={30} />}
                        text="Earn reward coins on eligible purchases"
                    />
                    <FeatureItem
                        icon={<EligibleLogin width={30} height={30} />}
                        text="Redeem coins instantly on services & products"
                    />
                    <FeatureItem
                        icon={<TrackLogin width={30} height={30} />}
                        text="Track every order and service in one place"
                    />
                    <FeatureItem
                        icon={<TaxLogin width={30} height={30} />}
                        text="Verified experts for documents, tax & insurance"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/* Feature Row Component */
const FeatureItem = ({
    icon,
    text,
}: {
    icon: React.ReactNode;
    text: string;
}) => (
    <View style={styles.featureRow}>
        <View style={styles.iconWrap}>{icon}</View>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

export default Login;
const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 40,
    },

    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    welcomeText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },

    langRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    langText: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: "500",
    },

    signBtn: {
        marginTop: 25,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },

    signText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },

    featuresWrap: {
        marginTop: 35,
    },

    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 28,
    },

    iconWrap: {
        width: 40,
        alignItems: "center",
    },

    featureText: {
        flex: 1,
        fontSize: 14,
        color: "#444",
        lineHeight: 20,
        marginLeft: 12,
    },
});
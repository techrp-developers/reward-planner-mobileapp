import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import {
  BORDER_RADIUS,
  COLORS,
  RESPONSIVE,
  SPACING,
  TYPOGRAPHY,
  fitnessCardStyle,
} from "../../utils/theme";

import StepCountBg from "../../assets/StepCount/Step_Count.svg";
import RunningIcon from "../../assets/StepCount/running 1.svg";
import { fetchProfileStepStatus } from "../../api/ProfileAPI";

type StepWelcomeNavProp = NativeStackNavigationProp<FitnessStackParamList, "StepWelcome">;

const StepWelcome = () => {
  const navigation = useNavigation<StepWelcomeNavProp>();
  const [checkingStatus, setCheckingStatus] = useState(true);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleNext = useCallback(() => navigation.navigate("StepsTrackerScreen"), [navigation]);

  useEffect(() => {
    let isMounted = true;

    const checkProfileStatus = async () => {
      try {
        const res = await fetchProfileStepStatus();

        if (!isMounted) return;

        if (res.success && res.is_completed) {
          navigation.replace("StepsTrackerScreen");
          return;
        }
      } catch (error) {
        console.warn("Step profile status check failed:", error);
      } finally {
        if (isMounted) {
          setCheckingStatus(false);
        }
      }
    };

    checkProfileStatus();

    return () => {
      isMounted = false;
    };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <StepCountBg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
      </View>

      <ScrollView contentContainerStyle={styles.centerWrapper} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={COLORS.gradientWelcome} style={styles.popupCard}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.78}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={RESPONSIVE.iconMedium}
              color={COLORS.textMedium}
            />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <RunningIcon width={110} height={110} />
          </View>

          <Text style={styles.eyebrow}>RP Move</Text>
          <Text style={styles.title}>Welcome to RP Move</Text>

          <Text style={styles.description}>
            Every step you take brings you closer to better health and more coins.
          </Text>

          <Text style={styles.tagline}>Walk. Earn. Redeem.</Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleNext}
            disabled={checkingStatus}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={checkingStatus ? ["#C7C7D1", "#AFAFBB"] : COLORS.gradientPurple}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {checkingStatus ? (
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <Text style={styles.buttonText}>Let's Get Moving</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};

export default React.memo(StepWelcome);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgVeryLight,
  },
  centerWrapper: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: RESPONSIVE.horizontalPadding,
    paddingVertical: SPACING.xxl,
  },
  popupCard: {
    ...fitnessCardStyle,
    alignItems: "center",
  },
  backBtn: {
    position: "absolute",
    top: SPACING.md,
    left: SPACING.md,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: "rgba(134,101,255,0.09)",
  },
  iconContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  eyebrow: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryPurple,
    textTransform: "uppercase",
    marginBottom: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMedium,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  tagline: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primaryIndigo,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  buttonWrapper: {
    width: "100%",
  },
  button: {
    height: RESPONSIVE.buttonHeight,
    borderRadius: BORDER_RADIUS.large,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textWhite,
  },
});

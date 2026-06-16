import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Modal from "react-native-modal";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import type { FitnessStackParamList } from "../../navigation/RewardHomeStack";
import {
  BORDER_RADIUS,
  COLORS,
  RESPONSIVE,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
  fitnessCardStyle,
} from "../../utils/theme";

import WeightLoss from "../../assets/StepCount/weaight_loss.svg";
import WeightGain from "../../assets/StepCount/weight_gain.svg";
import StayHealthy from "../../assets/StepCount/stey_healthy.svg";
import StepCountBg from "../../assets/StepCount/Step_Count.svg";
import {
  updateBasicProfile,
  updateBodyProfile,
  type GoalType,
} from "../../api/ProfileAPI";
import { useInvalidateFitnessQueries } from "../../api/useFitnessQueries";

type StepFormNavProp = NativeStackNavigationProp<FitnessStackParamList, "StepForm">;
type FieldKey = "gender" | "age" | "height" | "weight";

const genderList = ["Male", "Female", "Other"];
const ageList = Array.from({ length: 70 }, (_, i) => `${i + 10} Years`);
const heightList = ["4.5 ft", "4.8 ft", "5.0 ft", "5.2 ft", "5.4 ft", "5.6 ft", "5.8 ft", "6.0 ft", "6.2 ft"];
const weightList = Array.from({ length: 100 }, (_, i) => `${30 + i} kg`);

const goals = [
  { id: 1, label: "Weight Loss", goalType: "weight_loss" as GoalType, Icon: WeightLoss },
  { id: 2, label: "Weight Gain", goalType: "weight_gain" as GoalType, Icon: WeightGain },
  { id: 3, label: "Stay Healthy", goalType: "stay_healthy" as GoalType, Icon: StayHealthy },
];

const parseLeadingNumber = (value: string) => {
  const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const heightFeetToCm = (value: string) => {
  const feet = parseLeadingNumber(value);
  return Math.round(feet * 30.48);
};

const StepForm = () => {
  const navigation = useNavigation<StepFormNavProp>();
  const invalidateFitnessQueries = useInvalidateFitnessQueries();
  const { width, height } = useWindowDimensions();

  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [gender, setGender] = useState("Female");
  const [age, setAge] = useState("24 Years");
  const [heightValue, setHeightValue] = useState("5.8 ft");
  const [weight, setWeight] = useState("55 kg");
  const [modalVisible, setModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState<FieldKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isCompact = width < 360 || height < 700;
  const goalIconSize = isCompact ? 42 : 52;

  const dropdownItems = useMemo(() => {
    if (currentField === "gender") return genderList;
    if (currentField === "age") return ageList;
    if (currentField === "height") return heightList;
    if (currentField === "weight") return weightList;
    return [];
  }, [currentField]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      return true;
    }

    navigation.goBack();
    return true;
  }, [navigation, step]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", handleBack);
      return () => subscription.remove();
    }, [handleBack])
  );

  const openDropdown = useCallback((field: FieldKey) => {
    setCurrentField(field);
    setModalVisible(true);
  }, []);

  const handleSelect = useCallback((value: string) => {
    if (currentField === "gender") setGender(value);
    if (currentField === "age") setAge(value);
    if (currentField === "height") setHeightValue(value);
    if (currentField === "weight") setWeight(value);
    setModalVisible(false);
  }, [currentField]);

  const selectedGoalType = useMemo(
    () => goals.find((goal) => goal.id === selectedGoal)?.goalType,
    [selectedGoal]
  );

  const handleNext = useCallback(async () => {
    if (step < 3) {
      if (step === 2) {
        if (!selectedGoalType) {
          Alert.alert("Select goal", "Please select your goal first.");
          setStep(1);
          return;
        }

        try {
          setSubmitting(true);
          const res = await updateBasicProfile({
            gender: gender.toLowerCase(),
            age: Math.round(parseLeadingNumber(age)),
            goal_type: selectedGoalType,
          });

          if (!res.success) {
            Alert.alert("Profile update failed", res.message);
            return;
          }

          invalidateFitnessQueries();
        } finally {
          setSubmitting(false);
        }
      }

      setStep((prev) => prev + 1);
      return;
    }

    try {
      setSubmitting(true);
      const res = await updateBodyProfile({
        height_cm: heightFeetToCm(heightValue),
        weight_kg: Math.round(parseLeadingNumber(weight)),
      });

      if (!res.success) {
        Alert.alert("Body profile update failed", res.message);
        return;
      }

      invalidateFitnessQueries();
      navigation.navigate("BMICart");
    } finally {
      setSubmitting(false);
    }
  }, [
    age,
    gender,
    heightValue,
    invalidateFitnessQueries,
    navigation,
    selectedGoalType,
    step,
    weight,
  ]);

  const renderDropdown = (label: string, value: string, field: FieldKey) => (
    <TouchableOpacity
      activeOpacity={0.84}
      style={styles.dropdown}
      onPress={() => openDropdown(field)}
    >
      <View>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <Text style={styles.dropdownText}>{value}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.primaryPurple} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <StepCountBg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: RESPONSIVE.horizontalPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient colors={COLORS.gradientCard} style={styles.popupCard}>
            <View style={styles.stepRow}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={handleBack}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="chevron-left" size={26} color={COLORS.textDark} />
              </TouchableOpacity>

              <View style={styles.progressPill}>
                <Text style={styles.stepIndicator}>Step {step} of 3</Text>
              </View>

              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="close" size={22} color={COLORS.textMedium} />
              </TouchableOpacity>
            </View>

            {step === 1 ? (
              <>
                <Text style={styles.eyebrow}>Personal plan</Text>
                <Text style={styles.title}>What's your goal?</Text>
                <Text style={styles.subtitle}>Choose what you want RP Move to optimize for.</Text>

                <View style={styles.goalRow}>
                  {goals.map(({ id, label, Icon }) => {
                    const selected = selectedGoal === id;

                    return (
                      <TouchableOpacity
                        key={id}
                        style={[styles.goalBox, selected && styles.goalSelected]}
                        activeOpacity={0.86}
                        onPress={() => setSelectedGoal(id)}
                      >
                        <Icon width={goalIconSize} height={goalIconSize} />
                        <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <GradientButton
                  label="Continue"
                  disabled={!selectedGoal || submitting}
                  loading={submitting}
                  onPress={handleNext}
                />
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Text style={styles.eyebrow}>About you</Text>
                <Text style={styles.title}>Details look correct?</Text>
                <Text style={styles.subtitle}>This helps calculate a more useful BMI plan.</Text>

                {renderDropdown("Gender", gender, "gender")}
                {renderDropdown("Age", age, "age")}

                <GradientButton label="Continue" loading={submitting} disabled={submitting} onPress={handleNext} />
              </>
            ) : null}

            {step === 3 ? (
              <>
                <Text style={styles.eyebrow}>Final check</Text>
                <Text style={styles.title}>Almost there</Text>
                <Text style={styles.subtitle}>Add your body metrics to generate your plan.</Text>

                {renderDropdown("Height", heightValue, "height")}
                {renderDropdown("Weight", weight, "weight")}

                <GradientButton label="Submit" loading={submitting} disabled={submitting} onPress={handleNext} />
              </>
            ) : null}
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onBackButtonPress={() => setModalVisible(false)}
        useNativeDriver
        hideModalContentWhileAnimating
      >
        <View style={styles.modalBox}>
          <View style={styles.modalHandle} />
          {dropdownItems.length === 0 ? (
            <ActivityIndicator color={COLORS.primaryPurple} />
          ) : (
            <FlatList
              data={dropdownItems}
              keyExtractor={(item) => item}
              initialNumToRender={18}
              maxToRenderPerBatch={18}
              windowSize={7}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  activeOpacity={0.8}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.modalText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const GradientButton = React.memo(({
  label,
  disabled,
  loading,
  onPress,
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={disabled} style={styles.buttonWrap}>
    <LinearGradient
      colors={disabled ? [COLORS.textMuted, "rgba(107, 114, 128, 0.7)"] : COLORS.gradientPurple}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.button}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.textWhite} />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
    </LinearGradient>
  </TouchableOpacity>
));

export default React.memo(StepForm);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgVeryLight,
  },
  keyboardWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xxl,
  },
  popupCard: {
    ...fitnessCardStyle,
  },
  stepRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: "rgba(124, 77, 255, 0.09)", // Fixed: Used primaryPurple alpha representation
    alignItems: "center",
    justifyContent: "center",
  },
  progressPill: {
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: "rgba(124, 77, 255, 0.1)", // Fixed: Swapped with soft version of primaryPurple 
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  stepIndicator: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryPurple,
  },
  eyebrow: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryPurple,
    textTransform: "uppercase",
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  goalRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  goalBox: {
    flex: 1,
    minHeight: 132,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.sm,
    ...SHADOWS.small,
  },
  goalSelected: {
    borderColor: COLORS.primaryIndigo,
    backgroundColor: "rgba(113, 77, 245, 0.08)", // Fixed: Matches your primaryIndigo theme tint
  },
  goalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMedium,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  goalLabelSelected: {
    color: COLORS.deepIndigo,
  },
  dropdown: {
    width: "100%",
    minHeight: 62,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  dropdownText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textDark,
    marginTop: 2,
  },
  buttonWrap: {
    width: "100%",
    marginTop: SPACING.sm,
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
  modalBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    maxHeight: "68%",
    padding: SPACING.md,
  },
  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: BORDER_RADIUS.pill,
    backgroundColor: COLORS.border, // Fixed: Swapped hardcoded light violet with your core border definition
    alignSelf: "center",
    marginBottom: SPACING.sm,
  },
  modalItem: {
    paddingVertical: 15,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border, // Fixed: Swapped out hardcoded item separation line
  },
  modalText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textDark,
  },
});
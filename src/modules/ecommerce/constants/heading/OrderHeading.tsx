import { useTranslation } from 'react-i18next';
import React, { useCallback, useEffect, useRef } from "react";
import {
  BackHandler,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "../../navigation/types";
import { handleNavigateWithPrefetch } from "../../navigation/navigationPerformance";
import { useAppTheme } from "../../../../theme/ThemeContext";
import ReturnHomeButton from "../../../common/order/ReturnHomeButton";
import {
  navigateBackSafely,
  navigateToRegisteredRoute,
} from "../../../common/order/returnToModuleHome";

type Props = {
  title?: string;
  onBackPress?: () => void;
  onHelpPress?: () => void;
  showHelp?: boolean;
  showHomeButton?: boolean;
  isDark?: boolean;
  fallbackRouteNames?: string[];
  blockedPreviousRouteNames?: string[];
  interceptSystemBack?: boolean;
};

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export default function OrderHeading({
  title = "My Orders",
  onBackPress,
  onHelpPress,
  showHelp = true,
  showHomeButton = false,
  fallbackRouteNames = ["MyOrder", "Home", "Dashboard"],
  blockedPreviousRouteNames = [],
  interceptSystemBack = false,
}: Props) {
  const { t: translateUi } = useTranslation('common');
  const navigation = useNavigation<Nav>();
  const { theme } = useAppTheme();
  const isNavigatingBack = useRef(false);
  const state = navigation.getState();
  const previousRoute = state.index > 0 ? state.routes[state.index - 1]?.name : undefined;
  const previousRouteIsBlocked = Boolean(
    previousRoute && blockedPreviousRouteNames.includes(previousRoute),
  );

  const handleBack = useCallback(() => {
    if (isNavigatingBack.current) return;
    isNavigatingBack.current = true;
    handleNavigateWithPrefetch({
      navigate: () => {
        const currentState = navigation.getState();
        const currentRouteIndex = currentState.index;
        const previousRouteName = currentRouteIndex > 0 ? currentState.routes[currentRouteIndex - 1]?.name : undefined;

        if (onBackPress && previousRouteName && !blockedPreviousRouteNames.includes(previousRouteName)) {
          onBackPress();
          return;
        }

        if (!navigateBackSafely(navigation, { fallbackRouteNames, blockedPreviousRouteNames })) {
          isNavigatingBack.current = false;
        }
      },
    });
  }, [blockedPreviousRouteNames, fallbackRouteNames, navigation, onBackPress]);

  useEffect(() => {
    if (interceptSystemBack) {
      navigation.setOptions({ gestureEnabled: !previousRouteIsBlocked });
    }
  }, [interceptSystemBack, navigation, previousRouteIsBlocked]);

  useFocusEffect(useCallback(() => {
    if (!interceptSystemBack) return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });

    return () => subscription.remove();
  }, [handleBack, interceptSystemBack]));

  const handleHelp = () => {
    handleNavigateWithPrefetch({
      navigate: () => {
        if (onHelpPress) {
          onHelpPress();
          return;
        }

        if (!navigateToRegisteredRoute(navigation, "HelpForm")) {
          console.error("HelpForm is not registered in the active navigation tree.");
        }
      },
    });
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.safe, { backgroundColor: theme.card }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.leftSection}>
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel={translateUi('common:back')}
            style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <MaterialCommunityIcons
              name={I18nManager.isRTL ? "arrow-right" : "arrow-left"}
              size={23}
              color={theme.text}
            />
          </TouchableOpacity>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>

        <View style={styles.rightSection}>
          {showHelp ? (
            <TouchableOpacity
              activeOpacity={0.65}
              onPress={handleHelp}
              accessibilityRole="button"
              accessibilityLabel={translateUi('common:help')}
              style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <MaterialCommunityIcons name="help-circle-outline" size={23} color={theme.text} />
            </TouchableOpacity>
          ) : null}
          {showHomeButton ? <ReturnHomeButton /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    backgroundColor: "#FFFFFF",
  },
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  leftSection: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "auto",
  },
});

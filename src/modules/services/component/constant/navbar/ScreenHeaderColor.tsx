import { useTranslation } from 'react-i18next';
import React, { useRef } from 'react';
import { I18nManager, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useServicesTheme } from '../../../utils/useServicesTheme';
import { navigateBackSafely } from '../../../../common/order/returnToModuleHome';

interface Props {
  title: string;
  onBackPress: () => void;
  children?: React.ReactNode;
  rightAction?: React.ReactNode;
  compact?: boolean;
  fallbackRouteNames?: string[];
  blockedPreviousRouteNames?: string[];
}

const ScreenHeader: React.FC<Props> = ({
  title,
  onBackPress,
  children,
  rightAction,
  compact = false,
  fallbackRouteNames = ['Home'],
  blockedPreviousRouteNames = [],
}) => {
  const { t: translateUi } = useTranslation('common');
  const navigation = useNavigation<any>();
  const servicesTheme = useServicesTheme();
  const { top } = useSafeAreaInsets();
  const isNavigatingBack = useRef(false);

  const handleBack = () => {
    if (isNavigatingBack.current) return;
    isNavigatingBack.current = true;
    const state = navigation.getState();
    const previousRoute = state.index > 0 ? state.routes[state.index - 1]?.name : undefined;
    if (previousRoute && !blockedPreviousRouteNames.includes(previousRoute)) {
      onBackPress();
      return;
    }

    if (!navigateBackSafely(navigation, { fallbackRouteNames, blockedPreviousRouteNames })) {
      isNavigatingBack.current = false;
    }
  };

  return (
    <View style={[styles.headerContainer, { backgroundColor: servicesTheme.colors.surface, paddingTop: Math.max(top, 12) }]}>
      <View style={[styles.headerContent, compact && styles.compactContent]}>
        <TouchableOpacity
          onPress={handleBack}
          style={[
            styles.backButton,
            {
              backgroundColor: servicesTheme.colors.surface,
              borderColor: servicesTheme.colors.border,
            },
          ]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={translateUi('common:back', { defaultValue: 'Go back' })}
        >
          <MaterialCommunityIcons
            name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'}
            size={23}
            color={servicesTheme.colors.text}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitleText, { color: servicesTheme.colors.textStrong }]} numberOfLines={1}>
          {title}
        </Text>
        {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
      </View>

      {children}
      <View style={[styles.divider, { backgroundColor: servicesTheme.colors.divider }]} />
    </View>
  );
};

export default ScreenHeader;
const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 0,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    gap: 8,
  },
  compactContent: { minHeight: 56 },

  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },

  headerTitleText: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'auto',
  },

  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 8,
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
});

import { useTranslation } from 'react-i18next';
import React, { useCallback, useRef } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../theme/ThemeContext';
import { returnToModuleHome } from './returnToModuleHome';

export default function ReturnHomeButton() {
  const { t: translateUi } = useTranslation('common');
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();
  const isNavigating = useRef(false);
  const handlePress = useCallback(() => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    if (!returnToModuleHome(navigation)) {
      isNavigating.current = false;
    }
  }, [navigation]);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={translateUi('common:goToHome', { defaultValue: 'Go to Home' })}
      onPress={handlePress}
      activeOpacity={0.65}
      style={[styles.button, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <MaterialCommunityIcons name="home-outline" size={23} color={theme.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

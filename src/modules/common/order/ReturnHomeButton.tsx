import { useTranslation } from 'react-i18next';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../theme/ThemeContext';
import { returnToModuleHome } from './returnToModuleHome';

export default function ReturnHomeButton() {
  const { t: translateUi } = useTranslation('common');
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={translateUi('common:home')}
      onPress={() => returnToModuleHome(navigation)}
      style={[styles.button, { backgroundColor: theme.card, borderColor: theme.border }]}
      hitSlop={6}
    >
      <MaterialCommunityIcons name="home-outline" size={22} color={theme.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

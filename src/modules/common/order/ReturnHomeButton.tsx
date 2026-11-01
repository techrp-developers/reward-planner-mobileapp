import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../theme/ThemeContext';
import { returnToModuleHome } from './returnToModuleHome';

export default function ReturnHomeButton() {
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();
  return <TouchableOpacity accessibilityRole="button" onPress={() => returnToModuleHome(navigation)} style={[styles.button, { backgroundColor: theme.primary }]}>
    <Text style={styles.text}>Go to Home</Text>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  button: { marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  text: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

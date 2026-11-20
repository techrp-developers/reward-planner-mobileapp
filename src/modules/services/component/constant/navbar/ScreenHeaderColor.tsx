import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useServicesTheme } from '../../../utils/useServicesTheme';

interface Props {
  title: string;
  onBackPress: () => void;
  children?: React.ReactNode;
  compact?: boolean;
}

const ScreenHeader: React.FC<Props> = ({ title, onBackPress, children, compact = false }) => {
  const servicesTheme = useServicesTheme();
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.headerContainer, { backgroundColor: servicesTheme.colors.surface },
      compact && [styles.compactHeader, { paddingTop: Math.max(top, 12) }]]}>
      <View style={[styles.headerContent, compact && styles.compactContent]}>
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="chevron-left" size={32} color={servicesTheme.colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitleText, { color: servicesTheme.colors.textStrong }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {children}
      <View style={[styles.divider, { backgroundColor: servicesTheme.colors.divider }]} />
    </View>
  );
};

export default ScreenHeader;
const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 18,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  compactHeader: { paddingBottom: 0 },
  compactContent: { paddingBottom: 4 },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },

  headerTitleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
});

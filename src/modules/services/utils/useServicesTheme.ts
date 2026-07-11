import { useMemo } from 'react';
import { useAppTheme } from '../../../theme/ThemeContext';

export const useServicesTheme = () => {
  const { isDark, theme } = useAppTheme();

  return useMemo(
    () => ({
      isDark,
      appTheme: theme,
      colors: {
        background: isDark ? '#09090B' : '#FAFAFC',
        surface: isDark ? '#111113' : '#FFFFFF',
        surfaceAlt: isDark ? '#18181B' : '#F7F7FA',
        elevated: isDark ? '#18181B' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#111827',
        textStrong: isDark ? '#F9FAFB' : '#1F2937',
        muted: isDark ? '#A1A1AA' : '#6B7280',
        subtle: isDark ? '#71717A' : '#9CA3AF',
        border: isDark ? 'rgba(255,255,255,0.08)' : '#ECE7FF',
        borderSoft: isDark ? 'rgba(255,255,255,0.06)' : '#F0F0F0',
        divider: isDark ? 'rgba(255,255,255,0.07)' : '#E5E7EB',
        iconBg: isDark ? '#27272A' : '#F3EEFF',
        skeleton: isDark ? '#27272A' : '#E5E7EB',
        shadow: isDark ? '#000000' : '#5B47A3',
        primary: isDark ? '#A78BFA' : '#8665FF',
        primaryDark: isDark ? '#7C3AED' : '#5B47A3',
        accent: isDark ? '#F472B6' : '#FC8BAD',
        success: isDark ? '#34D399' : '#16A34A',
      },
      gradients: {
        primary: isDark ? ['#A78BFA', '#7C3AED'] : ['#8665FF', '#5B47A3'],
        brand: isDark ? ['#EC4899', '#8B5CF6'] : ['#A654CD', '#FC8BAD'],
        card: isDark ? ['#18181B', '#111113'] : ['#F7F7FF', '#E8E8F9'],
      },
    }),
    [isDark, theme],
  );
};

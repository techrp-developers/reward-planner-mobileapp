import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../../../theme/ThemeContext';

export const ACCENT = '#4C2D56';
export const LAVENDER = '#D3B8E5';
export function useLoanColors() {
  const { isDark } = useAppTheme();
  return {
    isDark,
    accent: isDark ? LAVENDER : ACCENT,
    bg: isDark ? '#19131D' : '#F8F5FB',
    card: isDark ? '#261E2C' : '#FFFFFF',
    text: isDark ? '#F9F5FC' : '#302037',
    muted: isDark ? '#BFAFC8' : '#88778F',
    border: isDark ? '#44364D' : '#EBE2F0',
    tint: isDark ? '#3A2C43' : '#F0E7F6',
  };
}

export function Button({
  label,
  onPress,
  disabled,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  const c = useLoanColors();
  const content = (
    <>
      <Text
        style={[styles.buttonText, { color: secondary ? c.accent : '#FFFFFF' }]}
      >
        {label}
      </Text>
      <MaterialIcons
        name="arrow-forward"
        size={19}
        color={secondary ? c.accent : '#FFFFFF'}
      />
    </>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        styles.buttonShell,
      ]}
    >
      {secondary ? (
        <View
          style={[
            styles.button,
            styles.secondaryButton,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          {content}
        </View>
      ) : (
        <LinearGradient
          colors={[ACCENT, '#695174']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {content}
        </LinearGradient>
      )}
    </Pressable>
  );
}

export function PreviewTools({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const c = useLoanColors();
  return (
    <View style={styles.previewTools}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Preview options"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={styles.previewToggle}
      >
        <Text style={[styles.previewOptionLabel, { color: c.muted }]}>
          Preview options
        </Text>
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={17}
          color={c.muted}
        />
      </Pressable>
      {open ? <View style={styles.previewToolsContent}>{children}</View> : null}
    </View>
  );
}

export function Copy({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  const c = useLoanColors();
  return (
    <Text
      accessibilityLiveRegion={error ? 'polite' : 'none'}
      style={[styles.copy, { color: error ? '#BD425B' : c.muted }]}
    >
      {children}
    </Text>
  );
}

export function Row({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  const c = useLoanColors();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: c.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: accent ? c.accent : c.text }]}>
        {value}
      </Text>
    </View>
  );
}

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const c = useLoanColors();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: c.text }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...props}
        onFocus={event => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={event => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        style={[
          styles.input,
          {
            backgroundColor: c.card,
            borderColor: error ? '#BD425B' : focused ? c.accent : c.border,
            color: c.text,
          },
          props.multiline && styles.multiline,
          props.style,
        ]}
      />
      {error ? <Copy error>{error}</Copy> : null}
    </View>
  );
}

export function Check({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: () => void;
}) {
  const c = useLoanColors();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={onChange}
      style={styles.check}
    >
      <MaterialIcons
        name={value ? 'check-box' : 'check-box-outline-blank'}
        size={24}
        color={value ? c.accent : c.muted}
      />
      <Text style={[styles.checkText, { color: c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonShell: { borderRadius: 16, overflow: 'hidden' },
  button: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 19,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  secondaryButton: { borderWidth: 1 },
  buttonText: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  previewTools: { marginTop: 18 },
  previewToggle: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 10,
  },
  previewOptionLabel: { fontSize: 11 },
  previewToolsContent: { gap: 12, paddingTop: 8 },
  copy: { fontSize: 13, lineHeight: 22, marginBottom: 12 },
  detailRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detailLabel: { fontSize: 13, flex: 1, lineHeight: 22 },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    lineHeight: 22,
  },
  field: { marginBottom: 17 },
  fieldLabel: { fontSize: 14, fontWeight: '600', marginBottom: 9 },
  input: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  check: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingVertical: 13,
  },
  checkText: { flex: 1, fontSize: 13, lineHeight: 22 },
});

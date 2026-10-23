import React, { memo, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { fs, rs } from '../../../utils/responsive';
import { useAppTheme } from '../../../theme/ThemeContext';
import type { BirthdayEmployee } from './types';

// Server accepts up to 5000; keep wishes short enough to read as a chat bubble.
const MAX_LENGTH = 1000;

const ACCENT = '#4F46E5';

export const defaultWishMessage = (name: string) => {
  const firstName = name.trim().split(/\s+/)[0] || name;
  return `Happy Birthday, ${firstName}! 🎂 Wishing you a wonderful day and a fantastic year ahead!`;
};

interface Props {
  // The employee being wished; null hides the modal.
  employee: BirthdayEmployee | null;
  sending: boolean;
  onCancel: () => void;
  onSend: (employee: BirthdayEmployee, message: string) => void;
}

const BirthdayWishModal: React.FC<Props> = ({ employee, sending, onCancel, onSend }) => {
  const { isDark, theme } = useAppTheme();
  const [message, setMessage] = useState('');

  // Prefill a fresh message each time the modal opens for someone.
  useEffect(() => {
    if (employee) setMessage(defaultWishMessage(employee.name));
  }, [employee]);

  const trimmed = message.trim();
  const canSend = trimmed.length > 0 && !sending;

  const sheetBg   = isDark ? '#18181B' : theme.background;
  const inputBg   = isDark ? '#27272A' : theme.card;
  const handleSend = () => {
    if (employee && canSend) onSend(employee, trimmed);
  };

  return (
    <Modal
      visible={employee != null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={sending ? undefined : onCancel}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={sending ? undefined : onCancel} accessibilityLabel="Close" />

        <View style={[styles.sheet, { backgroundColor: sheetBg, borderColor: theme.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="cake-variant" size={fs(18)} color="#FFFFFF" />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                Wish {employee?.name}
              </Text>
              <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                Sent to their chat — edit it if you like
              </Text>
            </View>
          </View>

          {/* Message */}
          <TextInput
            value={message}
            onChangeText={setMessage}
            editable={!sending}
            multiline
            maxLength={MAX_LENGTH}
            placeholder="Write your birthday wish…"
            placeholderTextColor={theme.secondaryText}
            textAlignVertical="top"
            style={[
              styles.input,
              { backgroundColor: inputBg, borderColor: theme.border, color: theme.text },
            ]}
            accessibilityLabel="Birthday wish message"
          />
          <Text style={[styles.counter, { color: theme.secondaryText }]}>
            {message.length}/{MAX_LENGTH}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={sending}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.cancelText, { color: theme.text }]}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSend, busy: sending }}
              style={({ pressed }) => [
                styles.button,
                styles.sendButton,
                !canSend && styles.sendDisabled,
                pressed && styles.pressed,
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={fs(14)} color="#FFFFFF" />
                  <Text style={styles.sendText}>Send Wishes</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default memo(BirthdayWishModal);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: rs(22),
    borderTopRightRadius: rs(22),
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: rs(16),
    paddingTop: rs(18),
    paddingBottom: rs(24),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    marginBottom: rs(14),
  },
  headerIcon: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fs(16),
    fontWeight: '800',
  },
  subtitle: {
    fontSize: fs(12),
    marginTop: rs(2),
  },
  input: {
    minHeight: rs(110),
    maxHeight: rs(200),
    borderWidth: 1,
    borderRadius: rs(14),
    paddingHorizontal: rs(12),
    paddingTop: rs(10),
    paddingBottom: rs(10),
    fontSize: fs(14),
    lineHeight: fs(20),
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: fs(10),
    marginTop: rs(4),
  },
  actions: {
    flexDirection: 'row',
    gap: rs(10),
    marginTop: rs(12),
  },
  button: {
    flex: 1,
    height: rs(46),
    borderRadius: rs(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(6),
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelText: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  sendButton: {
    backgroundColor: ACCENT,
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: fs(14),
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});

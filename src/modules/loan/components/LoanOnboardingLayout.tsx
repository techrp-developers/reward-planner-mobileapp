import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useLoanColors } from './LoanUI';

export function LoanOnboardingLayout({
  children,
  onBack,
  footer,
  previewNote,
}: {
  children: React.ReactNode;
  onBack: () => void;
  footer?: React.ReactNode;
  previewNote?: string;
}) {
  const c = useLoanColors();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <StatusBar
        barStyle={c.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={c.bg}
      />
      <LinearGradient
        pointerEvents="none"
        colors={
          c.isDark
            ? ['#33213F', '#19131D', '#19131D']
            : ['#EEE2F5', '#F8F5FB', '#FFFCFF']
        }
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={[
              styles.back,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <MaterialIcons name="chevron-left" size={27} color={c.accent} />
          </Pressable>
          <View accessibilityLabel="Reward Planners" style={styles.brand}>
            <Image
              source={require('../../../assets/menu/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Image
              source={require('../../../assets/menu/logo word.png')}
              style={styles.wordmark}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
          {!footer ? <PreviewNote text={previewNote} /> : null}
        </ScrollView>
        {footer ? (
          <View
            style={[
              styles.footer,
              { backgroundColor: c.bg, borderColor: c.border },
            ]}
          >
            {footer}
            <PreviewNote text={previewNote} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PreviewNote({
  text = 'UI preview · No SMS or loan application is sent',
}: {
  text?: string;
}) {
  const c = useLoanColors();
  return (
    <View style={styles.note}>
      <MaterialIcons name="info-outline" size={12} color={c.muted} />
      <Text style={[styles.noteText, { color: c.muted }]}>{text}</Text>
    </View>
  );
}

export const onboardingStyles = StyleSheet.create({
  center: { alignItems: 'center' },
  title: {
    fontSize: 27,
    lineHeight: 35,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  iconHalo: {
    width: 80,
    height: 80,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    borderWidth: 1,
  },
  formCard: {
    padding: 22,
    borderRadius: 25,
    borderWidth: 1,
    marginTop: 29,
    shadowColor: '#4C2D56',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  stage: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: 20,
  },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 18,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 40 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  logo: { width: 35, height: 35 },
  wordmark: { width: 87, height: 34 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 22,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  note: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  noteText: {
    fontSize: 11,
    flexShrink: 1,
    lineHeight: 18,
    textAlign: 'center',
  },
});

import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Button, useLoanColors } from './LoanUI';
import {
  LoanOnboardingLayout,
  onboardingStyles as base,
} from './LoanOnboardingLayout';

const ART = {
  agreement: require('../assets/loan-agreement.png'),
  bank: require('../assets/loan-bank.png'),
  closure: require('../assets/loan-closure.png'),
};
export function LoanFlowScreen({
  children,
  title,
  subtitle,
  eyebrow,
  onBack,
  action,
  actionLabel,
  disabled,
  artwork,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  eyebrow?: string;
  onBack: () => void;
  action?: () => void;
  actionLabel?: string;
  disabled?: boolean;
  artwork?: keyof typeof ART;
}) {
  const c = useLoanColors();
  return (
    <LoanOnboardingLayout
      onBack={onBack}
      previewNote="Sample journey · No live loan, bank authorisation or payment"
      footer={
        action && actionLabel ? (
          <Button label={actionLabel} onPress={action} disabled={disabled} />
        ) : undefined
      }
    >
      {eyebrow ? (
        <Text style={[flow.eyebrow, { color: c.accent }]}>{eyebrow}</Text>
      ) : null}
      {artwork ? (
        <Image
          accessible={false}
          source={ART[artwork]}
          resizeMode="contain"
          style={[flow.art, artwork === 'closure' && flow.celebrationArt]}
        />
      ) : null}
      <Text accessibilityRole="header" style={[base.title, { color: c.text }]}>
        {title}
      </Text>
      <Text style={[base.subtitle, { color: c.muted }]}>{subtitle}</Text>
      <View style={flow.body}>{children}</View>
    </LoanOnboardingLayout>
  );
}
export function FlowPanel({ children }: { children: React.ReactNode }) {
  const c = useLoanColors();
  return (
    <View
      style={[flow.panel, { backgroundColor: c.card, borderColor: c.border }]}
    >
      {children}
    </View>
  );
}
export function FlowSection({ children }: { children: React.ReactNode }) {
  const c = useLoanColors();
  return <Text style={[flow.sectionTitle, { color: c.text }]}>{children}</Text>;
}
export function FlowAmount({
  label,
  value,
  caption,
  children,
}: {
  label: string;
  value: string;
  caption?: string;
  children?: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={['#4C2D56', '#695174']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={flow.amountPanel}
    >
      <View pointerEvents="none" style={flow.orbit} />
      <Text style={flow.amountLabel}>{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={flow.amountValue}>
        {value}
      </Text>
      {caption ? <Text style={flow.amountCaption}>{caption}</Text> : null}
      {children}
    </LinearGradient>
  );
}
export function FlowNote({
  children,
  icon = 'info-outline',
}: {
  children: React.ReactNode;
  icon?: string;
}) {
  const c = useLoanColors();
  return (
    <View style={[flow.note, { backgroundColor: c.tint }]}>
      <MaterialIcons name={icon} size={19} color={c.accent} />
      <Text style={[flow.noteCopy, { color: c.accent }]}>{children}</Text>
    </View>
  );
}
export function FlowLink({
  label,
  detail,
  icon,
  onPress,
}: {
  label: string;
  detail?: string;
  icon: string;
  onPress: () => void;
}) {
  const c = useLoanColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        flow.link,
        {
          borderColor: c.border,
          backgroundColor: c.card,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={[flow.iconBox, { backgroundColor: c.tint }]}>
        <MaterialIcons name={icon} size={21} color={c.accent} />
      </View>
      <View style={flow.flex}>
        <Text style={[flow.linkTitle, { color: c.text }]}>{label}</Text>
        {detail ? (
          <Text style={[flow.linkDetail, { color: c.muted }]}>{detail}</Text>
        ) : null}
      </View>
      <MaterialIcons name="chevron-right" size={22} color={c.muted} />
    </Pressable>
  );
}
export function FlowOption({
  label,
  detail,
  icon,
  selected,
  onPress,
}: {
  label: string;
  detail: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}) {
  const c = useLoanColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        flow.link,
        {
          backgroundColor: selected ? c.tint : c.card,
          borderColor: selected ? c.accent : c.border,
        },
      ]}
    >
      <MaterialIcons name={icon} size={25} color={c.accent} />
      <View style={flow.flex}>
        <Text style={[flow.linkTitle, { color: c.text }]}>{label}</Text>
        <Text style={[flow.linkDetail, { color: c.muted }]}>{detail}</Text>
      </View>
      <MaterialIcons
        name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
        size={22}
        color={c.accent}
      />
    </Pressable>
  );
}
export function FlowStatus({
  tone = 'success',
  loading = false,
}: {
  tone?: 'success' | 'pending' | 'failed';
  loading?: boolean;
}) {
  const c = useLoanColors();
  const color =
    tone === 'failed'
      ? '#B63D58'
      : tone === 'pending'
      ? c.isDark
        ? '#E4B97A'
        : '#98611E'
      : c.accent;
  return (
    <View
      style={[
        flow.statusHalo,
        {
          backgroundColor: tone === 'success' ? c.tint : c.card,
          borderColor: c.border,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="large" color={color} />
      ) : (
        <MaterialIcons
          name={
            tone === 'failed'
              ? 'close'
              : tone === 'pending'
              ? 'schedule'
              : 'check'
          }
          size={43}
          color={color}
        />
      )}
    </View>
  );
}
export const flow = StyleSheet.create({
  flex: { flex: 1 },
  eyebrow: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: 16,
  },
  art: { alignSelf: 'center', width: 130, height: 119, marginBottom: 15 },
  celebrationArt: { width: 180, height: 175 },
  body: { marginTop: 25 },
  panel: { padding: 19, borderWidth: 1, borderRadius: 23, marginBottom: 15 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginTop: 5,
    marginBottom: 16,
  },
  amountPanel: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 19,
    overflow: 'hidden',
  },
  amountLabel: {
    color: '#E7D7EE',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  amountValue: {
    color: '#FFFFFF',
    fontSize: 37,
    fontWeight: '700',
    letterSpacing: -1.2,
    marginTop: 11,
  },
  amountCaption: {
    color: '#EADDED',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 8,
  },
  orbit: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 100,
    borderColor: '#FFFFFF16',
    borderWidth: 1,
    top: -40,
    right: -70,
  },
  note: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 15,
    padding: 14,
    marginTop: 15,
    marginBottom: 12,
  },
  noteCopy: { flex: 1, fontSize: 12, lineHeight: 20 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 12,
  },
  iconBox: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  linkTitle: { fontSize: 14, fontWeight: '600' },
  linkDetail: { fontSize: 11, lineHeight: 19, marginTop: 5 },
  statusHalo: {
    borderWidth: 1,
    width: 98,
    height: 98,
    borderRadius: 49,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
});

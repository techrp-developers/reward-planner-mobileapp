import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../theme/ThemeContext';
import { useLanguagePreference } from './LanguageContext';
import { DEFAULT_LANGUAGE, isAppLanguage, LANGUAGES, SUPPORTED_LANGUAGES, type AppLanguage } from './languages';

function LanguageScreen({ firstRun, onBack }: { firstRun: boolean; onBack?: () => void }) {
  const { t, i18n } = useTranslation(['language', 'common']);
  const { theme, isDark } = useAppTheme();
  const { saveLanguage } = useLanguagePreference();
  const active = isAppLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
  const [choice, setChoice] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const selected = firstRun ? choice : active;
  const accent = isDark ? theme.primary : '#6D28D9';
  const iconBackground = isDark ? '#35225C' : '#F3E8FF';

  async function commit(language: AppLanguage) {
    if (saving) return;
    setSaving(true);
    setFailed(false);
    try {
      await saveLanguage(language);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      {onBack && (
        <Pressable accessibilityRole="button" accessibilityLabel={t('common:back')} onPress={onBack} style={styles.back}>
          <Icon name="arrow-left" size={24} color={theme.text} />
        </Pressable>
      )}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.icon, { backgroundColor: iconBackground }]}>
          <Icon name="translate" size={28} color={accent} />
        </View>
        <Text accessibilityRole="header" style={[styles.heading, { color: theme.text }]}>
          {t(firstRun ? 'language:welcome' : 'language:title')}
        </Text>
        {firstRun && <Text style={[styles.subheading, { color: theme.text }]}>{t('language:choose')}</Text>}
        <Text style={[styles.description, { color: theme.secondaryText }]}>{t(firstRun ? 'language:intro' : 'language:description')}</Text>
        <View accessibilityRole="radiogroup" style={styles.choices}>
          {SUPPORTED_LANGUAGES.map(language => {
            const { nativeName, englishName } = LANGUAGES[language];
            const checked = language === selected;
            return (
              <Pressable
                key={language}
                testID={`app-language-${language}`}
                accessibilityRole="radio"
                accessibilityLanguage={LANGUAGES[language].locale}
                accessibilityLabel={nativeName}
                accessibilityState={{ checked, disabled: saving }}
                disabled={saving}
                onPress={() => {
                  if (firstRun) setChoice(language);
                  else if (!checked) return commit(language);
                }}
                style={[styles.card, {
                  borderColor: checked ? accent : theme.border,
                  backgroundColor: checked ? (isDark ? '#281C40' : '#FAF5FF') : theme.card,
                }]}
              >
                <View style={styles.cardText}>
                  <Text style={[styles.nativeName, { color: theme.text }]}>{nativeName}</Text>
                  {englishName !== nativeName && <Text style={{ color: theme.secondaryText }}>{englishName}</Text>}
                </View>
                <Icon name={checked ? 'check-circle' : 'checkbox-blank-circle-outline'} size={24} color={checked ? accent : theme.secondaryText} />
              </Pressable>
            );
          })}
        </View>
        {failed && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: theme.text }}>{t('language:saveError')}</Text>}
      </ScrollView>
      {firstRun && (
        <Pressable
          accessibilityRole="button"
          testID="app-language-continue"
          accessibilityState={{ disabled: saving, busy: saving }}
          disabled={saving}
          onPress={() => commit(choice)}
          style={[styles.continue, saving && styles.saving]}
        >
          <Text style={styles.continueText}>{t('common:continue')}</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

export function FirstLanguageScreen() {
  return <LanguageScreen firstRun />;
}

export function AppLanguageScreen() {
  const navigation = useNavigation();
  return <LanguageScreen firstRun={false} onBack={navigation.goBack} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  back: { marginHorizontal: 12, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingVertical: 24, gap: 8 },
  icon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  heading: { fontSize: 28, fontWeight: '800' },
  subheading: { fontSize: 18, fontWeight: '700' },
  description: { fontSize: 16 },
  choices: { gap: 12, marginVertical: 16 },
  card: { minHeight: 72, padding: 16, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
  cardText: { flex: 1 },
  nativeName: { fontSize: 18, fontWeight: '700' },
  continue: { marginHorizontal: 24, marginBottom: 16, minHeight: 52, padding: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#6D28D9' },
  continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  saving: { opacity: 0.65 },
});

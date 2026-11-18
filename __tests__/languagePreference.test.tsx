import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { LanguageProvider, useLanguagePreference } from '../src/i18n/LanguageContext';
import i18n from '../src/i18n';
import { formatINR } from '../src/i18n/format';
import { readLanguagePreference, writeLanguagePreference } from '../src/i18n/languageStorage';
import { AppLanguageScreen, FirstLanguageScreen } from '../src/i18n/LanguageScreens';
import { AppThemeProvider } from '../src/theme/ThemeContext';

let mockUserId: number | null = null;
jest.mock('../src/modules/common/auth/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: mockUserId !== null,
    user: mockUserId === null ? null : { user_id: mockUserId },
  }),
}));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({ goBack: jest.fn() }) }));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');

let app: ReactTestRenderer | undefined;
let preference: ReturnType<typeof useLanguagePreference>;

function Probe() {
  preference = useLanguagePreference();
  const { t } = useTranslation('common');
  return <Text testID="app-label">{t('common:home')}</Text>;
}

function PickerFlow() {
  const { preferenceReady, needsLanguageChoice } = useLanguagePreference();
  if (!preferenceReady) return null;
  return needsLanguageChoice ? <FirstLanguageScreen /> : <AppLanguageScreen />;
}

const render = () => (
  <LanguageProvider>
    <Probe />
  </LanguageProvider>
);

async function useAccount(userId: number | null) {
  mockUserId = userId;
  await act(async () => {
    if (app) app.update(render());
    else app = create(render());
  });
}

const currentLabel = () => app?.root.findByProps({ testID: 'app-label' }).props.children;

beforeEach(async () => {
  mockUserId = null;
  await AsyncStorage.clear();
});

afterEach(async () => {
  await act(async () => app?.unmount());
  app = undefined;
});

test('new account starts in English and can explicitly continue in English', async () => {
  await useAccount(101);
  expect(preference.preferenceReady).toBe(true);
  expect(preference.needsLanguageChoice).toBe(true);
  expect(currentLabel()).toBe('Home');
  await act(async () => preference.saveLanguage('en'));
  expect(preference.needsLanguageChoice).toBe(false);
  expect(await readLanguagePreference(101)).toBe('en');
});

test('Hindi and Marathi update mounted UI, survive restart, and stay scoped to the account', async () => {
  await useAccount(101);
  await act(async () => preference.saveLanguage('hi'));
  expect(currentLabel()).toBe('होम');
  await act(async () => preference.saveLanguage('mr'));
  expect(currentLabel()).toBe('मुख्यपृष्ठ');
  await act(async () => app?.unmount());
  app = undefined;
  await useAccount(101);
  expect(currentLabel()).toBe('मुख्यपृष्ठ');
  expect(preference.needsLanguageChoice).toBe(false);
  await useAccount(null);
  expect(currentLabel()).toBe('Home');
  await useAccount(202);
  expect(currentLabel()).toBe('Home');
  expect(preference.needsLanguageChoice).toBe(true);
  await useAccount(101);
  expect(currentLabel()).toBe('मुख्यपृष्ठ');
});

test('a corrupted preference is treated as missing', async () => {
  await AsyncStorage.setItem('@rewardsplanners/app-language/v1/101', 'invalid');
  await useAccount(101);
  expect(preference.needsLanguageChoice).toBe(true);
  expect(currentLabel()).toBe('Home');
});

test('a failed write preserves the current language and onboarding state', async () => {
  await useAccount(101);
  const setItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;
  setItem.mockRejectedValueOnce(new Error('storage failure'));
  await expect(preference.saveLanguage('hi')).rejects.toThrow('storage failure');
  expect(currentLabel()).toBe('Home');
  expect(preference.needsLanguageChoice).toBe(true);
});

test('an unavailable Hindi key falls back to bundled English', async () => {
  await writeLanguagePreference(101, 'hi');
  await useAccount(101);
  expect(currentLabel()).toBe('होम');
  const hindi = i18n.getResource('hi', 'common', 'home');
  try {
    await act(async () => { i18n.addResource('hi', 'common', 'home', ''); });
    expect(i18n.t('common:home')).toBe('Home');
  } finally {
    await act(async () => { i18n.addResource('hi', 'common', 'home', hindi); });
  }
});

test('a slow read from the previous account cannot change the active account language', async () => {
  await writeLanguagePreference(202, 'mr');
  let finishRead: (language: string) => void = () => {};
  const delayed = new Promise<string>(resolve => { finishRead = resolve; });
  const getItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
  getItem.mockImplementationOnce(() => delayed);
  await useAccount(101);
  expect(preference.preferenceReady).toBe(false);
  await useAccount(202);
  expect(currentLabel()).toBe('मुख्यपृष्ठ');
  await act(async () => finishRead('hi'));
  expect(currentLabel()).toBe('मुख्यपृष्ठ');
});

test('INR formatting retains the same numerical amount', async () => {
  await useAccount(101);
  for (const language of ['en', 'hi', 'mr'] as const) {
    await act(async () => preference.saveLanguage(language));
    const formatted = formatINR(123456.75, { numberingSystem: 'latn' });
    expect(formatted).toContain('₹');
    expect(Number(formatted.replace(/[^\d.]/g, ''))).toBe(123456.75);
  }
});

test('the picker preselects English and Settings shows and applies the current language', async () => {
  mockUserId = 101;
  await act(async () => {
    app = create(
      <AppThemeProvider>
        <LanguageProvider><PickerFlow /></LanguageProvider>
      </AppThemeProvider>,
    );
  });
  const button = (id: string) => app!.root.findAllByProps({ testID: `app-language-${id}` })
    .find(item => typeof item.props.onPress === 'function')!;
  expect(button('en').props.accessibilityState.checked).toBe(true);
  const continueButton = button('continue');
  expect(continueButton.props.disabled).toBe(false);
  await act(async () => button('hi').props.onPress());
  expect(button('hi').props.accessibilityState.checked).toBe(true);
  await act(async () => button('continue').props.onPress());
  expect(app!.root.findAllByProps({ testID: 'app-language-continue' })).toHaveLength(0);
  expect(button('hi').props.accessibilityState.checked).toBe(true);
  expect(await readLanguagePreference(101)).toBe('hi');
  await act(async () => button('mr').props.onPress());
  expect(button('mr').props.accessibilityState.checked).toBe(true);
  expect(await readLanguagePreference(101)).toBe('mr');
});

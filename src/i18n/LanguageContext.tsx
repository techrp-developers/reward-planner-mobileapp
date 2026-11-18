import React, { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { useAuth } from '../modules/common/auth/context/AuthContext';
import i18n, { i18nReady } from './index';
import { DEFAULT_LANGUAGE, type AppLanguage } from './languages';
import { readLanguagePreference, writeLanguagePreference } from './languageStorage';

type Preference = {
  userId: number | null;
  language: AppLanguage | null;
};

type LanguageContextValue = {
  preferenceReady: boolean;
  needsLanguageChoice: boolean;
  saveLanguage: (language: AppLanguage) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const userId = isAuthenticated ? user?.user_id ?? null : null;
  const [preference, setPreference] = useState<Preference | null>(null);
  const scope = useRef<{ saving: boolean } | null>(null);

  useLayoutEffect(() => {
    const session = { saving: false };
    scope.current = session;
    async function restore() {
      await i18nReady;
      if (scope.current !== session) return;
      // Reset immediately when leaving an account, even if the next read is slow.
      await i18n.changeLanguage(DEFAULT_LANGUAGE);
      const language = userId === null ? DEFAULT_LANGUAGE : await readLanguagePreference(userId);
      if (scope.current !== session) return;
      if (language && language !== DEFAULT_LANGUAGE) await i18n.changeLanguage(language);
      if (scope.current === session) setPreference({ userId, language });
    }
    restore();
    return () => {
      scope.current = null;
    };
  }, [userId]);

  const saveLanguage = useCallback(async (language: AppLanguage) => {
    const session = scope.current;
    if (!session || userId === null || preference?.userId !== userId || session.saving) return;
    session.saving = true;
    try {
      await writeLanguagePreference(userId, language);
      if (scope.current !== session) return;
      await i18n.changeLanguage(language);
      if (scope.current === session) setPreference({ userId, language });
    } finally {
      session.saving = false;
    }
  }, [userId, preference?.userId]);

  const preferenceReady = preference?.userId === userId;
  const needsLanguageChoice = preferenceReady && userId !== null && preference?.language === null;
  const value = useMemo(
    () => ({ preferenceReady, needsLanguageChoice, saveLanguage }),
    [preferenceReady, needsLanguageChoice, saveLanguage],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={value}>
        {children}
      </LanguageContext.Provider>
    </I18nextProvider>
  );
}

export function useLanguagePreference() {
  const preference = useContext(LanguageContext);
  if (!preference) throw new Error('LanguageProvider is missing');
  return preference;
}

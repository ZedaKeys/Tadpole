/**
 * Simple i18n utility with React context for reactive language switching.
 * No external library needed.
 */
'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import translations, { type Lang } from './translations';

const LANG_KEY = 'tadpole-language';

export function getLanguage(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'en' || stored === 'es' || stored === 'fr' || stored === 'de') {
      return stored;
    }
  } catch {
    // SSR or storage unavailable
  }
  return 'en';
}

export function setLanguage(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Storage unavailable
  }
}

/**
 * Translate a key. Falls back to English if the key is missing in the current language.
 */
export function t(key: string, lang?: Lang): string {
  const l = lang ?? getLanguage();
  return translations[l]?.[key] ?? translations.en[key] ?? key;
}

// ── React Context ──

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => translations.en[key] ?? key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  // Hydrate from localStorage on mount
  useEffect(() => {
    setLangState(getLanguage());
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLanguage(newLang);
    setLangState(newLang);
  }, []);

  const translate = useCallback(
    (key: string) => {
      return translations[lang]?.[key] ?? translations.en[key] ?? key;
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

import React, { createContext, useContext, useEffect } from 'react';

export type Language = 'gu' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isGujarati: boolean;
  t: (guText: string, enText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Exclusively Gujarati as strictly requested by user - no option to change
  const language: Language = 'gu';
  const isGujarati = true;

  useEffect(() => {
    try {
      localStorage.removeItem('anandotsav_lang');
    } catch {
      // Ignore
    }
  }, []);

  const setLanguage = (_lang: Language) => {
    // No-op: Only Gujarati is supported for the public portal
  };

  const t = (guText: string, _enText?: string): string => {
    // Always return Gujarati text
    return guText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isGujarati, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// src/components/LanguageProvider.tsx
'use client';
import { useEffect } from 'react';
import i18next from 'i18next';

export default function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const savedLang = localStorage.getItem('lang');
    if (savedLang && savedLang !== i18next.language) {
      i18next.changeLanguage(savedLang);
    }
  }, []);

  return <>{children}</>;
}
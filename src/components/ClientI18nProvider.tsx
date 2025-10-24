// src/components/ClientI18nProvider.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/app/lib/i18n';

interface ClientI18nProviderProps {
  children: ReactNode;
}

const ClientI18nProvider = ({ children }: ClientI18nProviderProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Prevent SSR mismatch
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export default ClientI18nProvider;
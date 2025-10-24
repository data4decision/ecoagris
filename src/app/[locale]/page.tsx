// src/app/[locale]/page.tsx
'use client';

import { useTranslation } from 'react-i18next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import KeyDataInsight from '@/components/KeyDataInsight';
import ClientI18nProvider from '@/components/ClientI18nProvider';

export default function Home() {
  const { t } = useTranslation();
  return (
    <ClientI18nProvider>
      <div className="min-h-screen bg-[var(--yellow)]">
        <Navbar />
        <div className="p-6 w-full sm:w-[80%] mx-auto">
          <h1 className="text-2xl font-bold text-[var(--dark-green)] mb-6">
            {t('welcome')}
          </h1>
          <p>{t('description')}</p>
          <KeyDataInsight />
        </div>
        <Footer />
      </div>
    </ClientI18nProvider>
  );
}
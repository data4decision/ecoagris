// src/app/layout.tsx
'use client';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/lib/i18n';
import i18next from 'i18next';
import { useEffect } from 'react';
import LanguageProvider from '@/components/LanguageProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={i18next.language || 'en'}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
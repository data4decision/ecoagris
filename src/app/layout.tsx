'use client'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/lib/i18n";
import i18next from "i18next";
import { useEffect } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const Metadata: Metadata = {
  title: "ECOAGRIS",
  description: "ECOAGRIS A PLACE YOU CAN GET DATA FOR AGRICULTURE FROM DIFFERENT SECTOR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang) {
      i18next.changeLanguage(savedLang);
    }
  }, []);

  return (
    <html lang={i18next.language || "en"}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

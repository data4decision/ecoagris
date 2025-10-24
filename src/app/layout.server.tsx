// src/app/layout.server.tsx
import type { Metadata } from 'next';
import ClientLayout from './layout'; // Import the client layout

export const metadata: Metadata = {
  title: 'ECOAGRIS',
  description: 'ECOAGRIS: A platform for agricultural data from various sectors',
};

export default function ServerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ClientLayout>{children}</ClientLayout>;
}
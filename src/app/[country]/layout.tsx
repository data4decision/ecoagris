


'use client';

import { useParams } from 'next/navigation';

export default function CountryLayout({ children }: { children: React.ReactNode }) {
  const { country } = useParams();

  if (!country) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import { useTranslation } from 'react-i18next';

export default function ProductDashboard() {
  const { country, product } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { t } = useTranslation('common'); // 👈 using "common" namespace

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!user) return null;

  const productName =
    (product as string).charAt(0).toUpperCase() +
    (product as string).slice(1).replace(/-/g, ' ');

  const supportedCountries = [
    'benin',
    'burkina faso',
    'cape verde',
    'cote divoire',
    'gambia',
    'ghana',
    'guinea',
    'guinea-bissau',
    'liberia',
    'mali',
    'niger',
    'nigeria',
    'senegal',
    'sierra leone',
    'togo',
  ];

  const countryName =
    (country as string).charAt(0).toUpperCase() +
    (country as string).slice(1);

  if (!supportedCountries.includes((country as string).toLowerCase())) {
    return (
      <div className="min-h-screen bg-[var(--white)] p-6">
        <h1 className="text-2xl font-bold text-[var(--dark-green)] mb-4">
          {t('product_dashboard_title', { productName, countryName })}
        </h1>
        <p className="text-[var(--wine)]">
          {t('product_dashboard_data_not_available', { countryName })}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--white)] p-6">
      <h1 className="text-2xl font-bold text-[var(--dark-green)] mb-4">
        {t('product_dashboard_title', { productName, countryName })}
      </h1>
      {/* Add your dashboard content here */}
    </div>
  );
}

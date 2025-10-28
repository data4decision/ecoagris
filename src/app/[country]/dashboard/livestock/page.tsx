'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import LivestockOverview from '@/app/[country]/dashboard/livestock/LiveStockOverview';
import { useTranslation } from 'next-i18next';

export default function LivestockDashboard() {
  const { t } = useTranslation('common');
  const { country } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const countryName = country
    ? (country as string).charAt(0).toUpperCase() + (country as string).slice(1)
    : '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate data loading
        await new Promise((resolve) => setTimeout(resolve, 500));
        setLoading(false);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : t('livestockOverview.errors.loadingError')
        );
        setLoading(false);
      }
    };
    fetchData();
  }, [country, t]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--olive-green)] text-lg">
        {t('livestockOverview.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--wine)] text-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--white)]">
      <div className="flex-1 p-6">
        {/* <h1 className="text-2xl font-bold text-[var(--dark-green)] mb-4">
          {t('livestockOverview.title', { countryName })}
        </h1> */}
        <LivestockOverview />
      </div>
    </div>
  );
}
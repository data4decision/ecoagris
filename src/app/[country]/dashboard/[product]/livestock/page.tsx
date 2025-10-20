'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import LivestockOverview from '@/app/products/livestock/Overview';

export default function LivestockDashboard() {
  const { country } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate data loading for Livestock
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [country]);

  if (loading) return <div className="text-[var(--olive-green)]">Loading Livestock Dashboard...</div>;
  if (error) return <div className="text-[var(--wine)]">{error}</div>;

  return (
    <div className="min-h-screen bg-[var(--white)] p-6">
      <h1 className="text-2xl font-bold text-[var(--dark-green)] mb-4">
        Livestock Overview for {country.charAt(0).toUpperCase() + country.slice(1)}
      </h1>
      <LivestockOverview />
    </div>
  );
}
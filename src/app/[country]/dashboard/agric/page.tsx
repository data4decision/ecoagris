'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Overview from '@/app/[country]/dashboard/agric/Overview/page';


export default function AgricDashboard() {
  const { country } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate data loading for Agric-Input
    const fetchData = async () => {
      try {
        // Add actual data fetching logic if needed (e.g., for Overview data)
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulated delay
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading Agric-Input dashboard');
        setLoading(false);
      }
    };
    fetchData();
  }, [country]);

  if (loading) return <div className="text-[var(--olive-green)]">Loading Agric Input Dashboard...</div>;
  if (error) return <div className="text-[var(--wine)]">{error}</div>;

  return (
    <div className="flex min-h-screen bg-[var(--white)] overflow-x-hidden">
      
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-[var(--dark-green)] mb-4">
          Agric Input Overview for {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <Overview />
      </div>
    </div>
  );
}
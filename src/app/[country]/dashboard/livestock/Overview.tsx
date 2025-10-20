'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface LivestockData {
  country: string;
  year: number;
  cattle_head: number;
  milk_production_tons: number;
  meat_production_tons: number;
}

export default function Overview() {
  const { country } = useParams();
  const [data, setData] = useState<LivestockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch overview data');
        const jsonData = await response.json();
        const latestData = jsonData.Simulated_Livestock_Data
          .filter((item: LivestockData) => item.country.toLowerCase() === (country as string).toLowerCase() && item.year === 2025)
          .sort((a: LivestockData, b: LivestockData) => b.year - a.year)[0]; // Get 2025 data
        setData(latestData || null);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading overview data');
        setLoading(false);
      }
    }
    fetchData();
  }, [country]);

  if (loading) return <div className="text-[var(--olive-green)]">Loading Overview...</div>;
  if (error) return <div className="text-[var(--wine)]">{error}</div>;
  if (!data) return <div className="text-[var(--wine)]">No data available for 2025</div>;

  return (
    <div className="bg-[var(--white)] p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-[var(--dark-green)]">
        Livestock Overview in {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)} (2025)
      </h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-[var(--olive-green)]">
        <div>
          <p><strong>Cattle Population:</strong> {data.cattle_head.toLocaleString()} head</p>
          <p><strong>Milk Production:</strong> {data.milk_production_tons.toLocaleString()} tons</p>
          <p><strong>Meat Production:</strong> {data.meat_production_tons.toLocaleString()} tons</p>
        </div>
        <div>
          <p className="text-sm italic">
            Note: Data is simulated for 2025. Validate against national statistics.
          </p>
        </div>
      </div>
    </div>
  );
}
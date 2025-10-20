'use client';
import { useEffect, useState } from 'react';

interface LivestockData {
  country: string;
  year: number;
  cattle_head: number;
  milk_production_tons: number;
  meat_production_tons: number;
  vaccination_coverage_pct: number;
}

export default function ComparisonTable() {
  const [data, setData] = useState<LivestockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch comparison data');
        const jsonData = await response.json();
        setData(
          jsonData.Simulated_Livestock_Data.filter((item: LivestockData) => item.year === 2025)
        );
        setLoading(false);
      } catch (err) {
        setError('Error loading comparison data');
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="text-[var(--olive-green)]">Loading...</div>;
  if (error) return <div className="text-[var(--wine)]">{error}</div>;

  return (
    <div className="bg-[var(--white)] p-4 rounded-lg shadow overflow-x-auto">
      <h2 className="text-lg font-semibold text-[var(--dark-green)] mb-4">
        Country Comparison (2025)
      </h2>
      <table className="w-full text-[var(--olive-green)]">
        <thead>
          <tr className="bg-[var(--yellow)]/20">
            <th className="p-2 text-left">Country</th>
            <th className="p-2 text-left">Cattle (Head)</th>
            <th className="p-2 text-left">Milk (Tons)</th>
            <th className="p-2 text-left">Meat (Tons)</th>
            <th className="p-2 text-left">Vaccination Coverage (%)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.country} className="border-b">
              <td className="p-2">{item.country}</td>
              <td className="p-2">{item.cattle_head.toLocaleString()}</td>
              <td className="p-2">{item.milk_production_tons.toLocaleString()}</td>
              <td className="p-2">{item.meat_production_tons.toLocaleString()}</td>
              <td className="p-2">{item.vaccination_coverage_pct.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
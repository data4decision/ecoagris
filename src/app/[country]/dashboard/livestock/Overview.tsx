'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface LivestockData {
  country: string;
  year: number;
  cattle_head: number;
  small_ruminants_head: number;
  pigs_head: number;
  poultry_head: number;
  milk_production_tons: number;
  meat_production_tons: number;
}

export default function LivestockOverview() {
  const { country } = useParams();
  const [data, setData] = useState<LivestockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch data');
        const jsonData = await response.json();
        const countryData = jsonData.Simulated_Livestock_Data.find(
          (item: LivestockData) => item.country.toLowerCase() === (country as string).toLowerCase() && item.year === 2025
        );
        if (!countryData) throw new Error('Data not found for country in 2025');
        setData(countryData);
        setLoading(false);
      } catch (err) {
        setError('Error loading overview data');
        setLoading(false);
      }
    }
    fetchData();
  }, [country]);

  if (loading) return <div className="text-[var(--olive-green)]">Loading...</div>;
  if (error) return <div className="text-[var(--wine)]">{error}</div>;

  return (
    <div className="bg-[var(--white)] p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-[var(--dark-green)]">
        Livestock Overview in {country.charAt(0).toUpperCase() + country.slice(1)} (2025)
      </h2>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-[var(--olive-green)]">
        <div>
          <p><strong>Total Livestock:</strong> {(data!.cattle_head + data!.small_ruminants_head + data!.pigs_head + data!.poultry_head).toLocaleString()} head</p>
          <p><strong>Cattle:</strong> {data!.cattle_head.toLocaleString()} head</p>
          <p><strong>Small Ruminants:</strong> {data!.small_ruminants_head.toLocaleString()} head</p>
          <p><strong>Pigs:</strong> {data!.pigs_head.toLocaleString()} head</p>
          <p><strong>Poultry:</strong> {data!.poultry_head.toLocaleString()} head</p>
        </div>
        <div>
          <p><strong>Milk Production:</strong> {data!.milk_production_tons.toLocaleString()} tons</p>
          <p><strong>Meat Production:</strong> {data!.meat_production_tons.toLocaleString()} tons</p>
        </div>
      </div>
    </div>
  );
}
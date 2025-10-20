'use client';
import { useEffect, useState } from 'react';

interface MethodologyData {
  note: string;
}

export default function Methodology() {
  const [data, setData] = useState<MethodologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch methodology data');
        const jsonData = await response.json();
        setData(jsonData.Methodology_Assumptions[0]);
        setLoading(false);
      } catch (err) {
        setError('Error loading methodology data');
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="text-[var(--olive-green)]">Loading...</div>;
  if (error) return <div className="text-[var(--wine)]">{error}</div>;

  return (
    <div className="bg-[var(--white)] p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-[var(--dark-green)] mb-4">
        Data & Methodology
      </h2>
      <div className="text-[var(--olive-green)] whitespace-pre-line">
        {data?.note}
      </div>
    </div>
  );
}
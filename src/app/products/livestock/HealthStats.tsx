'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface LivestockData {
  country: string;
  year: number;
  vaccination_coverage_pct: number;
  fmd_incidents_count: number;
  veterinary_facilities_count: number;
}

export default function HealthStats() {
  const { country } = useParams();
  const [data, setData] = useState<LivestockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch health data');
        const jsonData = await response.json();
        setData(
          jsonData.Simulated_Livestock_Data.filter(
            (item: LivestockData) => item.country.toLowerCase() === (country as string).toLowerCase()
          ).sort((a: LivestockData, b: LivestockData) => a.year - b.year)
        );
        setLoading(false);
      } catch (err) {
        setError('Error loading health data');
        setLoading(false);
      }
    }
    fetchData();
  }, [country]);

  if (loading) return <div className="text-[var(--olive-green)]">Loading...</div>;
  if (error) return <div className="text-[var(--wine)]">{error}</div>;

  const chartData = {
    labels: data.map((item) => item.year),
    datasets: [
      {
        label: 'Vaccination Coverage (%)',
        data: data.map((item) => item.vaccination_coverage_pct),
        borderColor: 'var(--green)',
        backgroundColor: 'var(--green)',
        fill: false,
        yAxisID: 'y1',
      },
      {
        label: 'FMD Incidents',
        data: data.map((item) => item.fmd_incidents_count),
        borderColor: 'var(--wine)',
        backgroundColor: 'var(--wine)',
        fill: false,
        yAxisID: 'y2',
      },
      {
        label: 'Veterinary Facilities',
        data: data.map((item) => item.veterinary_facilities_count),
        borderColor: 'var(--yellow)',
        backgroundColor: 'var(--yellow)',
        fill: false,
        yAxisID: 'y3',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: `Animal Health & Welfare in ${country.charAt(0).toUpperCase() + country.slice(1)}`, color: 'var(--dark-green)' },
    },
    scales: {
      x: { title: { display: true, text: 'Year', color: 'var(--olive-green)' } },
      y1: { title: { display: true, text: 'Vaccination Coverage (%)', color: 'var(--olive-green)' }, position: 'left' as const },
      y2: { title: { display: true, text: 'FMD Incidents', color: 'var(--olive-green)' }, position: 'right' as const },
      y3: { title: { display: true, text: 'Veterinary Facilities', color: 'var(--olive-green)' }, position: 'right' as const, grid: { display: false } },
    },
  };

  return (
    <div className="bg-[var(--white)] p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-[var(--dark-green)] mb-4">
        Animal Health & Welfare in {country.charAt(0).toUpperCase() + country.slice(1)}
      </h2>
      <Line data={chartData} options={options} />
    </div>
  );
}
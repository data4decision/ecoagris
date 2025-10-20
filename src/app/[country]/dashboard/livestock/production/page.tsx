'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface LivestockData {
  country: string;
  year: number;
  milk_production_tons: number;
  meat_production_tons: number;
}

export default function ProductionChart() {
  const { country } = useParams();
  const [data, setData] = useState<LivestockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch production data');
        const jsonData = await response.json();
        setData(
          jsonData.Simulated_Livestock_Data.filter(
            (item: LivestockData) => item.country.toLowerCase() === (country as string).toLowerCase()
          ).sort((a: LivestockData, b: LivestockData) => a.year - b.year)
        );
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading production data');
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
        label: 'Milk Production (tons)',
        data: data.map((item) => item.milk_production_tons),
        borderColor: 'var(--medium-green)',
        backgroundColor: 'var(--medium-green)',
        pointBackgroundColor: 'var(--medium-green)',
        pointBorderColor: 'var(--medium-green)',
        fill: false,
      },
      {
        label: 'Meat Production (tons)',
        data: data.map((item) => item.meat_production_tons),
        borderColor: 'var(--wine)',
        backgroundColor: 'var(--wine)',
        pointBackgroundColor: 'var(--wine)',
        pointBorderColor: 'var(--wine)',
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const, labels: { color: 'var(--dark-green)' } },
      title: {
        display: true,
        text: `Production Trends in ${(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}`,
        color: 'var(--dark-green)',
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Year', color: 'var(--olive-green)' },
        ticks: { color: 'var(--olive-green)' },
      },
      y: {
        title: { display: true, text: 'Tons', color: 'var(--olive-green)' },
        ticks: { color: 'var(--olive-green)' },
      },
    },
  };

  return (
    <div className="bg-[var(--white)] p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-[var(--dark-green)] mb-4">
        Production and Output in {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
      </h2>
      <Line data={chartData} options={options} />
    </div>
  );
}
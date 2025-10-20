'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface LivestockData {
  country: string;
  year: number;
  livestock_price_index_2006_base: number;
  livestock_exports_tons: number;
  offtake_rate_pct: number;
}

export default function EconomyChart() {
  const { country } = useParams();
  const [data, setData] = useState<LivestockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch economy data');
        const jsonData = await response.json();
        setData(
          jsonData.Simulated_Livestock_Data.filter(
            (item: LivestockData) => item.country.toLowerCase() === (country as string).toLowerCase()
          ).sort((a: LivestockData, b: LivestockData) => a.year - b.year)
        );
        setLoading(false);
      } catch (err) {
        setError('Error loading economy data');
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
        label: 'Price Index (2006 Base)',
        data: data.map((item) => item.livestock_price_index_2006_base),
        borderColor: 'var(--green)',
        backgroundColor: 'var(--green)',
        fill: false,
        yAxisID: 'y1',
      },
      {
        label: 'Exports (tons)',
        data: data.map((item) => item.livestock_exports_tons),
        borderColor: 'var(--yellow)',
        backgroundColor: 'var(--yellow)',
        fill: false,
        yAxisID: 'y2',
      },
      {
        label: 'Offtake Rate (%)',
        data: data.map((item) => item.offtake_rate_pct),
        borderColor: 'var(--wine)',
        backgroundColor: 'var(--wine)',
        fill: false,
        yAxisID: 'y3',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: `Economic Indicators in ${country.charAt(0).toUpperCase() + country.slice(1)}`, color: 'var(--dark-green)' },
    },
    scales: {
      x: { title: { display: true, text: 'Year', color: 'var(--olive-green)' } },
      y1: { title: { display: true, text: 'Price Index', color: 'var(--olive-green)' }, position: 'left' as const },
      y2: { title: { display: true, text: 'Exports (tons)', color: 'var(--olive-green)' }, position: 'right' as const },
      y3: { title: { display: true, text: 'Offtake Rate (%)', color: 'var(--olive-green)' }, position: 'right' as const, grid: { display: false } },
    },
  };

  return (
    <div className="bg-[var(--white)] p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-[var(--dark-green)] mb-4">
        Economic Indicators in {country.charAt(0).toUpperCase() + country.slice(1)}
      </h2>
      <Line data={chartData} options={options} />
    </div>
  );
}
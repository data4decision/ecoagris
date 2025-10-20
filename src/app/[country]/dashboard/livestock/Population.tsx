'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface LivestockData {
  country: string;
  year: number;
  cattle_head: number;
  small_ruminants_head: number;
  pigs_head: number;
  poultry_head: number;
}

export default function PopulationChart() {
  const { country } = useParams();
  const [data, setData] = useState<LivestockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch population data');
        const jsonData = await response.json();
        setData(
          jsonData.Simulated_Livestock_Data.filter(
            (item: LivestockData) => item.country.toLowerCase() === (country as string).toLowerCase()
          ).sort((a: LivestockData, b: LivestockData) => a.year - b.year)
        );
        setLoading(false);
      } catch (err) {
        setError('Error loading population data');
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
        label: 'Cattle',
        data: data.map((item) => item.cattle_head),
        borderColor: 'var(--green)',
        backgroundColor: 'var(--green)',
        fill: false,
      },
      {
        label: 'Small Ruminants',
        data: data.map((item) => item.small_ruminants_head),
        borderColor: 'var(--yellow)',
        backgroundColor: 'var(--yellow)',
        fill: false,
      },
      {
        label: 'Pigs',
        data: data.map((item) => item.pigs_head),
        borderColor: 'var(--wine)',
        backgroundColor: 'var(--wine)',
        fill: false,
      },
      {
        label: 'Poultry',
        data: data.map((item) => item.poultry_head),
        borderColor: 'var(--olive-green)',
        backgroundColor: 'var(--olive-green)',
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: `Livestock Population Trends in ${country.charAt(0).toUpperCase() + country.slice(1)}`, color: 'var(--dark-green)' },
    },
    scales: {
      x: { title: { display: true, text: 'Year', color: 'var(--olive-green)' } },
      y: { title: { display: true, text: 'Head Count', color: 'var(--olive-green)' } },
    },
  };

  return (
    <div className="bg-[var(--white)] p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-[var(--dark-green)] mb-4">
        Livestock Population in {country.charAt(0).toUpperCase() + country.slice(1)}
      </h2>
      <Line data={chartData} options={options} />
    </div>
  );
}
'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface LivestockData {
  country: string;
  year: number;
  grazing_area_ha: number;
  transhumance_events: number;
}

export default function GrazingMap() {
  const { country } = useParams();
  const [data, setData] = useState<LivestockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch grazing data');
        const jsonData = await response.json();
        setData(
          jsonData.Simulated_Livestock_Data.filter(
            (item: LivestockData) => item.country.toLowerCase() === (country as string).toLowerCase()
          ).sort((a: LivestockData, b: LivestockData) => a.year - b.year)
        );
        setLoading(false);
      } catch (err) {
        setError('Error loading grazing data');
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
        label: 'Grazing Area (ha)',
        data: data.map((item) => item.grazing_area_ha),
        borderColor: 'var(--green)',
        backgroundColor: 'var(--green)',
        fill: false,
        yAxisID: 'y1',
      },
      {
        label: 'Transhumance Events',
        data: data.map((item) => item.transhumance_events),
        borderColor: 'var(--yellow)',
        backgroundColor: 'var(--yellow)',
        fill: false,
        yAxisID: 'y2',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: `Grazing & Transhumance in ${country.charAt(0).toUpperCase() + country.slice(1)}`, color: 'var(--dark-green)' },
    },
    scales: {
      x: { title: { display: true, text: 'Year', color: 'var(--olive-green)' } },
      y1: { title: { display: true, text: 'Grazing Area (ha)', color: 'var(--olive-green)' }, position: 'left' as const },
      y2: { title: { display: true, text: 'Transhumance Events', color: 'var(--olive-green)' }, position: 'right' as const },
    },
  };

  return (
    <div className="bg-[var(--white)] p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-[var(--dark-green)] mb-4">
        Grazing & Transhumance in {country.charAt(0).toUpperCase() + country.slice(1)}
      </h2>
      <Line data={chartData} options={options} />
    </div>
  );
}
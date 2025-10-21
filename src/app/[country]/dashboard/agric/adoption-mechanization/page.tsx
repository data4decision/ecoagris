'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts';
import { FaTractor, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InputData {
  country: string;
  year: number;
  cereal_seeds_tons: number;
  fertilizer_tons: number;
  pesticide_liters: number;
  input_subsidy_budget_usd: number;
  credit_access_pct: number;
  stockouts_days_per_year: number;
  fertilizer_kg_per_ha: number;
  improved_seed_use_pct: number;
  mechanization_units_per_1000_farms: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Input_Data: InputData[];
}

export default function AdoptionMechanizationPage() {
  const { country } = useParams();
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<
    'improved_seed_use_pct' | 'fertilizer_kg_per_ha' | 'mechanization_units_per_1000_farms'
  >('improved_seed_use_pct');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError('Invalid country parameter');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/agric/APMD_ECOWAS_Input_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch adoption and mechanization data');
        const jsonData = (await response.json()) as Dataset;

        const years = jsonData.Simulated_Input_Data.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Simulated_Input_Data.filter(
          (d) => d.country.toLowerCase() === (country as string).toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(`No data available for ${country}`);
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (error) {
        setError('Error loading adoption and mechanization data');
        setLoading(false);
      }
    }

    fetchData();
  }, [country]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map((d) => d.year))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find((d) => d.year === selectedYear);
  const totalInputUsage = selectedData
    ? selectedData.cereal_seeds_tons + selectedData.fertilizer_tons + selectedData.pesticide_liters
    : 0;

  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => ({
      Year: data.year,
      'Improved Seed Adoption (%)': data.improved_seed_use_pct,
      'Fertilizer Intensity (kg/ha)': data.fertilizer_kg_per_ha,
      'Mechanization (Units/1,000 Farms)': data.mechanization_units_per_1000_farms,
      'Cereal Seeds (tons)': data.cereal_seeds_tons,
      'Fertilizer (tons)': data.fertilizer_tons,
      'Pesticides (liters)': data.pesticide_liters,
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_adoption_mechanization_data.csv`;
    link.click();
  };

  const handlePDFDownload = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) return;

    const canvas = await html2canvas(dashboard, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`${country}_adoption_mechanization_dashboard.pdf`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">Loading Adoption & Mechanization...</p>
        </div>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">Error: {error || 'No data available for this country'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content">
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={`Adoption & Mechanization Overview for ${country}`}
        >
          <FaTractor aria-hidden="true" className="text-lg sm:text-xl" /> Adoption & Mechanization -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          Simulated data for planning purposes. Validate before operational use.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label="Download adoption and mechanization data as CSV"
          >
            <FaDownload /> Download CSV
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label="Download adoption and mechanization dashboard as PDF"
          >
            <FaDownload /> Download PDF
          </button>
        </div>

        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            Select Year for Metrics
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 max-w-full">
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={`Improved Seed Adoption Card for ${selectedYear}`}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">Improved Seed Adoption ({selectedYear})</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">{selectedData?.improved_seed_use_pct.toFixed(1)}%</p>
          </div>
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={`Fertilizer Intensity Card for ${selectedYear}`}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">Fertilizer Intensity ({selectedYear})</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">{selectedData?.fertilizer_kg_per_ha.toFixed(1)} kg/ha</p>
          </div>
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={`Mechanization Card for ${selectedYear}`}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">Mechanization ({selectedYear})</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">{selectedData?.mechanization_units_per_1000_farms.toFixed(1)} units/1,000 farms</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-full">
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label="Adoption Trends Chart">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              Adoption Trends (2006–{selectedYear})
            </h2>
            <ResponsiveContainer width="100%" height={400} className="sm:h-[250px]">
              <LineChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  interval="preserveStartEnd"
                  height={50}
                  className="sm:text-[12px] sm:angle-0 sm:text-anchor-middle"
                />
                <YAxis fontSize={10} className="sm:text-[12px]" />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                  className="hidden sm:block"
                />
                <Line
                  type="monotone"
                  dataKey="improved_seed_use_pct"
                  stroke="var(--olive-green)"
                  name="Improved Seed Adoption (%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="fertilizer_kg_per_ha"
                  stroke="var(--wine)"
                  name="Fertilizer Intensity (kg/ha)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="mechanization_units_per_1000_farms"
                  stroke="#8884d8"
                  name="Mechanization (Units/1,000 Farms)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label="Year Comparison Chart">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              Year Comparison ({(country as string).charAt(0).toUpperCase() + (country as string).slice(1)})
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              Select Metric for Year Comparison
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) =>
                setSelectedMetric(
                  e.target.value as 'improved_seed_use_pct' | 'fertilizer_kg_per_ha' | 'mechanization_units_per_1000_farms'
                )
              }
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              <option value="improved_seed_use_pct">Improved Seed Adoption (%)</option>
              <option value="fertilizer_kg_per_ha">Fertilizer Intensity (kg/ha)</option>
              <option value="mechanization_units_per_1000_farms">Mechanization (Units/1,000 Farms)</option>
            </select>
            <ResponsiveContainer width="100%" height={400} className="sm:h-[250px]">
              <BarChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }} barGap={2} barCategoryGap="10%">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  interval="preserveStartEnd"
                  height={50}
                  className="sm:text-[12px] sm:angle-0 sm:text-anchor-middle"
                />
                <YAxis fontSize={10} className="sm:text-[12px]" />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey={selectedMetric} fill="var(--olive-green)" minPointSize={5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
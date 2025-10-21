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

interface GrowthData {
  year: number;
  seedGrowthRate: number; // Annual growth rate for improved_seed_use_pct
  mechanizationGrowthRate: number; // Annual growth rate for mechanization_units_per_1000_farms
}

export default function ForecastSimulationPage() {
  const { country } = useParams();
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'input_subsidy_budget_usd' | 'credit_access_pct'>('input_subsidy_budget_usd');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate growth rates for forecasting insights
  const growthData: GrowthData[] = useMemo(() => {
    return countryData
      .sort((a, b) => a.year - b.year)
      .map((data, index, array) => {
        if (index === 0) {
          return { year: data.year, seedGrowthRate: 0, mechanizationGrowthRate: 0 };
        }
        const prevData = array[index - 1];
        const seedGrowthRate =
          ((data.improved_seed_use_pct - prevData.improved_seed_use_pct) / prevData.improved_seed_use_pct) * 100;
        const mechanizationGrowthRate =
          ((data.mechanization_units_per_1000_farms - prevData.mechanization_units_per_1000_farms) /
            prevData.mechanization_units_per_1000_farms) * 100;
        return {
          year: data.year,
          seedGrowthRate: Number.isFinite(seedGrowthRate) ? seedGrowthRate : 0,
          mechanizationGrowthRate: Number.isFinite(mechanizationGrowthRate) ? mechanizationGrowthRate : 0,
        };
      });
  }, [countryData]);

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError('Invalid country parameter');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/agric/APMD_ECOWAS_Input_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch forecast and simulation data');
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
        setError('Error loading forecast and simulation data');
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
      'Cereal Seeds (tons)': data.cereal_seeds_tons,
      'Fertilizer (tons)': data.fertilizer_tons,
      'Pesticides (liters)': data.pesticide_liters,
      'Input Subsidy Budget (USD)': data.input_subsidy_budget_usd,
      'Credit Access (%)': data.credit_access_pct,
      'Improved Seed Adoption Growth Rate (%)': growthData.find((g) => g.year === data.year)?.seedGrowthRate.toFixed(2) || 0,
      'Mechanization Growth Rate (%)': growthData.find((g) => g.year === data.year)?.mechanizationGrowthRate.toFixed(2) || 0,
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_forecast_simulation_data.csv`;
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
    pdf.save(`${country}_forecast_simulation_dashboard.pdf`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">Loading Forecast & Simulation...</p>
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
          aria-label={`Forecast & Simulation Overview for ${country}`}
        >
          <FaTractor aria-hidden="true" className="text-lg sm:text-xl" /> Forecast & Simulation -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          Simulated data for planning purposes (2006–2025). Validate before operational use.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label="Download forecast and simulation data as CSV"
          >
            <FaDownload /> Download CSV
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label="Download forecast and simulation dashboard as PDF"
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
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={`Total Input Usage Forecast for ${selectedYear}`}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">Total Input Usage ({selectedYear})</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">{totalInputUsage.toLocaleString()} units</p>
          </div>
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={`Input Subsidy Budget Forecast for ${selectedYear}`}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">Input Subsidy Budget ({selectedYear})</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">${selectedData?.input_subsidy_budget_usd.toLocaleString()}</p>
          </div>
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={`Credit Access Forecast for ${selectedYear}`}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">Credit Access ({selectedYear})</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">{selectedData?.credit_access_pct.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-full">
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label="Input Usage Forecast Trends Chart">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              Input Usage Forecast Trends (2006–{selectedYear})
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
                  dataKey="cereal_seeds_tons"
                  stroke="var(--olive-green)"
                  name="Cereal Seeds (tons)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="fertilizer_tons"
                  stroke="var(--wine)"
                  name="Fertilizer (tons)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="pesticide_liters"
                  stroke="#8884d8"
                  name="Pesticides (liters)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label="Financial Metrics Comparison Chart">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              Financial Metrics Comparison ({(country as string).charAt(0).toUpperCase() + (country as string).slice(1)})
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              Select Metric for Year Comparison
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as 'input_subsidy_budget_usd' | 'credit_access_pct')}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              <option value="input_subsidy_budget_usd">Input Subsidy Budget (USD)</option>
              <option value="credit_access_pct">Credit Access (%)</option>
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
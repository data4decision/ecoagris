// src/app/[country]/dashboard/agric/page.tsx
'use client';

// Import required dependencies
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
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
import { FaChartBar, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync'; // For CSV generation
import jsPDF from 'jspdf'; // For PDF generation
import html2canvas from 'html2canvas'; // For capturing DOM as image

// Define TypeScript interface for data structure
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
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Input_Data: InputData[];
}

export default function AgricOverview() {
  // Get dynamic country parameter from URL
  const { country } = useParams();
  // State for country-specific data, selected metric, loading, error, and latest year
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'fertilizer_kg_per_ha' | 'improved_seed_use_pct'>('fertilizer_kg_per_ha');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestYear, setLatestYear] = useState(2025);

  // Fetch data from JSON file
  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError('Invalid country parameter');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/agric/APMD_ECOWAS_Input_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch agricultural input data');
        const jsonData = (await response.json()) as Dataset;

        // Calculate the latest year dynamically
        const years = jsonData.Simulated_Input_Data.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setLatestYear(maxYear);

        // Filter data for the selected country
        const filteredCountryData = jsonData.Simulated_Input_Data.filter(
          (d) => d.country.toLowerCase() === (country as string).toLowerCase()
        );

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading agricultural input data');
        setLoading(false);
      }
    }

    fetchData();
  }, [country]);

  // Calculate total input usage for the latest year
  const latestData = countryData.find((d) => d.year === latestYear);
  const totalInputUsage = latestData
    ? latestData.cereal_seeds_tons + latestData.fertilizer_tons + latestData.pesticide_liters
    : 0;

  // Function to handle CSV download
  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => ({
      Year: data.year,
      'Cereal Seeds (tons)': data.cereal_seeds_tons,
      'Fertilizer (tons)': data.fertilizer_tons,
      'Pesticides (liters)': data.pesticide_liters,
      'Subsidy Budget (USD)': data.input_subsidy_budget_usd,
      'Credit Access (%)': data.credit_access_pct,
      'Stockout Days': data.stockouts_days_per_year,
      'Fertilizer Intensity (kg/ha)': data.fertilizer_kg_per_ha,
      'Improved Seed Adoption (%)': data.improved_seed_use_pct,
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_agric_input_data.csv`;
    link.click();
  };

  // Function to handle PDF download
  const handlePDFDownload = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) return;

    const canvas = await html2canvas(dashboard);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190; // A4 width in mm minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`${country}_agric_input_dashboard.pdf`);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)]">
        <div className="flex-1 p-6">
          <p className="text-[var(--dark-green)]">Loading Overview...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !latestData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)]">
        <div className="flex-1 p-6">
          <p className="text-[var(--wine)]">Error: {error || 'No data available for this country'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--white)]">
      <div className="flex-1 p-6" id="dashboard-content">
        {/* Page Header */}
        <h1
          className="text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={`Agricultural Inputs Overview for ${country}`}
        >
          <FaChartBar aria-hidden="true" /> Agricultural Inputs Overview -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4">
          Simulated data for planning purposes. Validate before operational use.
        </p>

        {/* Download Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleCSVDownload}
            className="flex items-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-4 py-2 rounded hover:bg-[var(--olive-green)]"
            aria-label="Download data as CSV"
          >
            <FaDownload /> Download CSV
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-4 py-2 rounded hover:bg-[var(--olive-green)]"
            aria-label="Download dashboard as PDF"
          >
            <FaDownload /> Download PDF
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--yellow)] p-4 rounded shadow" aria-label="Total Input Usage Card">
            <h3 className="text-[var(--dark-green)] font-semibold">Total Input Usage ({latestYear})</h3>
            <p className="text-[var(--wine)] text-lg">{totalInputUsage.toLocaleString()} units</p>
          </div>
          <div className="bg-[var(--yellow)] p-4 rounded shadow" aria-label="Subsidy Budget Card">
            <h3 className="text-[var(--dark-green)] font-semibold">Subsidy Budget ({latestYear})</h3>
            <p className="text-[var(--wine)] text-lg">${latestData.input_subsidy_budget_usd.toLocaleString()}</p>
          </div>
          <div className="bg-[var(--yellow)] p-4 rounded shadow" aria-label="Credit Access Card">
            <h3 className="text-[var(--dark-green)] font-semibold">Credit Access ({latestYear})</h3>
            <p className="text-[var(--wine)] text-lg">{latestData.credit_access_pct.toFixed(1)}%</p>
          </div>
          <div className="bg-[var(--yellow)] p-4 rounded shadow" aria-label="Stockout Days Card">
            <h3 className="text-[var(--dark-green)] font-semibold">Stockout Days ({latestYear})</h3>
            <p className="text-[var(--wine)] text-lg">{latestData.stockouts_days_per_year} days</p>
          </div>
          <div className="bg-[var(--yellow)] p-4 rounded shadow" aria-label="Fertilizer Intensity Card">
            <h3 className="text-[var(--dark-green)] font-semibold">Fertilizer Intensity ({latestYear})</h3>
            <p className="text-[var(--wine)] text-lg">{latestData.fertilizer_kg_per_ha.toFixed(1)} kg/ha</p>
          </div>
          <div className="bg-[var(--yellow)] p-4 rounded shadow" aria-label="Improved Seed Adoption Card">
            <h3 className="text-[var(--dark-green)] font-semibold">Improved Seed Adoption ({latestYear})</h3>
            <p className="text-[var(--wine)] text-lg">{latestData.improved_seed_use_pct.toFixed(1)}%</p>
          </div>
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Line Chart: Input Usage Trends */}
          <div className="bg-[var(--white)] p-4 rounded shadow" aria-label="Input Usage Trends Chart">
            <h2 className="text-lg font-semibold text-[var(--dark-green)] mb-2">
              Input Usage Trends (2006–{latestYear})
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cereal_seeds_tons"
                  stroke="var(--olive-green)"
                  name="Cereal Seeds (tons)"
                />
                <Line type="monotone" dataKey="fertilizer_tons" stroke="var(--wine)" name="Fertilizer (tons)" />
                <Line
                  type="monotone"
                  dataKey="pesticide_liters"
                  stroke="var(--dark-green)"
                  name="Pesticides (liters)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Year Comparison for Selected Country */}
          <div className="bg-[var(--white)] p-4 rounded shadow" aria-label="Year Comparison Chart">
            <h2 className="text-lg font-semibold text-[var(--dark-green)] mb-2">
              Year Comparison ({(country as string).charAt(0).toUpperCase() +(country as string).slice(1)})
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              Select Metric for Year Comparison
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as 'fertilizer_kg_per_ha' | 'improved_seed_use_pct')}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded"
            >
              <option value="fertilizer_kg_per_ha">Fertilizer Intensity (kg/ha)</option>
              <option value="improved_seed_use_pct">Improved Seed Adoption (%)</option>
            </select>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey={selectedMetric} fill="var(--olive-green)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
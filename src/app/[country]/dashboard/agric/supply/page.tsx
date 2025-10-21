'use client';

// Import required dependencies
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
import { FaTruck, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define TypeScript interface for data structure
interface InputData {
  country: string;
  year: number;
  cereal_seeds_tons?: number;
  fertilizer_tons?: number;
  pesticide_liters?: number;
  stockouts_days_per_year?: number;
  distribution_timeliness_pct?: number;
  agro_dealer_count?: number;
  local_production_inputs_tons?: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Input_Data: InputData[];
}

// Define available metrics for the bar chart
type SupplyChainMetric =
  | 'cereal_seeds_tons'
  | 'fertilizer_tons'
  | 'pesticide_liters'
  | 'stockouts_days_per_year'
  | 'distribution_timeliness_pct'
  | 'agro_dealer_count'
  | 'local_production_inputs_tons';

export default function SupplyChainPage() {
  // Get dynamic country parameter from URL
  const { country } = useParams();
  // State for country-specific data, selected metric, selected year, loading, error, and latest year
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<SupplyChainMetric>('stockouts_days_per_year');
  const [selectedYear, setSelectedYear] = useState<number>(2025); // Default to latest year
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestYear, setLatestYear] = useState(2025);

  // Define field metadata for display and formatting
  const supplyChainFields = [
    { key: 'cereal_seeds_tons', label: 'Cereal Seeds (tons)', format: (v: number) => v.toLocaleString() },
    { key: 'fertilizer_tons', label: 'Fertilizer (tons)', format: (v: number) => v.toLocaleString() },
    { key: 'pesticide_liters', label: 'Pesticides (liters)', format: (v: number) => v.toLocaleString() },
    { key: 'stockouts_days_per_year', label: 'Stockout Days', format: (v: number) => v.toLocaleString() },
    { key: 'distribution_timeliness_pct', label: 'Distribution Timeliness (%)', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'agro_dealer_count', label: 'Agro-Dealer Count', format: (v: number) => v.toLocaleString() },
    { key: 'local_production_inputs_tons', label: 'Local Production Inputs (tons)', format: (v: number) => v.toLocaleString() },
  ];

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
        if (!response.ok) throw new Error('Failed to fetch supply chain data');
        const jsonData = (await response.json()) as Dataset;

        // Calculate the latest year dynamically
        const years = jsonData.Simulated_Input_Data.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setLatestYear(maxYear);
        setSelectedYear(maxYear); // Set initial selected year to latest

        // Filter data for the selected country
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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading supply chain data');
        setLoading(false);
      }
    }

    fetchData();
  }, [country]);

  // Get unique years for dropdown
  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map((d) => d.year))).sort((a, b) => a - b);
  }, [countryData]);

  // Get data for the selected year
  const selectedData = countryData.find((d) => d.year === selectedYear);
  const totalInputAvailability = selectedData
    ? (selectedData.cereal_seeds_tons || 0) +
      (selectedData.fertilizer_tons || 0) +
      (selectedData.pesticide_liters || 0) +
      (selectedData.local_production_inputs_tons || 0)
    : 0;

  // Function to handle CSV download
  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => {
      const row: { [key: string]: string | number } = { Year: data.year };
      supplyChainFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : 'N/A';
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_supply_chain_data.csv`;
    link.click();
  };

  // Function to handle PDF download
  const handlePDFDownload = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) return;

    const canvas = await html2canvas(dashboard, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190; // A4 width in mm minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`${country}_supply_chain_dashboard.pdf`);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">Loading Supply Chain...</p>
        </div>
      </div>
    );
  }

  // Render error state
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
        {/* Page Header */}
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={`Supply Chain Overview for ${country}`}
        >
          <FaTruck aria-hidden="true" className="text-lg sm:text-xl" /> Supply Chain -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          Simulated data for planning purposes. Validate before operational use.
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label="Download supply chain data as CSV"
          >
            <FaDownload /> Download CSV
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label="Download supply chain dashboard as PDF"
          >
            <FaDownload /> Download PDF
          </button>
        </div>

        {/* Year Selection for Cards */}
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

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 max-w-full">
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={`Total Input Availability Card for ${selectedYear}`}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">Total Input Availability ({selectedYear})</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">{totalInputAvailability.toLocaleString()} units</p>
          </div>
          {supplyChainFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0"
              aria-label={`${field.label} Card for ${selectedYear}`}
            >
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{field.label} ({selectedYear})</h3>
              <p className="text-[var(--wine)] text-base sm:text-lg">
                {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : 'N/A'}
              </p>
            </div>
          ))}
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 gap-6 max-w-full">
          {/* Line Chart: Supply Chain Trends */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label="Supply Chain Trends Chart">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              Supply Chain Trends (2006–{latestYear})
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
                  stroke="var(--medium-green)"
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
                  stroke="var(--olive-green)"
                  name="Pesticides (liters)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="stockouts_days_per_year"
                  stroke="var(--dark-green)"
                  name="Stockout Days"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="distribution_timeliness_pct"
                  stroke="var(--yellow)"
                  name="Distribution Timeliness (%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="agro_dealer_count"
                  stroke="#4B0082"
                  name="Agro-Dealer Count"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="local_production_inputs_tons"
                  stroke="#FF4500"
                  name="Local Production Inputs (tons)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Year Comparison for Selected Country */}
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
              onChange={(e) => setSelectedMetric(e.target.value as SupplyChainMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {supplyChainFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
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
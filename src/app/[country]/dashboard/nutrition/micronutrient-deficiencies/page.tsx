// src/app/[country]/dashboard/nutrition/malnutrition/micronutrient-deficiencies/page.tsx
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
import { FaChartLine, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define TypeScript interfaces directly in the file
interface MicronutrientData {
  country: string;
  year: number;
  vitaminA_deficiency_children_pct?: number;
  iron_deficiency_women_pct?: number;
  prevalence_anaemia_women_pct?: number;
  vitaminA_supplementation_coverage_children_pct?: number;
  pregnant_women_receiving_iron_folic_acid_pct?: number;
  [key: string]: unknown; // Allow for other fields in the dataset
}

interface Dataset {
  Nutrition_Data: MicronutrientData[];
}

// Define available metrics for the bar chart
type MicronutrientMetric =
  | 'vitaminA_deficiency_children_pct'
  | 'iron_deficiency_women_pct'
  | 'prevalence_anaemia_women_pct'
  | 'vitaminA_supplementation_coverage_children_pct'
  | 'pregnant_women_receiving_iron_folic_acid_pct';

export default function MicronutrientDeficienciesPage() {
  // Get dynamic country parameter from URL
  const { country } = useParams();
  // State for country-specific data, selected metric, selected year, loading, error
  const [countryData, setCountryData] = useState<MicronutrientData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MicronutrientMetric>('vitaminA_deficiency_children_pct');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define field metadata for display and formatting
  const micronutrientFields = [
    { key: 'vitaminA_deficiency_children_pct', label: 'Vitamin A Deficiency in Children (%)', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'iron_deficiency_women_pct', label: 'Iron Deficiency in Women (%)', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'prevalence_anaemia_women_pct', label: 'Anemia Prevalence in Women (%)', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'vitaminA_supplementation_coverage_children_pct', label: 'Vitamin A Supplementation Coverage in Children (%)', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'pregnant_women_receiving_iron_folic_acid_pct', label: 'Pregnant Women Receiving Iron-Folic Acid (%)', format: (v: number) => `${v.toFixed(1)}%` },
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
        // Data Fetch Location: Load the micronutrient deficiencies dataset
        // Path: /data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json
        const response = await fetch('/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch micronutrient deficiencies data');
        const jsonData = (await response.json()) as Dataset;

        // Calculate the latest year dynamically
        const years = jsonData.Nutrition_Data.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setSelectedYear(maxYear);

        // Filter data for the selected country
        const filteredCountryData = jsonData.Nutrition_Data.filter(
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
        setError('Error loading micronutrient deficiencies data');
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

  // Function to handle CSV download
  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => {
      const row: { [key: string]: string | number } = { Year: data.year };
      micronutrientFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : 'N/A';
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_micronutrient_deficiencies.csv`;
    link.click();
  };

  // Function to handle PDF download
  const handlePDFDownload = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) return;

    const canvas = await html2canvas(dashboard, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`${country}_micronutrient_deficiencies_dashboard.pdf`);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">Loading Micronutrient Deficiencies Data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || 'No data available for this country'}</p>
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
          aria-label={`Micronutrient Deficiencies Overview for ${country}`}
        >
          <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" /> Micronutrient Deficiencies -{' '}
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
            aria-label="Download micronutrient deficiencies data as CSV"
          >
            <FaDownload /> Download CSV
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label="Download micronutrient deficiencies dashboard as PDF"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mb-6 max-w-full">
          {micronutrientFields.map((field) => (
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
          {/* Line Chart: Micronutrient Deficiency Trends */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label="Micronutrient Deficiency Trends Chart">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              Micronutrient Deficiency Trends (2006–{selectedYear})
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
                  dataKey="vitaminA_deficiency_children_pct"
                  stroke="var(--olive-green)"
                  name="Vitamin A Deficiency in Children (%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="iron_deficiency_women_pct"
                  stroke="var(--wine)"
                  name="Iron Deficiency in Women (%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="prevalence_anaemia_women_pct"
                  stroke="var(--yellow)"
                  name="Anemia Prevalence in Women (%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="vitaminA_supplementation_coverage_children_pct"
                  stroke="var(--medium-green)"
                  name="Vitamin A Supplementation Coverage (%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="pregnant_women_receiving_iron_folic_acid_pct"
                  stroke="var(--red)"
                  name="Pregnant Women Receiving Iron-Folic Acid (%)"
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
              onChange={(e) => setSelectedMetric(e.target.value as MicronutrientMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {micronutrientFields.map((field) => (
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
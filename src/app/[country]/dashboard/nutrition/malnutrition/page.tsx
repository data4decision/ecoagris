// pages/[country]/nutrition/malnutrition-indicators/index.tsx
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
import Head from 'next/head';


// Define available metrics for the bar chart
type MalnutritionMetric =
  | 'prevalence_undernourishment_pct'
  | 'prevalence_stunting_children_under5_pct'
  | 'prevalence_wasting_children_under5_pct'
  | 'prevalence_overweight_children_under5_pct'
  | 'prevalence_underweight_children_under5_pct'
  | 'adult_obesity_prevalence_pct'
  | 'adult_underweight_prevalence_pct'
  | 'child_obesity_prevalence_pct';

export default function MalnutritionIndicatorsPage() {
  // Get dynamic country parameter from URL
  const { country } = useParams();
  // State for country-specific data, selected metric, selected year, loading, and error
  const [countryData, setCountryData] = useState<NutritionData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MalnutritionMetric>('prevalence_undernourishment_pct');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define field metadata for display and formatting
  const malnutritionFields = [
    { key: 'prevalence_undernourishment_pct', label: 'Undernourishment (%)', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'prevalence_stunting_children_under5_pct', label: 'Stunting in Children Under 5 (%)', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'prevalence_wasting_children_under5_pct', label: 'Wasting in Children Under 5 (%)', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'prevalence_overweight_children_under5_pct', label: 'Overweight in Children Under 5 (%)', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'prevalence_underweight_children_under5_pct', label: 'Underweight in Children Under 5 (%)', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'child_obesity_prevalence_pct', label: 'Child Obesity (%)', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'adult_obesity_prevalence_pct', label: 'Adult Obesity (%)', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'adult_underweight_prevalence_pct', label: 'Adult Underweight (%)', format: (v: number) => `${v.toFixed(1)}%` },
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
        // Data Fetch Location: Load the nutrition dataset from the specified JSON file
        // Place the file in the public/data directory or adjust the path (e.g., to an API endpoint)
        const response = await fetch('/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch malnutrition indicators data');
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
        setError('Error loading malnutrition indicators data');
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
      malnutritionFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : 'N/A';
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_malnutrition_indicators.csv`;
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
    pdf.save(`${country}_malnutrition_indicators_dashboard.pdf`);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">Loading Malnutrition Indicators...</p>
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
    <>
      <Head>
        <title>Malnutrition Indicators in {country} - Nutrition Data 2006–2025</title>
        <meta name="description" content={`Explore malnutrition indicators for ${country} from 2006 to 2025.`} />
      </Head>
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content">
          {/* Page Header */}
          <h1
            className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
            aria-label={`Malnutrition Indicators Overview for ${country}`}
          >
            <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" /> Malnutrition Indicators -{' '}
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
              aria-label="Download malnutrition indicators data as CSV"
            >
              <FaDownload /> Download CSV
            </button>
            <button
              onClick={handlePDFDownload}
              className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
              aria-label="Download malnutrition indicators dashboard as PDF"
            >
              <FaDownload /> Download PDF
            </button>
          </div>

          {/* Year Selection for Table */}
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

          {/* Visualizations */}
          <div className="grid grid-cols-1 gap-6 max-w-full">
            {/* Line Chart: Malnutrition Trends */}
            <div
              className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden"
              aria-label="Malnutrition Trends Chart"
            >
              <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
                Malnutrition Trends (2006–{selectedYear})
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
                  <Tooltip contentStyle={{ fontSize: 12, backgroundColor: 'var(--white)', color: 'var(--dark-green)' }} />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                    className="hidden sm:block"
                  />
                  {malnutritionFields.map((field, index) => (
                    <Line
                      key={field.key}
                      type="monotone"
                      dataKey={field.key}
                      stroke={['var(--olive-green)', 'var(--wine)', 'var(--yellow)', 'var(--medium-green)', 'var(--red)', 'var(--dark-green)', 'var(--green)', 'var(--white)'][index % 8]}
                      name={field.label}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart: Year Comparison for Selected Indicator */}
            <div
              className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden"
              aria-label="Year Comparison Chart"
            >
              <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
                Year Comparison ({(country as string).charAt(0).toUpperCase() + (country as string).slice(1)})
              </h2>
              <label htmlFor="metric-select" className="sr-only">
                Select Metric for Year Comparison
              </label>
              <select
                id="metric-select"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as MalnutritionMetric)}
                className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
              >
                {malnutritionFields.map((field) => (
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
                  <Tooltip contentStyle={{ fontSize: 12, backgroundColor: 'var(--white)', color: 'var(--dark-green)' }} />
                  <Bar dataKey={selectedMetric} fill="var(--olive-green)" minPointSize={5} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table: Displays only the selected year's data */}
          <div
            className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-auto mt-6"
            aria-label="Malnutrition Indicators Data Table"
          >
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">Data Table ({selectedYear})</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--medium-green)]/90 text-[var(--white)]">
                  <th className="p-2 text-left text-sm sm:text-base">Indicator</th>
                  <th className="p-2 text-left text-sm sm:text-base">Value</th>
                </tr>
              </thead>
              <tbody>
                {malnutritionFields.map((field) => (
                  <tr key={field.key} className="border-b border-[var(--yellow)]">
                    <td className="p-2 text-[var(--olive-green)] text-sm sm:text-base">{field.label}</td>
                    <td className="p-2 text-[var(--olive-green)] text-sm sm:text-base">
                      {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
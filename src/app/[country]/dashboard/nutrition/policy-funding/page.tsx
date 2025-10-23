// src/app/[country]/dashboard/nutrition/malnutrition/policy-and-funding/page.tsx
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
import { FaChartLine, FaDownload, FaDollarSign, FaBalanceScale, FaUsers, FaClipboardCheck, FaHandHoldingUsd } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define TypeScript interfaces directly in the file
interface PolicyAndFundingData {
  country: string;
  year: number;
  nutrition_budget_spending_usd_per_capita?: number;
  nutrition_policy_score_index?: number;
  multisectoral_coordination_score?: number;
  national_nutrition_policy_implementation_pct?: number;
  donor_funding_for_nutrition_usd_million?: number;
  [key: string]: unknown; // Allow for other fields in the dataset
}

interface Dataset {
  Nutrition_Data: PolicyAndFundingData[];
}

// Define available metrics for the bar chart
type PolicyAndFundingMetric =
  | 'nutrition_budget_spending_usd_per_capita'
  | 'nutrition_policy_score_index'
  | 'multisectoral_coordination_score'
  | 'national_nutrition_policy_implementation_pct'
  | 'donor_funding_for_nutrition_usd_million';

export default function PolicyAndFundingPage() {
  // Get dynamic country parameter from URL
  const { country } = useParams();
  // State for country-specific data, selected metric, selected year, loading, error
  const [countryData, setCountryData] = useState<PolicyAndFundingData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<PolicyAndFundingMetric>('nutrition_budget_spending_usd_per_capita');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define field metadata for display and formatting
  const policyAndFundingFields = [
    {
      key: 'nutrition_budget_spending_usd_per_capita',
      label: 'Nutrition Budget Spending (USD per Capita)',
      format: (v: number) => `$${v.toFixed(2)}`,
      icon: <FaDollarSign className="text-[var(--dark-green)] text-lg" />,
    },
    {
      key: 'nutrition_policy_score_index',
      label: 'Nutrition Policy Score (Index)',
      format: (v: number) => v.toFixed(1),
      icon: <FaBalanceScale className="text-[var(--olive-green)] text-lg" />,
    },
    {
      key: 'multisectoral_coordination_score',
      label: 'Multisectoral Coordination Score',
      format: (v: number) => v.toFixed(1),
      icon: <FaUsers className="text-[var(--wine)] text-lg" />,
    },
    {
      key: 'national_nutrition_policy_implementation_pct',
      label: 'Nutrition Policy Implementation (%)',
      format: (v: number) => `${v.toFixed(1)}%`,
      icon: <FaClipboardCheck className="text-[var(--yellow)] text-lg" />,
    },
    {
      key: 'donor_funding_for_nutrition_usd_million',
      label: 'Donor Funding for Nutrition (USD Million)',
      format: (v: number) => `$${v.toFixed(1)}M`,
      icon: <FaHandHoldingUsd className="text-[var(--medium-green)] text-lg" />,
    },
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
        // Data Fetch Location: Load the policy and funding dataset
        // Path: /public/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json
        const response = await fetch('/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch policy and funding data: ${response.status} ${response.statusText}`);
        }
        const jsonData = (await response.json()) as Dataset;

        // Log sample data to verify fields
        console.log('Sample dataset record:', jsonData.Nutrition_Data[0]);

        // Validate dataset structure
        if (!jsonData.Nutrition_Data || !Array.isArray(jsonData.Nutrition_Data)) {
          throw new Error('Invalid dataset format: Nutrition_Data is missing or not an array');
        }

        // Calculate the latest year dynamically
        const years = jsonData.Nutrition_Data.map((d) => d.year).filter((y) => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years, 2025) : 2025;
        setSelectedYear(maxYear);

        // Filter data for the selected country
        const filteredCountryData = jsonData.Nutrition_Data.filter(
          (d) => d.country && d.country.toLowerCase() === (country as string).toLowerCase()
        );

        // Log filtered data to check values
        console.log(`Filtered data for ${country}:`, filteredCountryData);

        if (filteredCountryData.length === 0) {
          setError(`No data available for ${country}`);
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Error loading policy and funding data: ${(err as Error).message}`);
        setLoading(false);
      }
    }

    fetchData();
  }, [country]);

  // Get unique years for dropdown
  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map((d) => d.year).filter((y) => typeof y === 'number'))).sort((a, b) => a - b);
  }, [countryData]);

  // Get data for the selected year
  const selectedData = countryData.find((d) => d.year === selectedYear);

  // Function to handle CSV download
  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => {
      const row: { [key: string]: string | number } = { Year: data.year };
      policyAndFundingFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : 'N/A';
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_policy_and_funding_data.csv`;
    link.click();
  };

  // Function to handle PDF download
  const handlePDFDownload = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) {
      console.error('Dashboard content not found for PDF generation');
      return;
    }

    try {
      const canvas = await html2canvas(dashboard, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`${country}_policy_and_funding_dashboard.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">Loading Policy and Funding Data...</p>
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
          aria-label={`Policy and Funding Overview for ${country}`}
        >
          <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" /> Policy and Funding -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          Simulated data for planning purposes. Validate before operational use.
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download policy and funding data as CSV"
          >
            <FaDownload /> Download CSV
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download policy and funding dashboard as PDF"
          >
            <FaDownload /> Download PDF
          </button>
        </div>

        {/* Year Selection for Cards */}
        <div className="mb-6 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            Select Year for Metrics
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-[var(--olive-green)]"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 max-w-full">
          {policyAndFundingFields.map((field) => (
            <div
              key={field.key}
              className="bg-gradient-to-br from-[var(--white)] to-[var(--yellow)]/70 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 min-w-0"
              aria-label={`${field.label} Card for ${selectedYear}`}
            >
              <div className="flex items-center gap-3 mb-2">
                {field.icon}
                <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base leading-tight">{field.label}</h3>
              </div>
              <p className="text-[var(--wine)] text-lg sm:text-2xl font-bold">
                {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : 'N/A'}
              </p>
              <p className="text-[var(--olive-green)] text-xs sm:text-sm mt-1">Year: {selectedYear}</p>
            </div>
          ))}
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 gap-6 max-w-full">
          {/* Line Chart: Policy and Funding Trends */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded-lg shadow min-w-0 overflow-x-hidden" aria-label="Policy and Funding Trends Chart">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              Policy and Funding Trends (2006–{selectedYear})
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
                  dataKey="nutrition_budget_spending_usd_per_capita"
                  stroke="var(--olive-green)"
                  name="Nutrition Budget (USD per Capita)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="nutrition_policy_score_index"
                  stroke="var(--wine)"
                  name="Policy Score (Index)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="multisectoral_coordination_score"
                  stroke="var(--yellow)"
                  name="Coordination Score"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="national_nutrition_policy_implementation_pct"
                  stroke="var(--medium-green)"
                  name="Policy Implementation (%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="donor_funding_for_nutrition_usd_million"
                  stroke="var(--red)"
                  name="Donor Funding (USD Million)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Year Comparison for Selected Country */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded-lg shadow min-w-0 overflow-x-hidden" aria-label="Year Comparison Chart">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              Year Comparison ({(country as string).charAt(0).toUpperCase() + (country as string).slice(1)})
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              Select Metric for Year Comparison
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as PolicyAndFundingMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-[var(--olive-green)]"
            >
              {policyAndFundingFields.map((field) => (
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
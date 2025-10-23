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
import { FaDollarSign, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define TypeScript interfaces
interface MacroData {
  country: string;
  year: number;
  cpi_inflation_pct: number;
  fiscal_deficit_pct_gdp: number;
  public_debt_pct_gdp: number;
  exchange_rate_local_per_usd: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Macro_Data: MacroData[];
}

// Define available metrics for the bar chart
type MacroMetric = 'cpi_inflation_pct' | 'fiscal_deficit_pct_gdp' | 'public_debt_pct_gdp' | 'exchange_rate_local_per_usd';

export default function FiscalMonetaryYearTrendPage() {
  // Get dynamic country parameter from URL
  const { country } = useParams();
  // State for country-specific data, selected metric, selected year, loading, error
  const [countryData, setCountryData] = useState<MacroData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MacroMetric>('cpi_inflation_pct');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define field metadata for display and formatting
  const fiscalMonetaryFields = [
    {
      key: 'cpi_inflation_pct',
      label: 'CPI Inflation (%)',
      format: (v: number) => `${v.toFixed(2)}%`,
      icon: <FaDollarSign className="text-[var(--dark-green)] text-lg" />,
    },
    {
      key: 'fiscal_deficit_pct_gdp',
      label: 'Fiscal Deficit (% of GDP)',
      format: (v: number) => `${v.toFixed(2)}%`,
      icon: <FaDollarSign className="text-[var(--olive-green)] text-lg" />,
    },
    {
      key: 'public_debt_pct_gdp',
      label: 'Public Debt (% of GDP)',
      format: (v: number) => `${v.toFixed(2)}%`,
      icon: <FaDollarSign className="text-[var(--wine)] text-lg" />,
    },
    {
      key: 'exchange_rate_local_per_usd',
      label: 'Exchange Rate (Local/USD)',
      format: (v: number) => v.toFixed(3),
      icon: <FaDollarSign className="text-[var(--yellow)] text-lg" />,
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
        const response = await fetch('/data/macro/WestAfrica_Macro_Simulated_2006_2025.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch macro data: ${response.status} ${response.statusText}`);
        }
        const jsonData = (await response.json()) as Dataset;

        console.log('Sample dataset record:', jsonData.Simulated_Macro_Data[0]);

        if (!jsonData.Simulated_Macro_Data || !Array.isArray(jsonData.Simulated_Macro_Data)) {
          throw new Error('Invalid dataset format: Simulated_Macro_Data is missing or not an array');
        }

        const filteredCountryData = jsonData.Simulated_Macro_Data.filter(
          (d) => d.country && d.country.toLowerCase() === (country as string).toLowerCase()
        );

        console.log(`Filtered data for ${country}:`, filteredCountryData);

        if (filteredCountryData.length === 0) {
          setError(`No data available for ${country}`);
          setLoading(false);
          return;
        }

        const years = filteredCountryData.map((d) => d.year).filter((y) => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years, 2025) : 2025;
        setSelectedYear(maxYear);

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Error loading macro data: ${(err as Error).message}`);
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
      fiscalMonetaryFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : 'N/A';
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_fiscal_monetary_year_trend.csv`;
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
      pdf.save(`${country}_fiscal_monetary_year_trend.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">Loading Fiscal and Monetary Policy Year Trend...</p>
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
          aria-label={`Fiscal and Monetary Policy Year Trend for ${country}`}
        >
          <FaDollarSign aria-hidden="true" className="text-lg sm:text-xl" />
          Fiscal and Monetary Policy Year Trend - {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          Simulated data for planning purposes. Validate before operational use.
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download fiscal and monetary policy year trend data as CSV"
          >
            <FaDownload /> Download CSV
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download fiscal and monetary policy year trend dashboard as PDF"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 max-w-full">
          {fiscalMonetaryFields.map((field) => (
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
          {/* Line Chart: Fiscal and Monetary Policy Trends */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded-lg shadow min-w-0 overflow-x-hidden" aria-label="Fiscal and Monetary Policy Trends Chart">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              Fiscal and Monetary Policy Trends (2006–{selectedYear})
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
                  dataKey="cpi_inflation_pct"
                  stroke="var(--olive-green)"
                  name="CPI Inflation (%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="fiscal_deficit_pct_gdp"
                  stroke="var(--wine)"
                  name="Fiscal Deficit (% of GDP)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="public_debt_pct_gdp"
                  stroke="var(--yellow)"
                  name="Public Debt (% of GDP)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="exchange_rate_local_per_usd"
                  stroke="var(--dark-green)"
                  name="Exchange Rate (Local/USD)"
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
              onChange={(e) => setSelectedMetric(e.target.value as MacroMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-[var(--olive-green)]"
            >
              {fiscalMonetaryFields.map((field) => (
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
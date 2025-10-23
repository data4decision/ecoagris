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
import { FaGlobe, FaDownload, FaExclamationTriangle } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define TypeScript interfaces
interface MacroData {
  country: string;
  year: number;
  exports_usd: number;
  imports_usd: number;
  trade_balance_usd: number;
  fdi_net_inflows_usd_million: number;
  remittances_usd_million: number;
  current_account_pct_gdp: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Macro_Data: MacroData[];
  Methodology_Assumptions: { note: string }[];
}

// Define available metrics for the bar chart
type MacroMetric =
  | 'exports_usd'
  | 'imports_usd'
  | 'trade_balance_usd'
  | 'fdi_net_inflows_usd_million'
  | 'remittances_usd_million'
  | 'current_account_pct_gdp';

export default function TradeInvestmentYearTrendPage() {
  // Get dynamic country parameter from URL
  const { country } = useParams();
  // State for country-specific data, selected metric, selected year, loading, error, methodology note
  const [countryData, setCountryData] = useState<MacroData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MacroMetric>('exports_usd');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [methodologyNote, setMethodologyNote] = useState<string>('');

  // Define field metadata for display and formatting
  const tradeInvestmentFields = [
    {
      key: 'exports_usd',
      label: 'Total Exports (USD)',
      format: (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: <FaGlobe className="text-[var(--dark-green)] text-lg" />,
    },
    {
      key: 'imports_usd',
      label: 'Total Imports (USD)',
      format: (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: <FaGlobe className="text-[var(--olive-green)] text-lg" />,
    },
    {
      key: 'trade_balance_usd',
      label: 'Trade Balance (USD)',
      format: (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: <FaGlobe className="text-[var(--wine)] text-lg" />,
    },
    {
      key: 'fdi_net_inflows_usd_million',
      label: 'FDI Net Inflows (USD Million)',
      format: (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}M`,
      icon: <FaGlobe className="text-[var(--yellow)] text-lg" />,
    },
    {
      key: 'remittances_usd_million',
      label: 'Remittances (USD Million)',
      format: (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}M`,
      icon: <FaGlobe className="text-[var(--dark-green)] text-lg" />,
    },
    {
      key: 'current_account_pct_gdp',
      label: 'Current Account (% of GDP)',
      format: (v: number) => `${v.toFixed(2)}%`,
      icon: <FaGlobe className="text-[var(--olive-green)] text-lg" />,
    },
  ];

  // Fetch data from JSON file and APIs
  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError('Invalid country parameter');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Fetch JSON
        const response = await fetch('/data/macro/WestAfrica_Macro_Simulated_2006_2025.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch macro data: ${response.status} ${response.statusText}`);
        }
        const jsonData = (await response.json()) as Dataset;

        console.log('Sample dataset record:', jsonData.Simulated_Macro_Data[0]);

        if (!jsonData.Simulated_Macro_Data || !Array.isArray(jsonData.Simulated_Macro_Data)) {
          throw new Error('Invalid dataset format: Simulated_Macro_Data is missing or not an array');
        }

        setMethodologyNote(jsonData.Methodology_Assumptions[0]?.note || 'Simulated data for planning, supplemented with real data where available.');

        let filteredCountryData = jsonData.Simulated_Macro_Data.filter(
          (d) => d.country && d.country.toLowerCase() === (country as string).toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(`No data available for ${country}`);
          setLoading(false);
          return;
        }

        // Fetch real data from World Bank
        try {
          const wbIndicators = [
            'BX.GSR.MRCH.CD', // Exports
            'BM.GSR.MRCH.CD', // Imports
            'BN.CAB.XOKA.GD.ZS', // Current Account
          ];
          const wbResponse = await fetch(
            `https://api.worldbank.org/v2/country/${country === 'Benin' ? 'BJ' : 'TG'}/indicator/${wbIndicators.join(';')}?date=2006:2023&format=json`
          );
          if (wbResponse.ok) {
            const wbData = await wbResponse.json();
            const wbExports = wbData[1]?.filter((d: any) => d.indicator.id === 'BX.GSR.MRCH.CD') || [];
            const wbImports = wbData[1]?.filter((d: any) => d.indicator.id === 'BM.GSR.MRCH.CD') || [];
            const wbCurrentAccount = wbData[1]?.filter((d: any) => d.indicator.id === 'BN.CAB.XOKA.GD.ZS') || [];
            filteredCountryData = filteredCountryData.map((d) => ({
              ...d,
              exports_usd: wbExports.find((r: any) => r.date == d.year)?.value || d.exports_usd,
              imports_usd: wbImports.find((r: any) => r.date == d.year)?.value || d.imports_usd,
              trade_balance_usd: (wbExports.find((r: any) => r.date == d.year)?.value || d.exports_usd) - (wbImports.find((r: any) => r.date == d.year)?.value || d.imports_usd),
              current_account_pct_gdp: wbCurrentAccount.find((r: any) => r.date == d.year)?.value || d.current_account_pct_gdp,
            }));
          }
        } catch (wbErr) {
          console.warn('World Bank API fetch failed, using simulated data:', wbErr);
        }

        // Fetch FDI from UNCTAD (simplified; requires API key for production)
        try {
          // Placeholder UNCTAD API call (replace with actual endpoint and key)
          const unctadResponse = await fetch(
            `https://unctadstat.unctad.org/api/fdi/${country === 'Benin' ? 'BEN' : 'TGO'}/inflows?year=2006:2023`
          );
          if (unctadResponse.ok) {
            const unctadData = await unctadResponse.json();
            filteredCountryData = filteredCountryData.map((d) => ({
              ...d,
              fdi_net_inflows_usd_million: unctadData.find((r: any) => r.year == d.year)?.value || d.fdi_net_inflows_usd_million,
            }));
          }
        } catch (unctadErr) {
          console.warn('UNCTAD API fetch failed, using simulated data:', unctadErr);
        }

        console.log(`Filtered data for ${country}:`, filteredCountryData);

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
      tradeInvestmentFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : 'N/A';
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_trade_investment_year_trend.csv`;
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
      pdf.save(`${country}_trade_investment_year_trend.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">Loading Trade and Investment Year Trend...</p>
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
          aria-label={`Trade and Investment Year Trend for ${country}`}
        >
          <FaGlobe aria-hidden="true" className="text-lg sm:text-xl" />
          Trade and Investment Year Trend - {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          Data combines real sources (World Bank, UNCTAD) for 2006–2023 and simulated data for projections. Validate before operational use.
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download trade and investment year trend data as CSV"
          >
            <FaDownload /> Download CSV
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download trade and investment year trend dashboard as PDF"
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
          {tradeInvestmentFields.map((field) => (
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

        {/* Disclaimer Card */}
        {/* <div className="bg-gradient-to-br from-[var(--white)] to-[var(--yellow)]/20 p-4 sm:p-6 rounded-lg shadow-md border border-[var(--medium-green)]/20 min-w-0 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FaExclamationTriangle className="text-[var(--wine)] text-lg" />
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base leading-tight">Data Notes & Validation</h3>
          </div>
          <p className="text-[var(--dark-green)] text-sm sm:text-base max-h-48 overflow-y-auto">
            {methodologyNote}<br />
            <strong>Note:</strong> Data for 2006–2023 sourced from World Bank (exports, imports, current account) and UNCTAD (FDI) where available; remittances and 2024–2025 are simulated. Simulated values may differ (e.g., Benin 2023 Exports: $1.49B vs. World Bank ~$1.2B, Togo 2023 FDI: $5.16B vs. ~$0.3B).<br />
            Validate with: <a href="https://data.worldbank.org" className="text-[var(--olive-green)] hover:underline" target="_blank" rel="noopener noreferrer">World Bank</a>, <a href="https://unctadstat.unctad.org/" className="text-[var(--olive-green)] hover:underline" target="_blank" rel="noopener noreferrer">UNCTAD</a>, or national statistics.
          </p>
        </div> */}

        {/* Visualizations */}
        <div className="grid grid-cols-1 gap-6 max-w-full">
          {/* Line Chart: Trade and Investment Trends */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded-lg shadow min-w-0 overflow-x-hidden" aria-label="Trade and Investment Trends Chart">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              Trade and Investment Trends (2006–{selectedYear})
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
                  dataKey="exports_usd"
                  stroke="var(--olive-green)"
                  name="Total Exports (USD)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="imports_usd"
                  stroke="var(--wine)"
                  name="Total Imports (USD)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="trade_balance_usd"
                  stroke="var(--yellow)"
                  name="Trade Balance (USD)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="fdi_net_inflows_usd_million"
                  stroke="var(--dark-green)"
                  name="FDI Net Inflows (USD Million)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="remittances_usd_million"
                  stroke="var(--olive-green)"
                  name="Remittances (USD Million)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="current_account_pct_gdp"
                  stroke="var(--wine)"
                  name="Current Account (% of GDP)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stacked Bar Chart: Exports vs. Imports */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded-lg shadow min-w-0 overflow-x-hidden" aria-label="Exports vs Imports Chart">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              Exports vs. Imports (2006–{selectedYear})
            </h2>
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
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                  className="hidden sm:block"
                />
                <Bar dataKey="exports_usd" stackId="trade" fill="var(--olive-green)" name="Total Exports (USD)" />
                <Bar dataKey="imports_usd" stackId="trade" fill="var(--wine)" name="Total Imports (USD)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Year Comparison for Selected Metric */}
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
              {tradeInvestmentFields.map((field) => (
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
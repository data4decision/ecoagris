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
  ResponsiveContainer,
} from 'recharts';
import { FaDownload, FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { GiWheat } from 'react-icons/gi';
import { stringify } from 'csv-stringify/sync';

interface InputData {
  country: string;
  year: number;
  distribution_timeliness_pct?: number;
  input_price_index_2006_base?: number;
  agro_dealer_count?: number;
  input_import_value_usd?: number;
  local_production_inputs_tons?: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Input_Data: InputData[];
}

export default function InputMetricsPage() {
  const { country } = useParams();
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPercentageChart, setShowPercentageChart] = useState(true);
  const [showValueChart, setShowValueChart] = useState(true);

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError('Invalid country parameter');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/agric/APMD_ECOWAS_Input_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch input metrics data');
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
        setError('Error loading input metrics data');
        setLoading(false);
      }
    }

    fetchData();
  }, [country]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map((d) => d.year))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find((d) => d.year === selectedYear);

  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => ({
      Year: data.year,
      'Distribution Timeliness (%)': data.distribution_timeliness_pct ?? 'N/A',
      'Input Price Index (2006 Base)': data.input_price_index_2006_base ?? 'N/A',
      'Agro-Dealer Count': data.agro_dealer_count ?? 'N/A',
      'Input Import Value (USD)': data.input_import_value_usd ?? 'N/A',
      'Local Production Inputs (tons)': data.local_production_inputs_tons ?? 'N/A',
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_input_metrics.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--dark-green)] text-lg font-medium">Loading Input Metrics...</p>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--wine)] text-lg font-medium">Error: {error || 'No data available for this country'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--white)]">
      {/* Header Bar */}
      <header className="bg-[var(--medium-green)] text-[var(--white)] p-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10">
        <h1
          className="text-xl sm:text-2xl font-bold flex items-center gap-2"
          aria-label={`Input Metrics for ${country}`}
        >
          <GiWheat className="text-2xl" /> Input Metrics -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 rounded bg-[var(--white)] text-[var(--dark-green)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
            aria-label="Select Year"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            onClick={handleCSVDownload}
            className="bg-[var(--medium-green)] text-[var(--white)] px-3 py-2 rounded flex items-center gap-2 hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-colors"
            aria-label="Download input metrics as CSV"
          >
            <FaDownload /> Download CSV
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 max-w-4xl mx-auto">
        <p className="text-[var(--olive-green)] mb-6 text-sm sm:text-base italic">
          Simulated data for planning purposes (2006–2025). Validate before operational use.
        </p>

        {/* Percentage-Based Metrics Chart */}
        <section className="bg-[var(--white)] p-4 rounded-lg mb-6 border-l-4 border-[var(--medium-green)]">
          <button
            onClick={() => setShowPercentageChart(!showPercentageChart)}
            className="w-full text-left text-[var(--dark-green)] font-semibold text-lg sm:text-xl flex items-center justify-between mb-2 hover:text-[var(--yellow)]"
            aria-expanded={showPercentageChart}
            aria-controls="percentage-metrics-chart"
          >
            Percentage-Based Metrics Trends (2006–{selectedYear})
            {showPercentageChart ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showPercentageChart && (
            <ResponsiveContainer width="100%" height={400} className="sm:h-[250px]" id="percentage-metrics-chart">
              <LineChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="year"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  interval="preserveStartEnd"
                  height={50}
                  className="sm:text-[14px] sm:angle-0 sm:text-anchor-middle"
                />
                <YAxis fontSize={12} className="sm:text-[14px]" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: '8px' }} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                  className="hidden sm:block"
                />
                <Line
                  type="monotone"
                  dataKey="distribution_timeliness_pct"
                  stroke="var(--medium-green)"
                  name="Distribution Timeliness (%)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="input_price_index_2006_base"
                  stroke="var(--wine)"
                  name="Input Price Index (2006 Base)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* Value-Based Metrics Chart */}
        <section className="bg-[var(--white)] p-4 rounded-lg mb-6 border-l-4 border-[var(--medium-green)]">
          <button
            onClick={() => setShowValueChart(!showValueChart)}
            className="w-full text-left text-[var(--dark-green)] font-semibold text-lg sm:text-xl flex items-center justify-between mb-2 hover:text-[var(--yellow)]"
            aria-expanded={showValueChart}
            aria-controls="value-metrics-chart"
          >
            Value-Based Metrics Trends (2006–{selectedYear})
            {showValueChart ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showValueChart && (
            <ResponsiveContainer width="100%" height={400} className="sm:h-[250px]" id="value-metrics-chart">
              <LineChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="year"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  interval="preserveStartEnd"
                  height={50}
                  className="sm:text-[14px] sm:angle-0 sm:text-anchor-middle"
                />
                <YAxis fontSize={12} className="sm:text-[14px]" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: '8px' }} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                  className="hidden sm:block"
                />
                <Line
                  type="monotone"
                  dataKey="agro_dealer_count"
                  stroke="var(--medium-green)"
                  name="Agro-Dealer Count"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="input_import_value_usd"
                  stroke="var(--wine)"
                  name="Input Import Value (USD)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="local_production_inputs_tons"
                  stroke="var(--olive-green)"
                  name="Local Production Inputs (tons)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* Data Summary Table */}
        <section className="bg-[var(--white)] p-4 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--dark-green)] mb-4 flex items-center gap-2">
            Data Summary for {selectedYear}
            <FaInfoCircle className="text-[var(--olive-green)] text-sm" title="Key input metrics for the selected year" />
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base text-[var(--wine)] border-collapse border border-[var(--yellow)]">
              <thead>
                <tr className="bg-[var(--medium-green)] text-[var(--white)]">
                  <th className="border border-[var(--yellow)] p-2 text-left">Metric</th>
                  <th className="border border-[var(--yellow)] p-2 text-left">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[var(--yellow)] p-2">Distribution Timeliness (%)</td>
                  <td className="border border-[var(--yellow)] p-2">
                    {selectedData.distribution_timeliness_pct != null ? `${selectedData.distribution_timeliness_pct.toFixed(1)}%` : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-[var(--yellow)] p-2">Input Price Index (2006 Base)</td>
                  <td className="border border-[var(--yellow)] p-2">
                    {selectedData.input_price_index_2006_base != null ? selectedData.input_price_index_2006_base.toFixed(2) : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-[var(--yellow)] p-2">Agro-Dealer Count</td>
                  <td className="border border-[var(--yellow)] p-2">
                    {selectedData.agro_dealer_count != null ? selectedData.agro_dealer_count.toLocaleString() : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-[var(--yellow)] p-2">Input Import Value (USD)</td>
                  <td className="border border-[var(--yellow)] p-2">
                    {selectedData.input_import_value_usd != null ? `$${selectedData.input_import_value_usd.toLocaleString()}` : 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-[var(--yellow)] p-2">Local Production Inputs (tons)</td>
                  <td className="border border-[var(--yellow)] p-2">
                    {selectedData.local_production_inputs_tons != null ? selectedData.local_production_inputs_tons.toLocaleString() : 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
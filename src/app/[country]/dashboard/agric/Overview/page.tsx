'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { GiWheat } from 'react-icons/gi';
import { FaDownload, FaChevronDown, FaChevronUp, FaChartLine, FaTruck } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';

interface InputData {
  country: string;
  year: number;
  cereal_seeds_tons?: number;
  fertilizer_tons?: number;
  pesticide_liters?: number;
  input_subsidy_budget_usd?: number;
  credit_access_pct?: number;
  stockouts_days_per_year?: number;
  fertilizer_kg_per_ha?: number;
  improved_seed_use_pct?: number;
  mechanization_units_per_1000_farms?: number;
  distribution_timeliness_pct?: number;
  input_price_index_2006_base?: number;
  agro_dealer_count?: number;
  input_import_value_usd?: number;
  local_production_inputs_tons?: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Input_Data: InputData[];
  Methodology_Assumptions?: {
    data_source?: string;
    simulation_method?: string;
    assumptions?: string[];
  };
}

export default function OverviewPage() {
  const { country } = useParams();
  const router = useRouter();
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSupplyChain, setShowSupplyChain] = useState(true);
  const [showEconomicIndicator, setShowEconomicIndicator] = useState(true);
  const [showAdoptionMechanisation, setShowAdoptionMechanisation] = useState(true);
  const [showForecastSimulation, setShowForecastSimulation] = useState(true);
  const [showInputMetric, setShowInputMetric] = useState(true);

  const dataFields = [
    { key: 'cereal_seeds_tons', label: 'Cereal Seeds (tons)', menu: 'Supply Chain', format: (v: number) => v.toLocaleString() },
    { key: 'fertilizer_tons', label: 'Fertilizer (tons)', menu: 'Supply Chain', format: (v: number) => v.toLocaleString() },
    { key: 'pesticide_liters', label: 'Pesticides (liters)', menu: 'Supply Chain', format: (v: number) => v.toLocaleString() },
    { key: 'input_subsidy_budget_usd', label: 'Subsidy Budget (USD)', menu: 'Economic Indicator', format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'credit_access_pct', label: 'Credit Access (%)', menu: 'Economic Indicator', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'stockouts_days_per_year', label: 'Stockout Days', menu: 'Supply Chain', format: (v: number) => v.toLocaleString() },
    { key: 'fertilizer_kg_per_ha', label: 'Fertilizer Intensity (kg/ha)', menu: 'Adoption & Mechanisation', format: (v: number) => v.toFixed(1) },
    { key: 'improved_seed_use_pct', label: 'Improved Seed Adoption (%)', menu: 'Adoption & Mechanisation', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'mechanization_units_per_1000_farms', label: 'Mechanization (Units/1,000 Farms)', menu: 'Adoption & Mechanisation', format: (v: number) => v.toFixed(1) },
    { key: 'distribution_timeliness_pct', label: 'Distribution Timeliness (%)', menu: 'Supply Chain', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'input_price_index_2006_base', label: 'Input Price Index (2006 Base)', menu: 'Economic Indicator', format: (v: number) => v.toFixed(2) },
    { key: 'agro_dealer_count', label: 'Agro-Dealer Count', menu: 'Supply Chain', format: (v: number) => v.toLocaleString() },
    { key: 'input_import_value_usd', label: 'Input Import Value (USD)', menu: 'Economic Indicator', format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'local_production_inputs_tons', label: 'Local Production Inputs (tons)', menu: 'Supply Chain', format: (v: number) => v.toLocaleString() },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError('Invalid country parameter');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/agric/APMD_ECOWAS_Input_Simulated_2006_2025.json');
        if (!response.ok) throw new Error('Failed to fetch data');
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
        setError('Error loading data');
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
    const csvData = countryData.map((data) => {
      const row: { [key: string]: string | number } = { Year: data.year };
      dataFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : 'N/A';
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_overview.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--dark-green)] text-lg font-medium">Loading Overview...</p>
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
    <div className="min-h-screen bg-[var(--white)] font-sans">
      {/* Header */}
      <header className="bg-[var(--medium-green)] text-[var(--white)] p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-2">
          <GiWheat className="text-2xl sm:text-3xl" />
          <h1 className="text-xl sm:text-2xl font-bold">Overview - {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 rounded bg-[var(--white)] text-[var(--dark-green)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            onClick={handleCSVDownload}
            className="flex items-center gap-2 bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-opacity-90 transition-colors"
          >
            <FaDownload /> Download CSV
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <p className="text-[var(--olive-green)] mb-6 text-sm sm:text-base italic">
          Simulated data for planning purposes (2006–2025). Validate before operational use.
        </p>

        {/* Supply Chain Section */}
        <section className="mb-6">
          <button
            onClick={() => setShowSupplyChain(!showSupplyChain)}
            className="w-full flex justify-between items-center p-4 bg-[var(--medium-green)] text-[var(--white)] rounded-t-lg font-semibold text-lg sm:text-xl hover:bg-opacity-90 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FaTruck className="text-white" /> Supply Chain
            </span>
            {showSupplyChain ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showSupplyChain && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-[var(--white)] rounded-b-lg shadow-md">
              {dataFields
                .filter((field) => field.menu === 'Supply Chain')
                .map((field) => (
                  <div
                    key={field.key}
                    className="bg-[var(--yellow)] p-3 sm:p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-[var(--dark-green)] font-medium text-sm sm:text-base">{field.label}</h3>
                    <p className="text-[var(--wine)] text-xl sm:text-2xl font-bold">
                      {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : 'N/A'}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Economic Indicator Section */}
        <section className="mb-6">
          <button
            onClick={() => setShowEconomicIndicator(!showEconomicIndicator)}
            className="w-full flex justify-between items-center p-4 bg-[var(--medium-green)] text-[var(--white)] rounded-t-lg font-semibold text-lg sm:text-xl hover:bg-opacity-90 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FaChartLine className="text-white" /> Economic Indicator
            </span>
            {showEconomicIndicator ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showEconomicIndicator && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 p-4 bg-[var(--white)] rounded-b-lg shadow-md">
              {dataFields
                .filter((field) => field.menu === 'Economic Indicator')
                .map((field) => (
                  <div
                    key={field.key}
                    className="bg-[var(--yellow)] p-3 sm:p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-[var(--dark-green)] font-medium text-sm sm:text-base">{field.label}</h3>
                    <p className="text-[var(--wine)] text-xl sm:text-2xl font-bold">
                      {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : 'N/A'}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Adoption & Mechanisation Section */}
        <section className="mb-6">
          <button
            onClick={() => setShowAdoptionMechanisation(!showAdoptionMechanisation)}
            className="w-full flex justify-between items-center p-4 bg-[var(--medium-green)] text-[var(--white)] rounded-t-lg font-semibold text-lg sm:text-xl hover:bg-opacity-90 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FaChartLine className="text-white" /> Adoption & Mechanisation
            </span>
            {showAdoptionMechanisation ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showAdoptionMechanisation && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-[var(--white)] rounded-b-lg shadow-md">
              {dataFields
                .filter((field) => field.menu === 'Adoption & Mechanisation')
                .map((field) => (
                  <div
                    key={field.key}
                    className="bg-[var(--yellow)] p-3 sm:p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-[var(--dark-green)] font-medium text-sm sm:text-base">{field.label}</h3>
                    <p className="text-[var(--wine)] text-xl sm:text-2xl font-bold">
                      {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : 'N/A'}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Forecast and Simulation Section */}
        <section className="mb-6">
          <button
            onClick={() => setShowForecastSimulation(!showForecastSimulation)}
            className="w-full flex justify-between items-center p-4 bg-[var(--medium-green)] text-[var(--white)] rounded-t-lg font-semibold text-lg sm:text-xl hover:bg-opacity-90 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FaChartLine className="text-white" /> Forecast and Simulation
            </span>
            {showForecastSimulation ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showForecastSimulation && (
            <div className="p-4 bg-[var(--white)] rounded-b-lg shadow-md">
              <p className="text-[var(--wine)] text-sm sm:text-base">
                The dataset provides simulated trends for agricultural inputs from 2006 to 2025. For detailed forecasts and
                simulations, visit the{' '}
                <button
                  onClick={() => router.push(`/${country}/dashboard/agric/forecast-simulation`)}
                  className="text-[var(--medium-green)] hover:text-[var(--yellow)] underline"
                >
                  Forecast and Simulation page
                </button>.
              </p>
            </div>
          )}
        </section>

        {/* Input Metric Section */}
        <section className="mb-6">
          <button
            onClick={() => setShowInputMetric(!showInputMetric)}
            className="w-full flex justify-between items-center p-4 bg-[var(--medium-green)] text-[var(--white)] rounded-t-lg font-semibold text-lg sm:text-xl hover:bg-opacity-90 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FaChartLine className="text-white" /> Input Metric
            </span>
            {showInputMetric ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showInputMetric && (
            <div className="p-4 bg-[var(--white)] rounded-b-lg shadow-md">
              <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                Summary of all input metrics for {selectedYear}. For detailed trends, visit the{' '}
                <button
                  onClick={() => router.push(`/${country}/dashboard/agric/input-metric`)}
                  className="text-[var(--medium-green)] hover:text-[var(--yellow)] underline"
                >
                  Input Metrics page
                </button>.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm sm:text-base text-[var(--wine)] border-collapse">
                  <thead>
                    <tr className="bg-[var(--medium-green)] text-[var(--white)]">
                      <th className="p-2 text-left border-b border-[var(--yellow)]">Metric</th>
                      <th className="p-2 text-left border-b border-[var(--yellow)]">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataFields.map((field) => (
                      <tr key={field.key} className="hover:bg-[var(--yellow)]/20 transition-colors">
                        <td className="p-2 border-b border-[var(--yellow)]">{field.label}</td>
                        <td className="p-2 border-b border-[var(--yellow)]">
                          {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
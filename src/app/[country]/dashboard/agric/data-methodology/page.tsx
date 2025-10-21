'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { FaDownload, FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { GiWheat } from 'react-icons/gi';
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

export default function DataAndMethodologyPage() {
  const { country } = useParams();
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [methodology, setMethodology] = useState<Dataset['Methodology_Assumptions'] | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDataSection, setShowDataSection] = useState(true);
  const [showMethodologySection, setShowMethodologySection] = useState(true);

  // Define all known fields for display and CSV
  const dataFields = [
    { key: 'cereal_seeds_tons', label: 'Cereal Seeds (tons)', description: 'Annual usage of cereal seeds for planting.', format: (v: number) => v.toLocaleString() },
    { key: 'fertilizer_tons', label: 'Fertilizer (tons)', description: 'Total fertilizer applied annually.', format: (v: number) => v.toLocaleString() },
    { key: 'pesticide_liters', label: 'Pesticides (liters)', description: 'Volume of pesticides used annually.', format: (v: number) => v.toLocaleString() },
    { key: 'input_subsidy_budget_usd', label: 'Input Subsidy Budget (USD)', description: 'Government budget allocated for input subsidies.', format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'credit_access_pct', label: 'Credit Access (%)', description: 'Percentage of farmers with access to agricultural credit.', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'stockouts_days_per_year', label: 'Stockouts (Days/Year)', description: 'Number of days per year inputs are unavailable.', format: (v: number) => v.toLocaleString() },
    { key: 'fertilizer_kg_per_ha', label: 'Fertilizer Intensity (kg/ha)', description: 'Fertilizer application per hectare of farmland.', format: (v: number) => v.toFixed(1) },
    { key: 'improved_seed_use_pct', label: 'Improved Seed Adoption (%)', description: 'Percentage of farmers using improved seed varieties.', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'mechanization_units_per_1000_farms', label: 'Mechanization (Units/1,000 Farms)', description: 'Number of mechanization units per 1,000 farms.', format: (v: number) => v.toFixed(1) },
    { key: 'distribution_timeliness_pct', label: 'Distribution Timeliness (%)', description: 'Percentage of inputs delivered on time to farmers.', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'input_price_index_2006_base', label: 'Input Price Index (2006 Base)', description: 'Price index of agricultural inputs, normalized to 2006.', format: (v: number) => v.toFixed(2) },
    { key: 'agro_dealer_count', label: 'Agro-Dealer Count', description: 'Number of agricultural input dealers in the country.', format: (v: number) => v.toLocaleString() },
    { key: 'input_import_value_usd', label: 'Input Import Value (USD)', description: 'Value of imported agricultural inputs in USD.', format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'local_production_inputs_tons', label: 'Local Production Inputs (tons)', description: 'Locally produced agricultural inputs in tons.', format: (v: number) => v.toLocaleString() },
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
        if (!response.ok) throw new Error('Failed to fetch data and methodology');
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
        setMethodology(jsonData.Methodology_Assumptions || null);
        setLoading(false);
      } catch (error) {
        setError('Error loading data and methodology');
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
    link.download = `${country}_data_and_methodology.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--dark-green)] text-lg font-medium">Loading Data & Methodology...</p>
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
          aria-label={`Data & Methodology for ${country}`}
        >
          <GiWheat className="text-2xl" /> Data & Methodology -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 rounded bg-[var(--white)] text-[var(--dark-green)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
            aria-label="Select Year for Data Summary"
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
            aria-label="Download data as CSV"
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

        {/* Data Description Section */}
        <section className="bg-[var(--white)] p-4 rounded-lg mb-6 border-l-4 border-[var(--medium-green)]">
          <button
            onClick={() => setShowDataSection(!showDataSection)}
            className="w-full text-left text-[var(--dark-green)] font-semibold text-lg sm:text-xl flex items-center justify-between mb-2 hover:text-[var(--yellow)]"
            aria-expanded={showDataSection}
            aria-controls="data-description"
          >
            Dataset Description
            {showDataSection ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showDataSection && (
            <div id="data-description">
              {methodology?.data_source && (
                <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                  <strong>Source:</strong> {methodology.data_source}
                </p>
              )}
              <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                The dataset contains simulated agricultural input data for {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)} from 2006 to 2025. Available fields include:
              </p>
              <ul className="list-disc pl-5 text-[var(--wine)] text-sm sm:text-base mb-4">
                {dataFields.map((field) => (
                  <li key={field.key}>
                    <strong>{field.label}:</strong> {field.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Methodology Section
        <section className="bg-[var(--white)] p-4 rounded-lg mb-6 border-l-4 border-[var(--medium-green)]">
          <button
            onClick={() => setShowMethodologySection(!showMethodologySection)}
            className="w-full text-left text-[var(--dark-green)] font-semibold text-lg sm:text-xl flex items-center justify-between mb-2 hover:text-[var(--yellow)]"
            aria-expanded={showMethodologySection}
            aria-controls="methodology-description"
          >
            Methodology & Assumptions
            {showMethodologySection ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showMethodologySection && (
            <div id="methodology-description">
              {methodology?.simulation_method && (
                <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                  <strong>Simulation Method:</strong> {methodology.simulation_method}
                </p>
              )}
              {methodology?.assumptions && Array.isArray(methodology.assumptions) && methodology.assumptions.length > 0 ? (
                <>
                  <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                    The data is simulated based on the following assumptions:
                  </p>
                  <ul className="list-disc pl-5 text-[var(--wine)] text-sm sm:text-base mb-4">
                    {methodology.assumptions.map((assumption, index) => (
                      <li key={index}>{assumption}</li>
                    ))}
                  </ul>
                </>
              ) : (
                !methodology?.simulation_method && (
                  <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                    No methodology or assumptions provided in the dataset.
                  </p>
                )
              )}
            </div>
          )}
        </section> */}

        {/* Data Summary Table */}
        <section className="bg-[var(--white)] p-4 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--dark-green)] mb-4 flex items-center gap-2">
            Data Summary for {selectedYear}
            <FaInfoCircle className="text-[var(--olive-green)] text-sm" title={`Key metrics for ${country} in ${selectedYear}`} />
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
                {dataFields.map((field) => (
                  <tr key={field.key}>
                    <td className="border border-[var(--yellow)] p-2">{field.label}</td>
                    <td className="border border-[var(--yellow)] p-2">
                      {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
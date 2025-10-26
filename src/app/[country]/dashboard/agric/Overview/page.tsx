'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { GiWheat } from 'react-icons/gi';
import { FaDownload, FaChevronDown, FaChevronUp, FaChartLine, FaTruck } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
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
    { key: 'cereal_seeds_tons', label: t('overview.supplyChain.cerealSeeds'), menu: 'Supply Chain', format: (v: number) => v.toLocaleString() },
    { key: 'fertilizer_tons', label: t('overview.supplyChain.fertilizer'), menu: 'Supply Chain', format: (v: number) => v.toLocaleString() },
    { key: 'pesticide_liters', label: t('overview.supplyChain.pesticides'), menu: 'Supply Chain', format: (v: number) => v.toLocaleString() },
    { key: 'input_subsidy_budget_usd', label: t('overview.economicIndicator.subsidyBudget'), menu: 'Economic Indicator', format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'credit_access_pct', label: t('overview.economicIndicator.creditAccess'), menu: 'Economic Indicator', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'stockouts_days_per_year', label: t('overview.supplyChain.stockoutDays'), menu: 'Supply Chain', format: (v: number) => v.toLocaleString() },
    { key: 'fertilizer_kg_per_ha', label: t('overview.adoptionMechanisation.fertilizerIntensity'), menu: 'Adoption & Mechanisation', format: (v: number) => v.toFixed(1) },
    { key: 'improved_seed_use_pct', label: t('overview.adoptionMechanisation.improvedSeedAdoption'), menu: 'Adoption & Mechanisation', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'mechanization_units_per_1000_farms', label: t('overview.adoptionMechanisation.mechanization'), menu: 'Adoption & Mechanisation', format: (v: number) => v.toFixed(1) },
    { key: 'distribution_timeliness_pct', label: t('overview.supplyChain.distributionTimeliness'), menu: 'Supply Chain', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'input_price_index_2006_base', label: t('overview.economicIndicator.inputPriceIndex'), menu: 'Economic Indicator', format: (v: number) => v.toFixed(2) },
    { key: 'agro_dealer_count', label: t('overview.supplyChain.agroDealerCount'), menu: 'Supply Chain', format: (v: number) => v.toLocaleString() },
    { key: 'input_import_value_usd', label: t('overview.economicIndicator.inputImportValue'), menu: 'Economic Indicator', format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'local_production_inputs_tons', label: t('overview.supplyChain.localProductionInputs'), menu: 'Supply Chain', format: (v: number) => v.toLocaleString() },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('overview.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/agric/APMD_ECOWAS_Input_Simulated_2006_2025.json');
        if (!response.ok) throw new Error(t('overview.errors.fetchFailed'));
        const jsonData = (await response.json()) as Dataset;

        const years = jsonData.Simulated_Input_Data.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Simulated_Input_Data.filter(
          (d) => d.country.toLowerCase() === (country as string).toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('overview.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (error) {
        setError(t('overview.errors.loadingError'));
        setLoading(false);
      }
    }

    fetchData();
  }, [country, t]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map((d) => d.year))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find((d) => d.year === selectedYear);

  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => {
      const row: { [key: string]: string | number } = { Year: data.year };
      dataFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('overview.na');
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
        <p className="text-[var(--dark-green)] text-lg font-medium">{t('overview.loading')}</p>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--wine)] text-lg font-medium">{error || t('overview.errors.noData', { country })}</p>
      </div>
    );
  }

  const countryName =
    (country as string).charAt(0).toUpperCase() + (country as string).slice(1);

  return (
    <div className="min-h-screen bg-[var(--white)] font-sans">
      {/* Header */}
      <header className="bg-[var(--medium-green)] text-[var(--white)] p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-2">
          <GiWheat className="text-2xl sm:text-3xl" />
          <h1 className="text-xl sm:text-2xl font-bold">{t('overview.title', { countryName })}</h1>
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
            <FaDownload /> {t('overview.downloadCSV')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <p className="text-[var(--olive-green)] mb-6 text-sm sm:text-base italic">
          {t('overview.simulatedDataNote')}
        </p>

        {/* Supply Chain Section */}
        <section className="mb-6">
          <button
            onClick={() => setShowSupplyChain(!showSupplyChain)}
            className="w-full flex justify-between items-center p-4 bg-[var(--medium-green)] text-[var(--white)] rounded-t-lg font-semibold text-lg sm:text-xl hover:bg-opacity-90 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FaTruck className="text-white" /> {t('overview.supplyChain.title')}
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
                      {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('overview.na')}
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
              <FaChartLine className="text-white" /> {t('overview.economicIndicator.title')}
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
                      {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('overview.na')}
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
              <FaChartLine className="text-white" /> {t('overview.adoptionMechanisation.title')}
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
                      {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('overview.na')}
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
              <FaChartLine className="text-white" /> {t('overview.forecastSimulation.title')}
            </span>
            {showForecastSimulation ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showForecastSimulation && (
            <div className="p-4 bg-[var(--white)] rounded-b-lg shadow-md">
              <p className="text-[var(--wine)] text-sm sm:text-base">
                {t('overview.forecastSimulation.description')}{' '}
                <button
                  onClick={() => router.push(`/${country}/dashboard/agric/forecast-simulation`)}
                  className="text-[var(--medium-green)] hover:text-[var(--yellow)] underline"
                >
                  {t('overview.forecastSimulation.link')}
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
              <FaChartLine className="text-white" /> {t('overview.inputMetric.title')}
            </span>
            {showInputMetric ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showInputMetric && (
            <div className="p-4 bg-[var(--white)] rounded-b-lg shadow-md">
              <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                {t('overview.inputMetric.description', { year: selectedYear })}{' '}
                <button
                  onClick={() => router.push(`/${country}/dashboard/agric/input-metric`)}
                  className="text-[var(--medium-green)] hover:text-[var(--yellow)] underline"
                >
                  {t('overview.inputMetric.link')}
                </button>.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm sm:text-base text-[var(--wine)] border-collapse">
                  <thead>
                    <tr className="bg-[var(--medium-green)] text-[var(--white)]">
                      <th className="p-2 text-left border-b border-[var(--yellow)]">{t('overview.inputMetric.table.metric')}</th>
                      <th className="p-2 text-left border-b border-[var(--yellow)]">{t('overview.inputMetric.table.value')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataFields.map((field) => (
                      <tr key={field.key} className="hover:bg-[var(--yellow)]/20 transition-colors">
                        <td className="p-2 border-b border-[var(--yellow)]">{field.label}</td>
                        <td className="p-2 border-b border-[var(--yellow)]">
                          {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('overview.na')}
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
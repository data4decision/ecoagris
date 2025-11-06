'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { FaChartBar, FaTruck, FaMoneyBillWave, FaSeedling, FaChartLine, FaDatabase, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import '@/styles/pdf-styles.css';

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

export default function AgricInputOverviewPage() {
  const { country } = useParams<{ country: string }>();
  const router = useRouter();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const EXCEL_FILE_URL =
    'https://res.cloudinary.com/dmuvs05yp/raw/upload/v1738770665/APMD_ECOWAS_Input_Simulated_2006_2025.xlsx';

  const columnMap: Record<string, string[]> = {
    cereal_seeds_tons: ['cereal_seeds_tons', 'Cereal Seeds (tons)'],
    fertilizer_tons: ['fertilizer_tons', 'Fertilizer (tons)'],
    pesticide_liters: ['pesticide_liters', 'Pesticide (liters)'],
    input_subsidy_budget_usd: ['input_subsidy_budget_usd', 'Input Subsidy Budget (USD)'],
    credit_access_pct: ['credit_access_pct', 'Credit Access (%)'],
    stockouts_days_per_year: ['stockouts_days_per_year', 'Stockouts (days/year)'],
    fertilizer_kg_per_ha: ['fertilizer_kg_per_ha', 'Fertilizer (kg/ha)'],
    improved_seed_use_pct: ['improved_seed_use_pct', 'Improved Seed Use (%)'],
    mechanization_units_per_1000_farms: ['mechanization_units_per_1000_farms', 'Mechanization Units per 1000 Farms'],
    distribution_timeliness_pct: ['distribution_timeliness_pct', 'Distribution Timeliness (%)'],
    input_price_index_2006_base: ['input_price_index_2006_base', 'Input Price Index (2006=100)'],
    agro_dealer_count: ['agro_dealer_count', 'Agro-dealer Count'],
    input_import_value_usd: ['input_import_value_usd', 'Input Import Value (USD)'],
    local_production_inputs_tons: ['local_production_inputs_tons', 'Local Production (tons)'],
  };

  const getValue = (row: InputData, key: string): number | undefined => {
    const possibles = columnMap[key] || [key];
    for (const col of possibles) {
      const val = row[col];
      if (typeof val === 'number') return val;
    }
    return undefined;
  };

  const safeFormat = (value: unknown, formatter: (v: number) => string): string => {
    return typeof value === 'number' && !isNaN(value) ? formatter(value) : 'N/A';
  };

  const nav = [
    { label: t('overview.overview'), href: `/${country}/dashboard/agric`, icon: FaChartBar, description: t('overview.overviewDescription') },
    { label: t('overview.supplyChain'), href: `/${country}/dashboard/agric/supply`, icon: FaTruck, description: t('overview.supplyChainDescription') },
    { label: t('overview.economicIndicators'), href: `/${country}/dashboard/agric/economic-indicators`, icon: FaMoneyBillWave, description: t('overview.economicIndicatorsDescription') },
    { label: t('overview.adoptionMechanization'), href: `/${country}/dashboard/agric/adoption-mechanization`, icon: FaSeedling, description: t('overview.adoptionMechanizationDescription') },
    { label: t('overview.forecastSimulation'), href: `/${country}/dashboard/agric/forecast-simulation`, icon: FaChartLine, description: t('overview.forecastSimulationDescription') },
    { label: t('overview.dataMethodology'), href: `/${country}/dashboard/agric/data-methodology`, icon: FaDatabase, description: t('overview.dataMethodologyDescription') },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('overview.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    const fetchExcelData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(EXCEL_FILE_URL);
        if (!response.ok) throw new Error('Failed to download file');

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet);

        const normalizedData = rawData.map(row => {
          const normalized: Record<string, unknown> = { ...row };
          Object.keys(row).forEach(k => {
            normalized[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = row[k];
          });
          return normalized as InputData;
        });

        const filtered = normalizedData.filter(
          row => row.country?.toString().toLowerCase() === country.toLowerCase()
        );

        if (filtered.length === 0) {
          setError(t('overview.errors.noData', { country }));
          setLoading(false);
          return;
        }

        const maxYear = Math.max(...filtered.map(d => d.year as number), 2025);
        setSelectedYear(maxYear);
        setCountryData(filtered as InputData[]);
      } catch (err) {
        console.error('Excel fetch error:', err);
        setError(t('overview.errors.loadingError'));
      } finally {
        setLoading(false);
      }
    };

    fetchExcelData();
  }, [country, t]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map(d => d.year as number))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find(d => d.year === selectedYear);

  const handleCSVDownload = () => {
    const csvData = countryData.map(data => ({
      Country: data.country,
      Year: data.year,
      CerealSeedsTons: safeFormat(getValue(data, 'cereal_seeds_tons'), v => v.toLocaleString()),
      FertilizerTons: safeFormat(getValue(data, 'fertilizer_tons'), v => v.toLocaleString()),
      PesticideLiters: safeFormat(getValue(data, 'pesticide_liters'), v => v.toLocaleString()),
      InputSubsidyBudgetUSD: safeFormat(getValue(data, 'input_subsidy_budget_usd'), v => `$${v.toLocaleString()}`),
      CreditAccessPct: safeFormat(getValue(data, 'credit_access_pct'), v => `${v.toFixed(1)}%`),
      StockoutsDaysPerYear: safeFormat(getValue(data, 'stockouts_days_per_year'), v => v.toLocaleString()),
      FertilizerKgPerHa: safeFormat(getValue(data, 'fertilizer_kg_per_ha'), v => v.toFixed(1)),
      ImprovedSeedUsePct: safeFormat(getValue(data, 'improved_seed_use_pct'), v => `${v.toFixed(1)}%`),
      MechanizationUnitsPer1000Farms: safeFormat(getValue(data, 'mechanization_units_per_1000_farms'), v => v.toFixed(1)),
      DistributionTimelinessPct: safeFormat(getValue(data, 'distribution_timeliness_pct'), v => `${v.toFixed(1)}%`),
      InputPriceIndex2006Base: safeFormat(getValue(data, 'input_price_index_2006_base'), v => v.toFixed(2)),
      AgroDealerCount: safeFormat(getValue(data, 'agro_dealer_count'), v => v.toLocaleString()),
      InputImportValueUSD: safeFormat(getValue(data, 'input_import_value_usd'), v => `$${v.toLocaleString()}`),
      LocalProductionInputsTons: safeFormat(getValue(data, 'local_production_inputs_tons'), v => v.toLocaleString()),
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_agric_input_overview.csv`;
    link.click();
  };

  const handleDownload = async (format: 'png' | 'pdf') => {
    if (!dashboardRef.current) return;

    try {
      await new Promise(r => setTimeout(r, 800));
      dashboardRef.current.classList.add('snapshot');
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
      dashboardRef.current.classList.remove('snapshot');

      const imgData = canvas.toDataURL('image/png');

      if (format === 'png') {
        const a = document.createElement('a');
        a.href = imgData;
        a.download = `${country}_agric_input_overview.png`;
        a.click();
      } else {
        const pdf = new jsPDF('landscape');
        const width = pdf.internal.pageSize.getWidth() - 20;
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 35, width, height);
        pdf.setFontSize(16);
        pdf.text(t('overview.title', { countryName: country.toUpperCase() }), 10, 15);
        pdf.setFontSize(10);
        pdf.text(t('overview.report_exported', { date: new Date().toLocaleDateString() }), 10, 25);
        pdf.save(`${country}_agric_input_overview.pdf`);
      }
    } catch {
      alert(t(`overview.errors.${format}Failed`));
    }
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

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="min-h-screen bg-[var(--white)] font-sans">
      <header className="bg-[var(--medium-green)] text-[var(--white)] p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-2">
          <FaChartBar className="text-2xl sm:text-3xl text-[var(--yellow)]" />
          <h1 className="text-xl sm:text-2xl font-bold">{t('overview.title', { countryName })}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 rounded bg-[var(--white)] text-[var(--dark-green)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={handleCSVDownload}
            className="flex items-center gap-2 cursor-pointer bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 transition-colors"
          >
            <FaDownload /> {t('overview.downloadCSV')}
          </button>
          <button
            onClick={() => handleDownload('png')}
            className="flex items-center gap-2 bg-[var(--yellow)] cursor-pointer text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 transition-colors"
          >
            <FaDownload /> {t('overview.downloadPNG')}
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center gap-2 bg-[var(--yellow)] cursor-pointer text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 transition-colors"
          >
            <FaDownload /> {t('overview.downloadPDF')}
          </button>
        </div>
      </header>

      <main ref={dashboardRef} className="max-w-7xl mx-auto p-4 sm:p-6" id="dashboard-content">
        <p className="text-[var(--olive-green)] mb-6 text-sm sm:text-base italic">
          {t('overview.simulatedDataNote')}
        </p>

        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--dark-green)] mb-4">
            {t('overview.exploreCategories')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {nav.map((item) => (
              <div
                key={item.label}
                className="bg-[var(--white)] p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)] cursor-pointer"
                onClick={() => router.push(item.href)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <item.icon className="text-[var(--dark-green)] text-2xl" />
                  <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{item.label}</h3>
                </div>
                <p className="text-[var(--olive-green)] text-xs sm:text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
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
import { FaTractor, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import '@/styles/dashboard-styles.css';

interface InputData {
  country: string;
  year: number;
  cereal_seeds_tons: number;
  fertilizer_tons: number;
  pesticide_liters: number;
  input_subsidy_budget_usd: number;
  credit_access_pct: number;
  stockouts_days_per_year: number;
  fertilizer_kg_per_ha: number;
  improved_seed_use_pct: number;
  mechanization_units_per_1000_farms: number;
  [key: string]: unknown;
}

interface GrowthData {
  year: number;
  seedGrowthRate: number;
  mechanizationGrowthRate: number;
}

export default function ForecastSimulationPage() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'input_subsidy_budget_usd' | 'credit_access_pct'>('input_subsidy_budget_usd');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const EXCEL_FILE_URL =
    'https://res.cloudinary.com/dmuvs05yp/raw/upload/v1738770665/APMD_ECOWAS_Input_Simulated_2006_2025.xlsx';

  const forecastFields = [
    { key: 'input_subsidy_budget_usd', label: t('forecastSimulation.inputSubsidy'), format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'credit_access_pct', label: t('forecastSimulation.creditAccess'), format: (v: number) => `${v.toFixed(1)}%` },
  ] as const;

  const growthData: GrowthData[] = useMemo(() => {
    const sorted = [...countryData].sort((a, b) => a.year - b.year);
    return sorted.map((data, i, arr) => {
      if (i === 0) return { year: data.year, seedGrowthRate: 0, mechanizationGrowthRate: 0 };

      const prev = arr[i - 1];
      const prevSeed = prev.improved_seed_use_pct;
      const currSeed = data.improved_seed_use_pct;
      const prevMech = prev.mechanization_units_per_1000_farms;
      const currMech = data.mechanization_units_per_1000_farms;

      const seedGrowthRate = prevSeed > 0 ? ((currSeed - prevSeed) / prevSeed) * 100 : 0;
      const mechGrowthRate = prevMech > 0 ? ((currMech - prevMech) / prevMech) * 100 : 0;

      return {
        year: data.year,
        seedGrowthRate: Number.isFinite(seedGrowthRate) ? Number(seedGrowthRate.toFixed(2)) : 0,
        mechanizationGrowthRate: Number.isFinite(mechGrowthRate) ? Number(mechGrowthRate.toFixed(2)) : 0,
      };
    });
  }, [countryData]);

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('forecastSimulation.errors.invalidCountry'));
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
        const jsonData: InputData[] = XLSX.utils.sheet_to_json(worksheet);

        const filtered = jsonData.filter(
          (row) => row.country?.toString().toLowerCase() === country.toLowerCase()
        );

        if (filtered.length === 0) {
          setError(t('forecastSimulation.errors.noData', { country }));
          setLoading(false);
          return;
        }

        const maxYear = Math.max(...filtered.map(d => d.year), 2025);
        setSelectedYear(maxYear);
        setCountryData(filtered);
      } catch (err) {
        console.error('Excel fetch error:', err);
        setError(t('forecastSimulation.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchExcelData();
  }, [country, t]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map(d => d.year))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find(d => d.year === selectedYear);
  const totalInputUsage = selectedData
    ? selectedData.cereal_seeds_tons + selectedData.fertilizer_tons + selectedData.pesticide_liters
    : 0;

  const safeFormat = (value: unknown, formatter: (v: number) => string): string => {
    return typeof value === 'number' && !isNaN(value) ? formatter(value) : 'N/A';
  };

  const handleCSVDownload = () => {
    const csvData = countryData.map(data => {
      const growth = growthData.find(g => g.year === data.year);
      return {
        Year: data.year,
        [t('forecastSimulation.cerealSeeds')]: data.cereal_seeds_tons.toLocaleString(),
        [t('forecastSimulation.fertilizer')]: data.fertilizer_tons.toLocaleString(),
        [t('forecastSimulation.pesticides')]: data.pesticide_liters.toLocaleString(),
        [t('forecastSimulation.inputSubsidy')]: `$${data.input_subsidy_budget_usd.toLocaleString()}`,
        [t('forecastSimulation.creditAccess')]: `${data.credit_access_pct.toFixed(1)}%`,
        [t('forecastSimulation.seedGrowthRate')]: `${growth?.seedGrowthRate ?? 0}%`,
        [t('forecastSimulation.mechanizationGrowthRate')]: `${growth?.mechanizationGrowthRate ?? 0}%`,
      };
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${country}_forecast_simulation_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePNGDownload = async () => {
    if (!dashboardRef.current) return;
    try {
      await new Promise(r => setTimeout(r, 800));
      dashboardRef.current.classList.add('snapshot');
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
      dashboardRef.current.classList.remove('snapshot');
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${country}_forecast_simulation_dashboard.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch {
      alert(t('forecastSimulation.errors.pngFailed'));
    }
  };

  const handlePDFDownload = async () => {
    if (!dashboardRef.current) return;
    try {
      await new Promise(r => setTimeout(r, 800));
      dashboardRef.current.classList.add('snapshot');
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
      dashboardRef.current.classList.remove('snapshot');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const width = pdf.internal.pageSize.getWidth() - 20;
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 30, width, height);
      pdf.setFontSize(16);
      pdf.text(t('forecastSimulation.title', { countryName: country.toUpperCase() }), 10, 15);
      pdf.setFontSize(10);
      pdf.text(t('forecastSimulation.report_exported', { date: new Date().toLocaleDateString() }), 10, 22);
      pdf.save(`${country}_forecast_simulation_dashboard.pdf`);
    } catch {
      alert(t('forecastSimulation.errors.pdfFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('forecastSimulation.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || t('forecastSimulation.errors.noData', { country })}</p>
        </div>
      </div>
    );
  }

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content" ref={dashboardRef}>
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={t('forecastSimulation.ariaTitle', { country: countryName })}
        >
          <FaTractor aria-hidden="true" className="text-lg sm:text-xl" /> {t('forecastSimulation.title', { countryName })}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">{t('forecastSimulation.simulatedDataNote')}</p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            aria-label={t('forecastSimulation.downloadCSVLabel')}
          >
            <FaDownload /> {t('forecastSimulation.downloadCSV')}
          </button>
          <button
            onClick={handlePNGDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            aria-label={t('forecastSimulation.downloadPNGLabel')}
          >
            <FaDownload /> {t('forecastSimulation.downloadPNG')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            aria-label={t('forecastSimulation.downloadPDFLabel')}
          >
            <FaDownload /> {t('forecastSimulation.downloadPDF')}
          </button>
        </div>

        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('forecastSimulation.yearSelectLabel')}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 max-w-full">
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={t('forecastSimulation.totalInputCard', { year: selectedYear })}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{t('forecastSimulation.totalInput')} ({selectedYear})</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">{totalInputUsage.toLocaleString()} units</p>
          </div>
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={t('forecastSimulation.inputSubsidyCard', { year: selectedYear })}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{t('forecastSimulation.inputSubsidy')} ({selectedYear})</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">${selectedData.input_subsidy_budget_usd.toLocaleString()}</p>
          </div>
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={t('forecastSimulation.creditAccessCard', { year: selectedYear })}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{t('forecastSimulation.creditAccess')} ({selectedYear})</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">{selectedData.credit_access_pct.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-full">
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section" aria-label={t('forecastSimulation.trendsChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('forecastSimulation.trendsTitle', { year: selectedYear })}
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
                  dataKey="cereal_seeds_tons"
                  stroke="var(--olive-green)"
                  name={t('forecastSimulation.cerealSeeds')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="fertilizer_tons"
                  stroke="var(--wine)"
                  name={t('forecastSimulation.fertilizer')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="pesticide_liters"
                  stroke="#8884d8"
                  name={t('forecastSimulation.pesticides')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section" aria-label={t('forecastSimulation.comparisonChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('forecastSimulation.comparisonTitle', { country: countryName })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('forecastSimulation.metricSelectLabel')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as 'input_subsidy_budget_usd' | 'credit_access_pct')}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {forecastFields.map((field) => (
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
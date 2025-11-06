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
import { FaTruck, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import '@/styles/dashboard-styles.css';

interface InputData {
  country: string;
  year: number;
  cereal_seeds_tons?: number;
  fertilizer_tons?: number;
  pesticide_liters?: number;
  stockouts_days_per_year?: number;
  distribution_timeliness_pct?: number;
  agro_dealer_count?: number;
  local_production_inputs_tons?: number;
  [key: string]: unknown;
}

type SupplyChainMetric =
  | 'cereal_seeds_tons'
  | 'fertilizer_tons'
  | 'pesticide_liters'
  | 'stockouts_days_per_year'
  | 'distribution_timeliness_pct'
  | 'agro_dealer_count'
  | 'local_production_inputs_tons';

export default function SupplyChainPage() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<SupplyChainMetric>('stockouts_days_per_year');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestYear, setLatestYear] = useState(2025);

  const EXCEL_FILE_URL =
    'https://res.cloudinary.com/dmuvs05yp/raw/upload/v1738770665/APMD_ECOWAS_Input_Simulated_2006_2025.xlsx';

  const columnMap: Record<string, string[]> = {
    cereal_seeds_tons: ['cereal_seeds_tons', 'Cereal Seeds (tons)'],
    fertilizer_tons: ['fertilizer_tons', 'Fertilizer (tons)'],
    pesticide_liters: ['pesticide_liters', 'Pesticide (liters)'],
    stockouts_days_per_year: ['stockouts_days_per_year', 'Stockouts (days/year)'],
    distribution_timeliness_pct: ['distribution_timeliness_pct', 'Distribution Timeliness (%)'],
    agro_dealer_count: ['agro_dealer_count', 'Agro-dealer Count'],
    local_production_inputs_tons: ['local_production_inputs_tons', 'Local Production (tons)'],
  };

  const supplyChainFields = [
    { key: 'cereal_seeds_tons', label: t('supplyChain.cerealSeeds'), format: (v: number) => v.toLocaleString() },
    { key: 'fertilizer_tons', label: t('supplyChain.fertilizer'), format: (v: number) => v.toLocaleString() },
    { key: 'pesticide_liters', label: t('supplyChain.pesticides'), format: (v: number) => v.toLocaleString() },
    { key: 'stockouts_days_per_year', label: t('supplyChain.stockoutDays'), format: (v: number) => v.toLocaleString() },
    { key: 'distribution_timeliness_pct', label: t('supplyChain.distributionTimeliness'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'agro_dealer_count', label: t('supplyChain.agroDealerCount'), format: (v: number) => v.toLocaleString() },
    { key: 'local_production_inputs_tons', label: t('supplyChain.localProductionInputs'), format: (v: number) => v.toLocaleString() },
  ] as const;

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

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('supplyChain.errors.invalidCountry'));
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
          setError(t('supplyChain.errors.noData', { country }));
          setLoading(false);
          return;
        }

        const maxYear = Math.max(...filtered.map(d => d.year as number), 2025);
        setLatestYear(maxYear);
        setSelectedYear(maxYear);
        setCountryData(filtered as InputData[]);
      } catch (err) {
        console.error('Excel fetch error:', err);
        setError(t('supplyChain.errors.fetchFailed'));
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

  const totalInputAvailability = selectedData
    ? (getValue(selectedData, 'cereal_seeds_tons') || 0) +
      (getValue(selectedData, 'fertilizer_tons') || 0) +
      (getValue(selectedData, 'pesticide_liters') || 0) +
      (getValue(selectedData, 'local_production_inputs_tons') || 0)
    : 0;

  const handleCSVDownload = () => {
    const csvData = countryData.map(data => {
      const row: Record<string, string | number> = { Year: data.year as number };
      supplyChainFields.forEach(field => {
        row[field.label] = safeFormat(getValue(data, field.key), field.format);
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${country}_supply_chain_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (format: 'png' | 'pdf') => {
    if (!dashboardRef.current) return;

    try {
      await new Promise(r => setTimeout(r, 1000));
      dashboardRef.current.classList.add('snapshot');
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
      dashboardRef.current.classList.remove('snapshot');

      const imgData = canvas.toDataURL('image/png');

      if (format === 'png') {
        const a = document.createElement('a');
        a.href = imgData;
        a.download = `${country}_supply_chain_dashboard.png`;
        a.click();
      } else {
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        const width = pdf.internal.pageSize.getWidth() - 20;
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 30, width, height);
        pdf.setFontSize(16);
        pdf.text(t('supplyChain.title', { countryName: country.toUpperCase() }), 10, 15);
        pdf.setFontSize(10);
        pdf.text(t('supplyChain.report_exported', { date: new Date().toLocaleDateString() }), 10, 22);
        pdf.save(`${country}_supply_chain_dashboard.pdf`);
      }
    } catch {
      alert(t(`supplyChain.errors.${format}Failed`));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('supplyChain.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || t('supplyChain.errors.noData', { country })}</p>
        </div>
      </div>
    );
  }

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content" ref={dashboardRef}>
        {/* Page Header */}
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={t('supplyChain.ariaTitle', { country: countryName })}
        >
          <FaTruck aria-hidden="true" className="text-lg sm:text-xl" /> {t('supplyChain.title', { countryName })}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">{t('supplyChain.simulatedDataNote')}</p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
          >
            <FaDownload /> {t('supplyChain.downloadCSV')}
          </button>
          <button
            onClick={() => handleDownload('png')}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
          >
            <FaDownload /> {t('supplyChain.downloadPNG')}
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
          >
            <FaDownload /> {t('supplyChain.downloadPDF')}
          </button>
        </div>

        {/* Year Selection */}
        <div className="mb-4 max-w-full">
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 max-w-full">
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0">
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">
              {t('supplyChain.totalInput', { year: selectedYear })}
            </h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">
              {totalInputAvailability.toLocaleString()} {t('supplyChain.units')}
            </p>
          </div>
          {supplyChainFields.map((field) => {
            const value = getValue(selectedData, field.key);
            return (
              <div key={field.key} className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0">
                <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">
                  {field.label} ({selectedYear})
                </h3>
                <p className="text-[var(--wine)] text-base sm:text-lg">
                  {safeFormat(value, field.format)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 gap-6 max-w-full">
          {/* Line Chart */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('supplyChain.trendsTitle', { year: latestYear })}
            </h2>
            <ResponsiveContainer width="100%" height={400} className="sm:h-[250px]">
              <LineChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" fontSize={10} angle={-45} textAnchor="end" height={50} />
                <YAxis fontSize={10} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey={(d) => getValue(d, 'cereal_seeds_tons')} stroke="var(--medium-green)" name={t('supplyChain.cerealSeeds')} strokeWidth={2} />
                <Line type="monotone" dataKey={(d) => getValue(d, 'fertilizer_tons')} stroke="var(--wine)" name={t('supplyChain.fertilizer')} strokeWidth={2} />
                <Line type="monotone" dataKey={(d) => getValue(d, 'pesticide_liters')} stroke="var(--olive-green)" name={t('supplyChain.pesticides')} strokeWidth={2} />
                <Line type="monotone" dataKey={(d) => getValue(d, 'stockouts_days_per_year')} stroke="var(--dark-green)" name={t('supplyChain.stockoutDays')} strokeWidth={2} />
                <Line type="monotone" dataKey={(d) => getValue(d, 'distribution_timeliness_pct')} stroke="var(--yellow)" name={t('supplyChain.distributionTimeliness')} strokeWidth={2} />
                <Line type="monotone" dataKey={(d) => getValue(d, 'agro_dealer_count')} stroke="#4B0082" name={t('supplyChain.agroDealerCount')} strokeWidth={2} />
                <Line type="monotone" dataKey={(d) => getValue(d, 'local_production_inputs_tons')} stroke="#FF4500" name={t('supplyChain.localProductionInputs')} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('supplyChain.comparisonTitle', { country: countryName })}
            </h2>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as SupplyChainMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {supplyChainFields.map((field) => (
                <option key={field.key} value={field.key}>{field.label}</option>
              ))}
            </select>
            <ResponsiveContainer width="100%" height={400} className="sm:h-[250px]">
              <BarChart data={countryData} barGap={2} barCategoryGap="10%">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" fontSize={10} angle={-45} textAnchor="end" height={50} />
                <YAxis fontSize={10} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey={(d) => getValue(d, selectedMetric)} fill="var(--olive-green)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
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
  ResponsiveContainer,
} from 'recharts';
import { FaDownload, FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { GiWheat } from 'react-icons/gi';
import { stringify } from 'csv-stringify/sync';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import '@/styles/dashboard-styles.css';

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

export default function InputMetricsPage() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPercentageChart, setShowPercentageChart] = useState(true);
  const [showValueChart, setShowValueChart] = useState(true);

  const EXCEL_FILE_URL =
    'https://res.cloudinary.com/dmuvs05yp/raw/upload/v1738770665/APMD_ECOWAS_Input_Simulated_2006_2025.xlsx';

  const columnMap: Record<string, string[]> = {
    distribution_timeliness_pct: ['distribution_timeliness_pct', 'Distribution Timeliness (%)'],
    input_price_index_2006_base: ['input_price_index_2006_base', 'Input Price Index (2006=100)'],
    agro_dealer_count: ['agro_dealer_count', 'Agro-dealer Count'],
    input_import_value_usd: ['input_import_value_usd', 'Input Import Value (USD)'],
    local_production_inputs_tons: ['local_production_inputs_tons', 'Local Production (tons)'],
  };

  const inputMetricsFields = [
    { key: 'distribution_timeliness_pct', label: t('inputMetrics.distributionTimeliness'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'input_price_index_2006_base', label: t('inputMetrics.inputPriceIndex'), format: (v: number) => v.toFixed(2) },
    { key: 'agro_dealer_count', label: t('inputMetrics.agroDealerCount'), format: (v: number) => v.toLocaleString() },
    { key: 'input_import_value_usd', label: t('inputMetrics.inputImportValue'), format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'local_production_inputs_tons', label: t('inputMetrics.localProductionInputs'), format: (v: number) => v.toLocaleString() },
  ] as const;

  const getValue = (row: InputData, key: string): number | undefined => {
    const possibles = columnMap[key] || [key];
    for (const col of possibles) {
      const val = row[col];
      if (typeof val === 'number') return val;
    }
    return undefined;
  };

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('inputMetrics.errors.invalidCountry'));
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
          setError(t('inputMetrics.errors.noData', { country }));
          setLoading(false);
          return;
        }

        const maxYear = Math.max(...filtered.map(d => d.year as number), 2025);
        setSelectedYear(maxYear);
        setCountryData(filtered as InputData[]);
      } catch (err) {
        console.error('Excel fetch error:', err);
        setError(t('inputMetrics.errors.fetchFailed'));
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

  const safeFormat = (value: unknown, formatter: (v: number) => string): string => {
    return typeof value === 'number' && !isNaN(value) ? formatter(value) : 'N/A';
  };

  const handleCSVDownload = () => {
    const csvData = countryData.map(data => {
      const row: Record<string, string | number> = { Year: data.year as number };
      inputMetricsFields.forEach(field => {
        row[field.label] = safeFormat(getValue(data, field.key), field.format);
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${country}_input_metrics.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (format: 'png' | 'pdf') => {
    if (!dashboardRef.current) return;

    try {
      setShowPercentageChart(true);
      setShowValueChart(true);
      await new Promise(r => setTimeout(r, 800));
      dashboardRef.current.classList.add('snapshot');

      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
      dashboardRef.current.classList.remove('snapshot');

      const imgData = canvas.toDataURL('image/png');

      if (format === 'png') {
        const a = document.createElement('a');
        a.href = imgData;
        a.download = `${country}_input_metrics.png`;
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
        pdf.text(t('inputMetrics.title', { countryName: country.toUpperCase() }), 10, 15);
        pdf.setFontSize(10);
        pdf.text(t('inputMetrics.report_exported', { date: new Date().toLocaleDateString() }), 10, 22);
        pdf.save(`${country}_input_metrics.pdf`);
      }
    } catch {
      alert(t(`inputMetrics.errors.${format}Failed`));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--dark-green)] text-lg font-medium">{t('inputMetrics.loading')}</p>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--wine)] text-lg font-medium">{error || t('inputMetrics.errors.noData', { country })}</p>
      </div>
    );
  }

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="min-h-screen bg-[var(--white)]">
      {/* Header Bar */}
      <header className="bg-[var(--medium-green)] text-[var(--white)] p-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10">
        <h1
          className="text-xl sm:text-2xl font-bold flex items-center gap-2"
          aria-label={t('inputMetrics.ariaTitle', { country: countryName })}
        >
          <GiWheat className="text-2xl" /> {t('inputMetrics.title', { countryName })}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 rounded bg-[var(--white)] text-[var(--dark-green)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
            aria-label={t('inputMetrics.yearSelectLabel')}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            onClick={handleCSVDownload}
            className="bg-[var(--medium-green)] text-[var(--white)] px-3 py-2 rounded flex items-center gap-2 hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-colors cursor-pointer"
            aria-label={t('inputMetrics.downloadCSVLabel')}
          >
            <FaDownload /> {t('inputMetrics.downloadCSV')}
          </button>
          <button
            onClick={() => handleDownload('png')}
            className="bg-[var(--medium-green)] text-[var(--white)] px-3 py-2 rounded flex items-center gap-2 hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-colors cursor-pointer"
            aria-label={t('inputMetrics.downloadPNGLabel')}
          >
            <FaDownload /> {t('inputMetrics.downloadPNG')}
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            className="bg-[var(--medium-green)] text-[var(--white)] px-3 py-2 rounded flex items-center gap-2 hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-colors cursor-pointer"
            aria-label={t('inputMetrics.downloadPDFLabel')}
          >
            <FaDownload /> {t('inputMetrics.downloadPDF')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main ref={dashboardRef} className="p-4 sm:p-6 max-w-4xl mx-auto" id="input-metrics-content">
        <p className="text-[var(--olive-green)] mb-6 text-sm sm:text-base italic">
          {t('inputMetrics.simulatedDataNote')}
        </p>

        {/* Percentage-Based Metrics Chart */}
        <section className="bg-[var(--white)] p-4 rounded-lg mb-6 border-l-4 border-[var(--medium-green)] chart-section">
          <button
            onClick={() => setShowPercentageChart(!showPercentageChart)}
            className="w-full text-left text-[var(--dark-green)] font-semibold text-lg sm:text-xl flex items-center justify-between mb-2 hover:text-[var(--yellow)]"
            aria-expanded={showPercentageChart}
            aria-controls="percentage-metrics-chart"
          >
            {t('inputMetrics.percentageChartTitle', { year: selectedYear })}
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
                  dataKey={(d) => getValue(d, 'distribution_timeliness_pct')}
                  stroke="var(--medium-green)"
                  name={t('inputMetrics.distributionTimeliness')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey={(d) => getValue(d, 'input_price_index_2006_base')}
                  stroke="var(--wine)"
                  name={t('inputMetrics.inputPriceIndex')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* Value-Based Metrics Chart */}
        <section className="bg-[var(--white)] p-4 rounded-lg mb-6 border-l-4 border-[var(--medium-green)] chart-section">
          <button
            onClick={() => setShowValueChart(!showValueChart)}
            className="w-full text-left text-[var(--dark-green)] font-semibold text-lg sm:text-xl flex items-center justify-between mb-2 hover:text-[var(--yellow)]"
            aria-expanded={showValueChart}
            aria-controls="value-metrics-chart"
          >
            {t('inputMetrics.valueChartTitle', { year: selectedYear })}
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
                  dataKey={(d) => getValue(d, 'agro_dealer_count')}
                  stroke="var(--medium-green)"
                  name={t('inputMetrics.agroDealerCount')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey={(d) => getValue(d, 'input_import_value_usd')}
                  stroke="var(--wine)"
                  name={t('inputMetrics.inputImportValue')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey={(d) => getValue(d, 'local_production_inputs_tons')}
                  stroke="var(--olive-green)"
                  name={t('inputMetrics.localProductionInputs')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* Data Summary Table */}
        <section className="bg-[var(--white)] p-4 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--dark-green)] mb-4 flex items-center gap-2">
            {t('inputMetrics.summaryTitle', { year: selectedYear })}
            <FaInfoCircle className="text-[var(--olive-green)] text-sm" title={t('inputMetrics.summaryTooltip')} />
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base text-[var(--wine)] border-collapse border border-[var(--yellow)]">
              <thead>
                <tr className="bg-[var(--medium-green)] text-[var(--white)]">
                  <th className="border border-[var(--yellow)] p-2 text-left">{t('inputMetrics.metric')}</th>
                  <th className="border border-[var(--yellow)] p-2 text-left">{t('inputMetrics.value')}</th>
                </tr>
              </thead>
              <tbody>
                {inputMetricsFields.map((field) => {
                  const value = getValue(selectedData, field.key);
                  return (
                    <tr key={field.key}>
                      <td className="border border-[var(--yellow)] p-2">{field.label}</td>
                      <td className="border border-[var(--yellow)] p-2">
                        {safeFormat(value, field.format)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
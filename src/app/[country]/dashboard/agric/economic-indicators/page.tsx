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
import { FaChartLine, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import '@/styles/dashboard-styles.css';

interface InputData {
  country: string;
  year: number;
  input_subsidy_budget_usd?: number;
  credit_access_pct?: number;
  input_price_index_2006_base?: number;
  input_import_value_usd?: number;
  [key: string]: unknown  | undefined;
}

type EconomicIndicatorMetric =
  | 'input_subsidy_budget_usd'
  | 'credit_access_pct'
  | 'input_price_index_2006_base'
  | 'input_import_value_usd';

export default function EconomicIndicatorsPage() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<EconomicIndicatorMetric>('input_subsidy_budget_usd');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const EXCEL_FILE_URL =
    'https://res.cloudinary.com/dmuvs05yp/raw/upload/v1738770665/APMD_ECOWAS_Input_Simulated_2006_2025.xlsx';

  const economicIndicatorFields = [
    { key: 'input_subsidy_budget_usd', label: t('economicIndicators.subsidyBudget'), format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'credit_access_pct', label: t('economicIndicators.creditAccess'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'input_price_index_2006_base', label: t('economicIndicators.inputPriceIndex'), format: (v: number) => v.toFixed(2) },
    { key: 'input_import_value_usd', label: t('economicIndicators.inputImportValue'), format: (v: number) => `$${v.toLocaleString()}` },
  ] as const;

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('economicIndicators.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    const fetchExcelData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(EXCEL_FILE_URL);
        if (!response.ok) throw new Error('Failed to download Excel file');

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: InputData[] = XLSX.utils.sheet_to_json(worksheet);

        const filtered = jsonData.filter(
          (row) => row.country?.toString().toLowerCase() === country.toLowerCase()
        );

        if (filtered.length === 0) {
          setError(t('economicIndicators.errors.noData', { country }));
          setLoading(false);
          return;
        }

        const maxYear = Math.max(...filtered.map(d => d.year), 2025);
        setSelectedYear(maxYear);
        setCountryData(filtered);
        setLoading(false);
      } catch (err) {
        console.error('Excel fetch error:', err);
        setError(t('economicIndicators.errors.fetchFailed'));
        setLoading(false);
      }
    };

    fetchExcelData();
  }, [country, t]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map(d => d.year))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find(d => d.year === selectedYear);

  const safeFormat = (value: unknown, formatter: (v: number) => string): string => {
    if (typeof value === 'number' && !isNaN(value)) {
      return formatter(value);
    }
    return 'N/A';
  };

  const handleCSVDownload = () => {
    const csvData = countryData.map(data => {
      const row: Record<string, string | number> = { Year: data.year };
      economicIndicatorFields.forEach(field => {
        row[field.label] = safeFormat(data[field.key], field.format);
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${country}_economic_indicators.csv`;
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
          a.download = `${country}_economic_dashboard.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (err) {
      console.error(err);
      alert(t('economicIndicators.errors.pngFailed'));
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
      pdf.text(`${country.toUpperCase()} Economic Indicators`, 10, 15);
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 10, 22);
      pdf.save(`${country}_economic_report.pdf`);
    } catch (err) {
      console.error(err);
      alert(t('economicIndicators.errors.pdfFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] p-8">
        <p className="text-[var(--dark-green)] text-lg">{t('economicIndicators.loading')}</p>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] p-8">
        <p className="text-[var(--wine)] text-lg">{error || t('economicIndicators.errors.noData', { country })}</p>
      </div>
    );
  }

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" ref={dashboardRef}>
        <h1 className="text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2">
          <FaChartLine /> {t('economicIndicators.title', { countryName })}
        </h1>
        

        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={handleCSVDownload} className="bg-[var(--dark-green)] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[var(--olive-green)]">
            <FaDownload /> CSV
          </button>
          <button onClick={handlePNGDownload} className="bg-[var(--dark-green)] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[var(--olive-green)]">
            <FaDownload /> PNG
          </button>
          <button onClick={handlePDFDownload} className="bg-[var(--dark-green)] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[var(--olive-green)]">
            <FaDownload /> PDF
          </button>
        </div>

        <div className="mb-6">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-3 border rounded text-[var(--dark-green)]"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {economicIndicatorFields.map(field => (
            <div key={field.key} className="bg-[var(--yellow)] p-3 rounded-lg shadow">
              <h3 className="font-semibold text-[var(--dark-green)] text-sm">{field.label} ({selectedYear})</h3>
              <p className="text-xl font-bold text-[var(--wine)] mt-2">
                {safeFormat(selectedData[field.key], field.format)}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-10">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-[var(--dark-green)]">
              {t('economicIndicators.trendsTitle', { year: '2006–2025' })}
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="input_subsidy_budget_usd" stroke="var(--dark-green)" name="Subsidy Budget ($)" strokeWidth={2} />
                <Line type="monotone" dataKey="credit_access_pct" stroke="var(--red)" name="Credit Access (%)" strokeWidth={2} />
                <Line type="monotone" dataKey="input_price_index_2006_base" stroke="var(--yellow)" name="Price Index" strokeWidth={2} />
                <Line type="monotone" dataKey="input_import_value_usd" stroke="var(--wine)" name="Import Value ($)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-[var(--dark-green)]">{t('economicIndicators.comparisonChart')}</h2>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as EconomicIndicatorMetric)}
              className="mb-4 p-3 border rounded text-[var(--dark-green)]"
            >
              {economicIndicatorFields.map(f => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey={selectedMetric} fill="var(--olive-green)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
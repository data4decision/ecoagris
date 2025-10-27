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
import '@/styles/dashboard-styles.css';

interface InputData {
  country: string;
  year: number;
  input_subsidy_budget_usd?: number;
  credit_access_pct?: number;
  input_price_index_2006_base?: number;
  input_import_value_usd?: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Input_Data: InputData[];
}

type EconomicIndicatorMetric =
  | 'input_subsidy_budget_usd'
  | 'credit_access_pct'
  | 'input_price_index_2006_base'
  | 'input_import_value_usd';

export default function EconomicIndicatorsPage() {
  const { country } = useParams();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<EconomicIndicatorMetric>('input_subsidy_budget_usd');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const economicIndicatorFields = [
    { key: 'input_subsidy_budget_usd', label: t('economicIndicators.subsidyBudget'), format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'credit_access_pct', label: t('economicIndicators.creditAccess'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'input_price_index_2006_base', label: t('economicIndicators.inputPriceIndex'), format: (v: number) => v.toFixed(2) },
    { key: 'input_import_value_usd', label: t('economicIndicators.inputImportValue'), format: (v: number) => `$${v.toLocaleString()}` },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('economicIndicators.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/agric/APMD_ECOWAS_Input_Simulated_2006_2025.json');
        if (!response.ok) throw new Error(t('economicIndicators.errors.fetchFailed'));
        const jsonData = (await response.json()) as Dataset;

        const years = jsonData.Simulated_Input_Data.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Simulated_Input_Data.filter(
          (d) => d.country.toLowerCase() === (country as string).toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('economicIndicators.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (error) {
        setError(t('economicIndicators.errors.fetchFailed'));
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
      economicIndicatorFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('economicIndicators.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_economic_indicators_data.csv`;
    link.click();
  };

  const handleDownload = async (format: 'png' | 'pdf') => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found');
      alert(t(`economicIndicators.errors.${format}Failed`));
      return;
    }

    try {
      // Force chart rendering
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for charts to render

      // Apply snapshot styles
      dashboardRef.current.classList.add('snapshot');
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for styles

      // Capture canvas with A4 dimensions
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
      });

      dashboardRef.current.classList.remove('snapshot');

      // Validate canvas
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas is empty or invalid:', { width: canvas?.width, height: canvas?.height });
        throw new Error(t('economicIndicators.errors.invalidCanvas'));
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated from canvas');
        throw new Error(t('economicIndicators.errors.invalidImageData'));
      }

      if (format === 'png') {
        // PNG download
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${country}_economic_indicators_dashboard.png`;
        link.click();
        console.log('PNG downloaded successfully');
      } else {
        // PDF download
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4', // 210mm x 297mm
        });

        const imgWidth = 190; // A4 width minus 10mm margins on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.setFontSize(12);
        pdf.text(t('economicIndicators.title', { countryName: (country as string).toUpperCase() }), 10, 10);
        pdf.text(t('economicIndicators.metrics'), 10, 18);
        pdf.text(t('economicIndicators.report_exported', { date: new Date().toLocaleDateString() }), 10, 26);
        pdf.addImage(imgData, 'PNG', 10, 35, imgWidth, imgHeight);
        pdf.save(`${country}_economic_indicators_dashboard.pdf`);
        console.log('PDF downloaded successfully');
      }
    } catch (err) {
      console.error(`${format.toUpperCase()} generation error:`, err);
      alert(t(`economicIndicators.errors.${format}Failed`));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('economicIndicators.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || t('economicIndicators.errors.noData', { country })}</p>
        </div>
      </div>
    );
  }

  const countryName = (country as string).charAt(0).toUpperCase() + (country as string).slice(1);

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content" ref={dashboardRef}>
        {/* Page Header */}
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={t('economicIndicators.ariaTitle', { country: countryName })}
        >
          <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" /> {t('economicIndicators.title', { countryName })}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">{t('economicIndicators.simulatedDataNote')}</p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('economicIndicators.downloadCSVLabel')}
          >
            <FaDownload /> {t('economicIndicators.downloadCSV')}
          </button>
          <button
            onClick={() => handleDownload('png')}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('economicIndicators.downloadPNGLabel')}
          >
            <FaDownload /> {t('economicIndicators.downloadPNG')}
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('economicIndicators.downloadPDFLabel')}
          >
            <FaDownload /> {t('economicIndicators.downloadPDF')}
          </button>
        </div>

        {/* Year Selection for Cards */}
        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('economicIndicators.yearSelectLabel')}
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

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mb-6 max-w-full">
          {economicIndicatorFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0 card"
              aria-label={t('economicIndicators.metricCard', { label: field.label, year: selectedYear })}
            >
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{field.label} ({selectedYear})</h3>
              <p className="text-[var(--wine)] text-base sm:text-lg">
                {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('economicIndicators.na')}
              </p>
            </div>
          ))}
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 gap-6 max-w-full">
          {/* Line Chart: Economic Trends */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section" aria-label={t('economicIndicators.trendsChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('economicIndicators.trendsTitle', { year: selectedYear })}
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
                  dataKey="input_subsidy_budget_usd"
                  stroke="var(--olive-green)"
                  name={t('economicIndicators.subsidyBudget')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="credit_access_pct"
                  stroke="var(--wine)"
                  name={t('economicIndicators.creditAccess')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="input_price_index_2006_base"
                  stroke="var(--yellow)"
                  name={t('economicIndicators.inputPriceIndex')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="input_import_value_usd"
                  stroke="var(--medium-green)"
                  name={t('economicIndicators.inputImportValue')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Year Comparison for Selected Country */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section" aria-label={t('economicIndicators.comparisonChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('economicIndicators.comparisonTitle', { country: countryName })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('economicIndicators.metricSelectLabel')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as EconomicIndicatorMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {economicIndicatorFields.map((field) => (
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
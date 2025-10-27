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

interface Dataset {
  Simulated_Input_Data: InputData[];
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
  const { country } = useParams();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<SupplyChainMetric>('stockouts_days_per_year');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestYear, setLatestYear] = useState(2025);

  const supplyChainFields = [
    { key: 'cereal_seeds_tons', label: t('supplyChain.cerealSeeds'), format: (v: number) => v.toLocaleString() },
    { key: 'fertilizer_tons', label: t('supplyChain.fertilizer'), format: (v: number) => v.toLocaleString() },
    { key: 'pesticide_liters', label: t('supplyChain.pesticides'), format: (v: number) => v.toLocaleString() },
    { key: 'stockouts_days_per_year', label: t('supplyChain.stockoutDays'), format: (v: number) => v.toLocaleString() },
    { key: 'distribution_timeliness_pct', label: t('supplyChain.distributionTimeliness'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'agro_dealer_count', label: t('supplyChain.agroDealerCount'), format: (v: number) => v.toLocaleString() },
    { key: 'local_production_inputs_tons', label: t('supplyChain.localProductionInputs'), format: (v: number) => v.toLocaleString() },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('supplyChain.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/agric/APMD_ECOWAS_Input_Simulated_2006_2025.json');
        if (!response.ok) throw new Error(t('supplyChain.errors.fetchFailed'));
        const jsonData = (await response.json()) as Dataset;

        const years = jsonData.Simulated_Input_Data.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setLatestYear(maxYear);
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Simulated_Input_Data.filter(
          (d) => d.country.toLowerCase() === (country as string).toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('supplyChain.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('supplyChain.errors.fetchFailed'));
        setLoading(false);
      }
    }

    fetchData();
  }, [country, t]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map((d) => d.year))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find((d) => d.year === selectedYear);
  const totalInputAvailability = selectedData
    ? (selectedData.cereal_seeds_tons || 0) +
      (selectedData.fertilizer_tons || 0) +
      (selectedData.pesticide_liters || 0) +
      (selectedData.local_production_inputs_tons || 0)
    : 0;

  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => {
      const row: { [key: string]: string | number } = { Year: data.year };
      supplyChainFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('supplyChain.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_supply_chain_data.csv`;
    link.click();
  };

  const handleDownload = async (format: 'png' | 'pdf') => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found');
      alert(t(`supplyChain.errors.${format}Failed`));
      return;
    }

    try {
      // Force chart rendering by triggering a state update
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for charts to render

      // Apply snapshot styles
      dashboardRef.current.classList.add('snapshot');
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for styles

      // Capture canvas
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
      });

      dashboardRef.current.classList.remove('snapshot');

      // Validate canvas
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas is empty or invalid:', { width: canvas?.width, height: canvas?.height });
        throw new Error(t('supplyChain.errors.invalidCanvas'));
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated from canvas');
        throw new Error(t('supplyChain.errors.invalidImageData'));
      }

      if (format === 'png') {
        // PNG download
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${country}_supply_chain_dashboard.png`;
        link.click();
        console.log('PNG downloaded successfully');
      } else {
        // PDF download
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const imgWidth = 190; // A4 width in mm minus margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.setFontSize(12);
        pdf.text(t('supplyChain.title', { countryName: (country as string).toUpperCase() }), 10, 10);
        pdf.text(t('supplyChain.metrics'), 10, 18);
        pdf.text(t('supplyChain.report_exported', { date: new Date().toLocaleDateString() }), 10, 26);
        pdf.addImage(imgData, 'PNG', 10, 35, imgWidth, imgHeight);
        pdf.save(`${country}_supply_chain_dashboard.pdf`);
        console.log('PDF downloaded successfully');
      }
    } catch (err) {
      console.error(`${format.toUpperCase()} generation error:`, err);
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

  const countryName = (country as string).charAt(0).toUpperCase() + (country as string).slice(1);

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
            aria-label={t('supplyChain.downloadCSVLabel')}
          >
            <FaDownload /> {t('supplyChain.downloadCSV')}
          </button>
          <button
            onClick={() => handleDownload('png')}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('supplyChain.downloadPNGLabel')}
          >
            <FaDownload /> {t('supplyChain.downloadPNG')}
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('supplyChain.downloadPDFLabel')}
          >
            <FaDownload /> {t('supplyChain.downloadPDF')}
          </button>
        </div>

        {/* Year Selection for Cards */}
        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('supplyChain.yearSelectLabel')}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 max-w-full">
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={t('supplyChain.totalInputCard', { year: selectedYear })}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{t('supplyChain.totalInput', { year: selectedYear })}</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">{totalInputAvailability.toLocaleString()} {t('supplyChain.units')}</p>
          </div>
          {supplyChainFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0"
              aria-label={t('supplyChain.metricCard', { label: field.label, year: selectedYear })}
            >
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{field.label} ({selectedYear})</h3>
              <p className="text-[var(--wine)] text-base sm:text-lg">
                {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('supplyChain.na')}
              </p>
            </div>
          ))}
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 gap-6 max-w-full">
          {/* Line Chart: Supply Chain Trends */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section" aria-label={t('supplyChain.trendsChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('supplyChain.trendsTitle', { year: latestYear })}
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
                  stroke="var(--medium-green)"
                  name={t('supplyChain.cerealSeeds')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="fertilizer_tons"
                  stroke="var(--wine)"
                  name={t('supplyChain.fertilizer')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="pesticide_liters"
                  stroke="var(--olive-green)"
                  name={t('supplyChain.pesticides')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="stockouts_days_per_year"
                  stroke="var(--dark-green)"
                  name={t('supplyChain.stockoutDays')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="distribution_timeliness_pct"
                  stroke="var(--yellow)"
                  name={t('supplyChain.distributionTimeliness')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="agro_dealer_count"
                  stroke="#4B0082"
                  name={t('supplyChain.agroDealerCount')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="local_production_inputs_tons"
                  stroke="#FF4500"
                  name={t('supplyChain.localProductionInputs')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Year Comparison for Selected Country */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section" aria-label={t('supplyChain.comparisonChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('supplyChain.comparisonTitle', { country: countryName })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('supplyChain.metricSelectLabel')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as SupplyChainMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {supplyChainFields.map((field) => (
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
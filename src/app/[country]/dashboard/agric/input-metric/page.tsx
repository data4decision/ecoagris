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

interface Dataset {
  Simulated_Input_Data: InputData[];
}

export default function InputMetricsPage() {
  const { country } = useParams();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPercentageChart, setShowPercentageChart] = useState(true);
  const [showValueChart, setShowValueChart] = useState(true);

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('inputMetrics.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/agric/APMD_ECOWAS_Input_Simulated_2006_2025.json');
        if (!response.ok) throw new Error(t('inputMetrics.errors.fetchFailed'));
        const jsonData = (await response.json()) as Dataset;

        const years = jsonData.Simulated_Input_Data.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Simulated_Input_Data.filter(
          (d) => d.country.toLowerCase() === (country as string).toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('inputMetrics.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (error) {
        setError(t('inputMetrics.errors.fetchFailed'));
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
    const csvData = countryData.map((data) => ({
      Year: data.year,
      'Distribution Timeliness (%)': data.distribution_timeliness_pct ?? t('inputMetrics.na'),
      'Input Price Index (2006 Base)': data.input_price_index_2006_base ?? t('inputMetrics.na'),
      'Agro-Dealer Count': data.agro_dealer_count ?? t('inputMetrics.na'),
      'Input Import Value (USD)': data.input_import_value_usd ?? t('inputMetrics.na'),
      'Local Production Inputs (tons)': data.local_production_inputs_tons ?? t('inputMetrics.na'),
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_input_metrics.csv`;
    link.click();
  };

  const handleDownload = async (format: 'png' | 'pdf') => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found');
      alert(t(`inputMetrics.errors.${format}Failed`));
      return;
    }

    try {
      // Force chart rendering
      setShowPercentageChart(true);
      setShowValueChart(true);
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
        throw new Error(t('inputMetrics.errors.invalidCanvas'));
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated from canvas');
        throw new Error(t('inputMetrics.errors.invalidImageData'));
      }

      if (format === 'png') {
        // PNG download
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${country}_input_metrics.png`;
        link.click();
        console.log('PNG downloaded successfully');
      } else {
        // PDF download
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2], // Scale down for PDF
        });

        pdf.setFontSize(12);
        pdf.text(t('inputMetrics.title', { countryName: (country as string).toUpperCase() }), 10, 10);
        pdf.text(t('inputMetrics.metrics'), 10, 18);
        pdf.text(t('inputMetrics.report_exported', { date: new Date().toLocaleDateString() }), 10, 26);
        pdf.addImage(imgData, 'PNG', 10, 35, canvas.width / 2 - 20, canvas.height / 2 - 20);
        pdf.save(`${country}_input_metrics.pdf`);
        console.log('PDF downloaded successfully');
      }
    } catch (err) {
      console.error(`${format.toUpperCase()} generation error:`, err);
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

  const countryName = (country as string).charAt(0).toUpperCase() + (country as string).slice(1);

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
            className="bg-[var(--medium-green)] text-[var(--white)] px-3 py-2 rounded flex items-center gap-2 hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-colors"
            aria-label={t('inputMetrics.downloadCSVLabel')}
          >
            <FaDownload /> {t('inputMetrics.downloadCSV')}
          </button>
          <button
            onClick={() => handleDownload('png')}
            className="bg-[var(--medium-green)] text-[var(--white)] px-3 py-2 rounded flex items-center gap-2 hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-colors"
            aria-label={t('inputMetrics.downloadPNGLabel')}
          >
            <FaDownload /> {t('inputMetrics.downloadPNG')}
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            className="bg-[var(--medium-green)] text-[var(--white)] px-3 py-2 rounded flex items-center gap-2 hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-colors"
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
        <section className="bg-[var(--white)] p-4 rounded-lg mb-6 border-l-4 border-[var(--medium-green)]">
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
                  dataKey="distribution_timeliness_pct"
                  stroke="var(--medium-green)"
                  name={t('inputMetrics.distributionTimeliness')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="input_price_index_2006_base"
                  stroke="var(--wine)"
                  name={t('inputMetrics.inputPriceIndex')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* Value-Based Metrics Chart */}
        <section className="bg-[var(--white)] p-4 rounded-lg mb-6 border-l-4 border-[var(--medium-green)]">
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
                  dataKey="agro_dealer_count"
                  stroke="var(--medium-green)"
                  name={t('inputMetrics.agroDealerCount')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="input_import_value_usd"
                  stroke="var(--wine)"
                  name={t('inputMetrics.inputImportValue')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="local_production_inputs_tons"
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
                <tr>
                  <td className="border border-[var(--yellow)] p-2">{t('inputMetrics.distributionTimeliness')}</td>
                  <td className="border border-[var(--yellow)] p-2">
                    {selectedData.distribution_timeliness_pct != null ? `${selectedData.distribution_timeliness_pct.toFixed(1)}%` : t('inputMetrics.na')}
                  </td>
                </tr>
                <tr>
                  <td className="border border-[var(--yellow)] p-2">{t('inputMetrics.inputPriceIndex')}</td>
                  <td className="border border-[var(--yellow)] p-2">
                    {selectedData.input_price_index_2006_base != null ? selectedData.input_price_index_2006_base.toFixed(2) : t('inputMetrics.na')}
                  </td>
                </tr>
                <tr>
                  <td className="border border-[var(--yellow)] p-2">{t('inputMetrics.agroDealerCount')}</td>
                  <td className="border border-[var(--yellow)] p-2">
                    {selectedData.agro_dealer_count != null ? selectedData.agro_dealer_count.toLocaleString() : t('inputMetrics.na')}
                  </td>
                </tr>
                <tr>
                  <td className="border border-[var(--yellow)] p-2">{t('inputMetrics.inputImportValue')}</td>
                  <td className="border border-[var(--yellow)] p-2">
                    {selectedData.input_import_value_usd != null ? `$${selectedData.input_import_value_usd.toLocaleString()}` : t('inputMetrics.na')}
                  </td>
                </tr>
                <tr>
                  <td className="border border-[var(--yellow)] p-2">{t('inputMetrics.localProductionInputs')}</td>
                  <td className="border border-[var(--yellow)] p-2">
                    {selectedData.local_production_inputs_tons != null ? selectedData.local_production_inputs_tons.toLocaleString() : t('inputMetrics.na')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
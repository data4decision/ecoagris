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

// ---------------------------------------------------------------------
// 1. TypeScript Interfaces
// ---------------------------------------------------------------------
interface LivestockData {
  country: string;
  year: number;
  vaccination_coverage_pct: number;
  fmd_incidents_count: number;
  veterinary_facilities_count: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Livestock_Data: LivestockData[];
}

// Metric keys for bar chart
type HealthMetric =
  | 'vaccination_coverage_pct'
  | 'fmd_incidents_count'
  | 'veterinary_facilities_count';

// ---------------------------------------------------------------------
// 2. Main Component
// ---------------------------------------------------------------------
export default function HealthDashboard() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);

  // State
  const [countryData, setCountryData] = useState<LivestockData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric>('vaccination_coverage_pct');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------------------
  // 3. Field Metadata (labels + formatters)
  // -----------------------------------------------------------------
  const healthFields = [
    {
      key: 'vaccination_coverage_pct',
      label: t('health.vaccinationCoverage'),
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      key: 'fmd_incidents_count',
      label: t('health.fmdIncidents'),
      format: (v: number) => v.toLocaleString(),
    },
    {
      key: 'veterinary_facilities_count',
      label: t('health.veterinaryFacilities'),
      format: (v: number) => v.toLocaleString(),
    },
  ];

  // -----------------------------------------------------------------
  // 4. Fetch & Parse Data
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('health.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!response.ok) throw new Error(t('health.errors.fetchFailed'));

        const jsonData = (await response.json()) as Dataset;

        const years = jsonData.Simulated_Livestock_Data.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setSelectedYear(maxYear);

        const filtered = jsonData.Simulated_Livestock_Data
          .filter((d) => d.country.toLowerCase() === country.toLowerCase())
          .map((d) => ({
            ...d,
            vaccination_coverage_pct: Number(d.vaccination_coverage_pct) || 0,
            fmd_incidents_count: Number(d.fmd_incidents_count) || 0,
            veterinary_facilities_count: Number(d.veterinary_facilities_count) || 0,
          }));

        if (filtered.length === 0) {
          setError(t('health.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filtered);
        setLoading(false);
      } catch (err) {
        setError(t('health.errors.fetchFailed'));
        setLoading(false);
      }
    }

    fetchData();
  }, [country, t]);

  // -----------------------------------------------------------------
  // 5. Derived Data
  // -----------------------------------------------------------------
  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map((d) => d.year))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find((d) => d.year === selectedYear);

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  // -----------------------------------------------------------------
  // 6. CSV Download
  // -----------------------------------------------------------------
  const handleCSVDownload = () => {
    const csvData = countryData.map((d) => {
      const row: { [key: string]: string | number } = { Year: d.year };
      healthFields.forEach((field) => {
        row[field.label] = d[field.key] != null ? field.format(d[field.key] as number) : t('health.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_health_data.csv`;
    link.click();
  };

  // -----------------------------------------------------------------
  // 7. PNG Download (with snapshot mode)
  // -----------------------------------------------------------------
  const handlePNGDownload = async () => {
    if (!dashboardRef.current) {
      alert(t('health.errors.pngFailed'));
      return;
    }

    try {
      await new Promise((r) => setTimeout(r, 1000));
      dashboardRef.current.classList.add('snapshot');
      await new Promise((r) => setTimeout(r, 500));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      dashboardRef.current.classList.remove('snapshot');

      if (!canvas || canvas.width === 0) throw new Error('Invalid canvas');

      const imgData = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${country}_health_dashboard.png`;
      link.click();
    } catch (err) {
      console.error(err);
      alert(t('health.errors.pngFailed'));
    }
  };

  // -----------------------------------------------------------------
  // 8. PDF Download
  // -----------------------------------------------------------------
  const handlePDFDownload = async () => {
    if (!dashboardRef.current) {
      alert(t('health.errors.pdfFailed'));
      return;
    }

    try {
      await new Promise((r) => setTimeout(r, 1000));
      dashboardRef.current.classList.add('snapshot');
      await new Promise((r) => setTimeout(r, 500));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      dashboardRef.current.classList.remove('snapshot');

      if (!canvas || canvas.width === 0) throw new Error('Invalid canvas');

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.setFontSize(12);
      pdf.text(t('health.title', { countryName: country.toUpperCase() }), 10, 10);
      pdf.text(t('health.reportExported', { date: new Date().toLocaleDateString() }), 10, 18);
      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
      pdf.save(`${country}_health_dashboard.pdf`);
    } catch (err) {
      console.error(err);
      alert(t('health.errors.pdfFailed'));
    }
  };

  // -----------------------------------------------------------------
  // 9. Early Returns (Loading / Error)
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('health.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">
            {error || t('health.errors.noData', { country })}
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // 10. Render Dashboard
  // -----------------------------------------------------------------
  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" ref={dashboardRef}>
        {/* Header */}
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={t('health.ariaTitle', { country: countryName })}
        >
          <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" />
          {t('health.title', { countryName })}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">{t('health.simulatedDataNote')}</p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            aria-label={t('health.downloadCSVLabel')}
          >
            <FaDownload /> {t('health.downloadCSV')}
          </button>
          <button
            onClick={handlePNGDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            aria-label={t('health.downloadPNGLabel')}
          >
            <FaDownload /> {t('health.downloadPNG')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            aria-label={t('health.downloadPDFLabel')}
          >
            <FaDownload /> {t('health.downloadPDF')}
          </button>
        </div>

        {/* Year Selector */}
        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('health.yearSelectLabel')}
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
          {healthFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0"
              aria-label={t('health.metricCard', { label: field.label, year: selectedYear })}
            >
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">
                {field.label} ({selectedYear})
              </h3>
              <p className="text-[var(--wine)] text-base sm:text-lg font-bold">
                {selectedData[field.key] != null
                  ? field.format(selectedData[field.key] as number)
                  : t('health.na')}
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 max-w-full">
          {/* Line Chart: Health Trends Over Time */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('health.trendsTitle')}
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  interval="preserveStartEnd"
                  height={50}
                />
                <YAxis fontSize={10} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                <Line
                  type="monotone"
                  dataKey="vaccination_coverage_pct"
                  stroke="var(--olive-green)"
                  name={t('health.vaccinationCoverage')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="fmd_incidents_count"
                  stroke="var(--wine)"
                  name={t('health.fmdIncidents')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="veterinary_facilities_count"
                  stroke="var(--medium-green)"
                  name={t('health.veterinaryFacilities')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Selected Metric Over Years */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('health.comparisonTitle', { country: countryName })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('health.metricSelectLabel')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as HealthMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {healthFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  interval="preserveStartEnd"
                  height={50}
                />
                <YAxis fontSize={10} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey={selectedMetric} fill="var(--olive-green)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
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
// 1. TypeScript Interfaces (Matches Real JSON)
// ---------------------------------------------------------------------
interface GrazingData {
  country: string;
  year: number;
  grazing_area_ha: number;
  transhumance_events: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Livestock_Data: GrazingData[]; // CORRECT KEY
}

type GrazingMetric = 'grazing_area_ha' | 'transhumance_events';

// ---------------------------------------------------------------------
// 2. Main Component
// ---------------------------------------------------------------------
export default function GrazingDashboard() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [countryData, setCountryData] = useState<GrazingData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<GrazingMetric>('grazing_area_ha');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------------------
  // 3. Field Metadata
  // -----------------------------------------------------------------
  const grazingFields = [
    {
      key: 'grazing_area_ha',
      label: t('grazing.area'),
      format: (v: number) => `${v.toLocaleString()} ha`,
    },
    {
      key: 'transhumance_events',
      label: t('grazing.events'),
      format: (v: number) => v.toLocaleString(),
    },
  ];

  // -----------------------------------------------------------------
  // 4. Fetch & Parse Data (CORRECT PATH + KEY)
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('grazing.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // CORRECT FILE PATH
        const response = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        
        if (!response.ok) {
          console.error('Fetch failed:', response.status, response.statusText);
          throw new Error(t('grazing.errors.fetchFailed'));
        }

        const jsonData = (await response.json()) as Dataset;

        // CORRECT KEY
        const rawData = jsonData.Simulated_Livestock_Data;

        if (!Array.isArray(rawData)) {
          throw new Error('Invalid JSON: Simulated_Livestock_Data missing or not an array');
        }

        console.log('Loaded grazing data:', rawData); // Debug

        const years = rawData.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setSelectedYear(maxYear);

        const filtered = rawData
          .filter((d) => d.country?.toLowerCase() === country.toLowerCase())
          .map((d) => ({
            country: d.country,
            year: d.year,
            grazing_area_ha: Number(d.grazing_area_ha) || 0,
            transhumance_events: Number(d.transhumance_events) || 0,
          }));

        if (filtered.length === 0) {
          setError(t('grazing.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filtered);
        setLoading(false);
      } catch (err) {
        console.error('Data load error:', err);
        setError(err instanceof Error ? err.message : t('grazing.errors.fetchFailed'));
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
      grazingFields.forEach((field) => {
        row[field.label] = d[field.key] != null ? field.format(d[field.key] as number) : t('grazing.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_grazing_data.csv`;
    link.click();
  };

  // -----------------------------------------------------------------
  // 7. PNG Download
  // -----------------------------------------------------------------
  const handlePNGDownload = async () => {
    if (!dashboardRef.current) {
      alert(t('grazing.errors.pngFailed'));
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
      link.download = `${country}_grazing_dashboard.png`;
      link.click();
    } catch (err) {
      console.error(err);
      alert(t('grazing.errors.pngFailed'));
    }
  };

  // -----------------------------------------------------------------
  // 8. PDF Download
  // -----------------------------------------------------------------
  const handlePDFDownload = async () => {
    if (!dashboardRef.current) {
      alert(t('grazing.errors.pdfFailed'));
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
      pdf.text(t('grazing.title', { countryName: country.toUpperCase() }), 10, 10);
      pdf.text(t('grazing.reportExported', { date: new Date().toLocaleDateString() }), 10, 18);
      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
      pdf.save(`${country}_grazing_dashboard.pdf`);
    } catch (err) {
      console.error(err);
      alert(t('grazing.errors.pdfFailed'));
    }
  };

  // -----------------------------------------------------------------
  // 9. Early Returns
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] items-center justify-center p-6">
        <p className="text-[var(--dark-green)] text-lg">{t('grazing.loading')}</p>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] items-center justify-center p-6">
        <p className="text-[var(--wine)] text-lg">
          {error || t('grazing.errors.noData', { country })}
        </p>
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
          aria-label={t('grazing.ariaTitle', { country: countryName })}
        >
          <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" />
          {t('grazing.title', { countryName })}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          {t('grazing.simulatedDataNote')}
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            aria-label={t('grazing.downloadCSVLabel')}
          >
            <FaDownload /> {t('grazing.downloadCSV')}
          </button>
          <button
            onClick={handlePNGDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            aria-label={t('grazing.downloadPNGLabel')}
          >
            <FaDownload /> {t('grazing.downloadPNG')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            aria-label={t('grazing.downloadPDFLabel')}
          >
            <FaDownload /> {t('grazing.downloadPDF')}
          </button>
        </div>

        {/* Year Selector */}
        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('grazing.yearSelectLabel')}
          </label>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 max-w-full">
          {grazingFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0"
              aria-label={t('grazing.metricCard', { label: field.label, year: selectedYear })}
            >
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">
                {field.label} ({selectedYear})
              </h3>
              <p className="text-[var(--wine)] text-base sm:text-lg font-bold">
                {selectedData[field.key] != null
                  ? field.format(selectedData[field.key] as number)
                  : t('grazing.na')}
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 max-w-full">
          {/* Line Chart */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('grazing.trendsTitle')}
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" fontSize={10} angle={-45} textAnchor="end" height={50} />
                <YAxis fontSize={10} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                <Line
                  type="monotone"
                  dataKey="grazing_area_ha"
                  stroke="var(--olive-green)"
                  name={t('grazing.area')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="transhumance_events"
                  stroke="var(--wine)"
                  name={t('grazing.events')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('grazing.comparisonTitle', { country: countryName })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('grazing.metricSelectLabel')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as GrazingMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {grazingFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" fontSize={10} angle={-45} textAnchor="end" height={50} />
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
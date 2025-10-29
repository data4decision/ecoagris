'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
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
import { FaDownload, FaSeedling } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';

interface RiceProductionData {
  country: string;
  year: number;
  production_tonnes: number;
  [key: string]: unknown;
}

interface Dataset {
  Data: { Column1: string; [year: string]: number | string }[];
}

type RiceProductionMetric = 'production_tonnes';

export default function YearTrendPage() {
  const { t } = useTranslation('common');
  const { country } = useParams();
  const [countryData, setCountryData] = useState<RiceProductionData[]>([]);
  const [selectedMetric] = useState<RiceProductionMetric>('production_tonnes');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const riceProductionFields = [
    {
      key: 'production_tonnes',
      label: t('rice.yearTrend.production'),
      format: (v: number) => v.toLocaleString(),
      icon: <FaSeedling className="text-[var(--dark-green)] text-lg" />,
    },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('rice.yearTrend.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/rice/ecowas_rice_production_2005_2024_simulated.json');
        if (!response.ok) {
          throw new Error(t('rice.yearTrend.errors.fetchFailed', { status: response.status, text: response.statusText }));
        }
        const jsonData = (await response.json()) as Dataset;

        if (!jsonData.Data || !Array.isArray(jsonData.Data)) {
          throw new Error(t('rice.yearTrend.errors.invalidFormat'));
        }

        const normalizedData: RiceProductionData[] = [];
        jsonData.Data.forEach((countryObj) => {
          const countryName = countryObj.Column1;
          if (countryName.toLowerCase() !== (country as string).toLowerCase()) return;
          for (let year = 2005; year <= 2024; year++) {
            const production = countryObj[year.toString()];
            if (typeof production === 'number') {
              normalizedData.push({
                country: countryName,
                year,
                production_tonnes: production,
              });
            }
          }
        });

        if (normalizedData.length === 0) {
          setError(t('rice.yearTrend.errors.noData', { country }));
          setLoading(false);
          return;
        }

        const years = normalizedData.map((d) => d.year).filter((y) => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years, 2024) : 2024;
        setSelectedYear(maxYear);

        setCountryData(normalizedData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(t('rice.yearTrend.errors.loadingError', { message: (err as Error).message }));
        setLoading(false);
      }
    }

    fetchData();
  }, [country, t]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map((d) => d.year).filter((y) => typeof y === 'number'))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find((d) => d.year === selectedYear);

  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => {
      const row: { [key: string]: string | number } = { [t('rice.yearTrend.year')]: data.year };
      riceProductionFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('rice.yearTrend.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_rice_production_year_trend.csv`;
    link.click();
  };

  // Same as MalnutritionPage — 100% working
  const handlePDFDownload = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) {
      console.error(t('rice.yearTrend.errors.dashboardNotFound'));
      return;
    }

    try {
      const canvas = await html2canvas(dashboard, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`${country}_rice_production_year_trend.pdf`);
    } catch (err) {
      console.error(t('rice.yearTrend.errors.pdfError'), err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('rice.yearTrend.loading')}</p>
        </div>
      </div>
    );
  }

  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || t('rice.yearTrend.errors.noData', { country })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-2 min-w-0" id="dashboard-content">
        {/* Page Header */}
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={t('rice.yearTrend.overview', { country })}
        >
          <FaSeedling aria-hidden="true" className="text-lg sm:text-xl" /> {t('rice.yearTrend.title')} -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          {t('rice.yearTrend.simulatedNote')}
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('rice.yearTrend.downloadCSV')}
          >
            <FaDownload /> {t('rice.yearTrend.downloadCSV')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('rice.yearTrend.downloadPDF')}
          >
            <FaDownload /> {t('rice.yearTrend.downloadPDF')}
          </button>
        </div>

        {/* Year Selection */}
        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('rice.yearTrend.selectYear')}
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

        {/* Metric Card — Same as MalnutritionPage */}
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-4 mb-6 max-w-full">
          {riceProductionFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0"
              aria-label={t('rice.yearTrend.cardLabel', { label: field.label, year: selectedYear })}
            >
              <div className="flex items-center gap-2 mb-1">
                {field.icon}
                <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">
                  {field.label} ({selectedYear})
                </h3>
              </div>
              <p className="text-[var(--wine)] text-base sm:text-lg">
                {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('rice.yearTrend.na')}
              </p>
            </div>
          ))}
        </div>

        {/* Line Chart — Same as MalnutritionPage */}
        <div className="grid grid-cols-1 gap-6 max-w-full">
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('rice.yearTrend.trendsChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('rice.yearTrend.trendsTitle', { start: 2005, end: selectedYear })}
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
                  dataKey="production_tonnes"
                  stroke="var(--olive-green)"
                  name={t('rice.yearTrend.production')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
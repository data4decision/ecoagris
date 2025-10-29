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
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts';
import { FaChartLine, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';

interface HealthOutcomeData {
  country: string;
  year: number;
  child_obesity_prevalence_pct?: number;
  maternal_mortality_ratio_per_100k?: number;
  low_birth_weight_prevalence_pct?: number;
  [key: string]: unknown;
}

interface Dataset {
  Nutrition_Data: HealthOutcomeData[];
}

type HealthOutcomeMetric =
  | 'child_obesity_prevalence_pct'
  | 'maternal_mortality_ratio_per_100k'
  | 'low_birth_weight_prevalence_pct';

export default function HealthOutcomesPage() {
  const { t } = useTranslation('common');
  const { country } = useParams();
  const [countryData, setCountryData] = useState<HealthOutcomeData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<HealthOutcomeMetric>('child_obesity_prevalence_pct');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const healthOutcomeFields = [
    { key: 'child_obesity_prevalence_pct', label: t('healthOutcomes.childObesity'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'maternal_mortality_ratio_per_100k', label: t('healthOutcomes.maternalMortality'), format: (v: number) => `${v.toFixed(0)}` },
    { key: 'low_birth_weight_prevalence_pct', label: t('healthOutcomes.lowBirthWeight'), format: (v: number) => `${v.toFixed(1)}%` },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('healthOutcomes.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json');
        if (!response.ok) {
          throw new Error(t('healthOutcomes.errors.fetchFailed', { status: response.status, text: response.statusText }));
        }
        const jsonData = (await response.json()) as Dataset;

        console.log('Sample dataset record:', jsonData.Nutrition_Data[0]);

        if (!jsonData.Nutrition_Data || !Array.isArray(jsonData.Nutrition_Data)) {
          throw new Error(t('healthOutcomes.errors.invalidFormat'));
        }

        const years = jsonData.Nutrition_Data.map((d) => d.year).filter((y) => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years, 2025) : 2025;
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Nutrition_Data.filter(
          (d) => d.country && d.country.toLowerCase() === (country as string).toLowerCase()
        );

        console.log(`Filtered data for ${country}:`, filteredCountryData);

        if (filteredCountryData.length === 0) {
          setError(t('healthOutcomes.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(t('healthOutcomes.errors.loadingError', { message: (err as Error).message }));
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
      const row: { [key: string]: string | number } = { [t('healthOutcomes.year')]: data.year };
      healthOutcomeFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('healthOutcomes.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_health_outcomes.csv`;
    link.click();
  };

  const handlePDFDownload = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) {
      console.error(t('healthOutcomes.errors.dashboardNotFound'));
      return;
    }

    try {
      const canvas = await html2canvas(dashboard, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`${country}_health_outcomes_dashboard.pdf`);
    } catch (err) {
      console.error(t('healthOutcomes.errors.pdfError'), err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('healthOutcomes.loading')}</p>
        </div>
      </div>
    );
  }

  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || t('healthOutcomes.errors.noData', { country })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content">
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={t('healthOutcomes.overview', { country })}
        >
          <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" /> {t('healthOutcomes.title')} -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          {t('healthOutcomes.simulatedNote')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('healthOutcomes.downloadCSV')}
          >
            <FaDownload /> {t('healthOutcomes.downloadCSV')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('healthOutcomes.downloadPDF')}
          >
            <FaDownload /> {t('healthOutcomes.downloadPDF')}
          </button>
        </div>

        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('healthOutcomes.selectYear')}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mb-6 max-w-full">
          {healthOutcomeFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0"
              aria-label={t('healthOutcomes.cardLabel', { label: field.label, year: selectedYear })}
            >
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{field.label} ({selectedYear})</h3>
              <p className="text-[var(--wine)] text-base sm:text-lg">
                {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('healthOutcomes.na')}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-full">
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('healthOutcomes.trendsChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('healthOutcomes.trendsTitle', { start: 2006, end: selectedYear })}
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
                  dataKey="child_obesity_prevalence_pct"
                  stroke="var(--olive-green)"
                  name={t('healthOutcomes.childObesity')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="maternal_mortality_ratio_per_100k"
                  stroke="var(--wine)"
                  name={t('healthOutcomes.maternalMortality')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="low_birth_weight_prevalence_pct"
                  stroke="var(--yellow)"
                  name={t('healthOutcomes.lowBirthWeight')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('healthOutcomes.comparisonChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('healthOutcomes.comparisonTitle', { country: (country as string).charAt(0).toUpperCase() + (country as string).slice(1) })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('healthOutcomes.selectMetric')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as HealthOutcomeMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {healthOutcomeFields.map((field) => (
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
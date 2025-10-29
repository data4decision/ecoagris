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
import { FaChartLine, FaDownload, FaHeartbeat, FaEye, FaPills, FaSyringe } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';

interface ProgramCoverageSurveillanceData {
  country: string;
  year: number;
  nutrition_program_coverage_pct?: number;
  nutrition_surveillance_coverage_pct?: number;
  deworming_coverage_children_pct?: number;
  immunization_coverage_measles_pct?: number;
  [key: string]: unknown;
}

interface Dataset {
  Nutrition_Data: ProgramCoverageSurveillanceData[];
}

type ProgramCoverageSurveillanceMetric =
  | 'nutrition_program_coverage_pct'
  | 'nutrition_surveillance_coverage_pct'
  | 'deworming_coverage_children_pct'
  | 'immunization_coverage_measles_pct';

export default function ProgramCoverageSurveillancePage() {
  const { t } = useTranslation('common');
  const { country } = useParams();
  const [countryData, setCountryData] = useState<ProgramCoverageSurveillanceData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<ProgramCoverageSurveillanceMetric>('nutrition_program_coverage_pct');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const programCoverageFields = [
    {
      key: 'nutrition_program_coverage_pct',
      label: t('programCoverage.programCoverage'),
      format: (v: number) => `${v.toFixed(1)}%`,
      icon: <FaHeartbeat className="text-[var(--dark-green)] text-lg" />,
    },
    {
      key: 'nutrition_surveillance_coverage_pct',
      label: t('programCoverage.surveillanceCoverage'),
      format: (v: number) => `${v.toFixed(1)}%`,
      icon: <FaEye className="text-[var(--olive-green)] text-lg" />,
    },
    {
      key: 'deworming_coverage_children_pct',
      label: t('programCoverage.deworming'),
      format: (v: number) => `${v.toFixed(1)}%`,
      icon: <FaPills className="text-[var(--wine)] text-lg" />,
    },
    {
      key: 'immunization_coverage_measles_pct',
      label: t('programCoverage.measlesImmunization'),
      format: (v: number) => `${v.toFixed(1)}%`,
      icon: <FaSyringe className="text-[var(--yellow)] text-lg" />,
    },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('programCoverage.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json');
        if (!response.ok) {
          throw new Error(t('programCoverage.errors.fetchFailed', { status: response.status, text: response.statusText }));
        }
        const jsonData = (await response.json()) as Dataset;

        if (!jsonData.Nutrition_Data || !Array.isArray(jsonData.Nutrition_Data)) {
          throw new Error(t('programCoverage.errors.invalidFormat'));
        }

        const years = jsonData.Nutrition_Data.map((d) => d.year).filter((y) => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years, 2025) : 2025;
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Nutrition_Data.filter(
          (d) => d.country && d.country.toLowerCase() === (country as string).toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('programCoverage.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(t('programCoverage.errors.loadingError', { message: (err as Error).message }));
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
      const row: { [key: string]: string | number } = { [t('programCoverage.year')]: data.year };
      programCoverageFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('programCoverage.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_program_coverage_surveillance_data.csv`;
    link.click();
  };

  // Same as MalnutritionPage — guaranteed to work
  const handlePDFDownload = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) {
      console.error(t('programCoverage.errors.dashboardNotFound'));
      return;
    }

    try {
      const canvas = await html2canvas(dashboard, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`${country}_program_coverage_surveillance_dashboard.pdf`);
    } catch (err) {
      console.error(t('programCoverage.errors.pdfError'), err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('programCoverage.loading')}</p>
        </div>
      </div>
    );
  }

  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || t('programCoverage.errors.noData', { country })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content">
        {/* Page Header */}
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={t('programCoverage.overview', { country })}
        >
          <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" /> {t('programCoverage.title')} -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          {t('programCoverage.simulatedNote')}
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('programCoverage.downloadCSV')}
          >
            <FaDownload /> {t('programCoverage.downloadCSV')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('programCoverage.downloadPDF')}
          >
            <FaDownload /> {t('programCoverage.downloadPDF')}
          </button>
        </div>

        {/* Year Selection */}
        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('programCoverage.selectYear')}
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

        {/* Metric Cards — Same as MalnutritionPage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mb-6 max-w-full">
          {programCoverageFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0"
              aria-label={t('programCoverage.cardLabel', { label: field.label, year: selectedYear })}
            >
              <div className="flex items-center gap-2 mb-1">
                {field.icon}
                <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">
                  {field.label} ({selectedYear})
                </h3>
              </div>
              <p className="text-[var(--wine)] text-base sm:text-lg">
                {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('programCoverage.na')}
              </p>
            </div>
          ))}
        </div>

        {/* Visualizations — Same as MalnutritionPage */}
        <div className="grid grid-cols-1 gap-6 max-w-full">
          {/* Line Chart */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('programCoverage.trendsChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('programCoverage.trendsTitle', { start: 2006, end: selectedYear })}
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
                  dataKey="nutrition_program_coverage_pct"
                  stroke="var(--olive-green)"
                  name={t('programCoverage.programCoverage')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="nutrition_surveillance_coverage_pct"
                  stroke="var(--wine)"
                  name={t('programCoverage.surveillanceCoverage')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="deworming_coverage_children_pct"
                  stroke="var(--yellow)"
                  name={t('programCoverage.deworming')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="immunization_coverage_measles_pct"
                  stroke="var(--medium-green)"
                  name={t('programCoverage.measlesImmunization')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('programCoverage.comparisonChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('programCoverage.comparisonTitle', { country: (country as string).charAt(0).toUpperCase() + (country as string).slice(1) })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('programCoverage.selectMetric')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as ProgramCoverageSurveillanceMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {programCoverageFields.map((field) => (
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
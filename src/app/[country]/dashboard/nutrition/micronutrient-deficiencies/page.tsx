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

interface MicronutrientData {
  country: string;
  year: number;
  vitaminA_deficiency_children_pct?: number;
  iron_deficiency_women_pct?: number;
  prevalence_anaemia_women_pct?: number;
  vitaminA_supplementation_coverage_children_pct?: number;
  pregnant_women_receiving_iron_folic_acid_pct?: number;
  [key: string]: unknown;
}

interface Dataset {
  Nutrition_Data: MicronutrientData[];
}

type MicronutrientMetric =
  | 'vitaminA_deficiency_children_pct'
  | 'iron_deficiency_women_pct'
  | 'prevalence_anaemia_women_pct'
  | 'vitaminA_supplementation_coverage_children_pct'
  | 'pregnant_women_receiving_iron_folic_acid_pct';

export default function MicronutrientDeficienciesPage() {
  const { t } = useTranslation('common');
  const { country } = useParams();
  const [countryData, setCountryData] = useState<MicronutrientData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MicronutrientMetric>('vitaminA_deficiency_children_pct');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const micronutrientFields = [
    { key: 'vitaminA_deficiency_children_pct', label: t('micronutrient.vitaminAChildren'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'iron_deficiency_women_pct', label: t('micronutrient.ironWomen'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'prevalence_anaemia_women_pct', label: t('micronutrient.anemiaWomen'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'vitaminA_supplementation_coverage_children_pct', label: t('micronutrient.vitaminACoverage'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'pregnant_women_receiving_iron_folic_acid_pct', label: t('micronutrient.ironFolicPregnant'), format: (v: number) => `${v.toFixed(1)}%` },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('micronutrient.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json');
        if (!response.ok) throw new Error(t('micronutrient.errors.fetchFailed'));
        const jsonData = (await response.json()) as Dataset;

        const years = jsonData.Nutrition_Data.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Nutrition_Data.filter(
          (d) => d.country.toLowerCase() === (country as string).toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('micronutrient.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (error) {
        setError(t('micronutrient.errors.loadingError'));
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
      const row: { [key: string]: string | number } = { [t('micronutrient.year')]: data.year };
      micronutrientFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('micronutrient.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_micronutrient_deficiencies.csv`;
    link.click();
  };

  const handlePDFDownload = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) return;

    const canvas = await html2canvas(dashboard, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`${country}_micronutrient_deficiencies_dashboard.pdf`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('micronutrient.loading')}</p>
        </div>
      </div>
    );
  }

  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || t('micronutrient.errors.noData', { country })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content">
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={t('micronutrient.overview', { country })}
        >
          <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" /> {t('micronutrient.title')} -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          {t('micronutrient.simulatedNote')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('micronutrient.downloadCSV')}
          >
            <FaDownload /> {t('micronutrient.downloadCSV')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('micronutrient.downloadPDF')}
          >
            <FaDownload /> {t('micronutrient.downloadPDF')}
          </button>
        </div>

        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('micronutrient.selectYear')}
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
          {micronutrientFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0"
              aria-label={t('micronutrient.cardLabel', { label: field.label, year: selectedYear })}
            >
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{field.label} ({selectedYear})</h3>
              <p className="text-[var(--wine)] text-base sm:text-lg">
                {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('micronutrient.na')}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-full">
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('micronutrient.trendsChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('micronutrient.trendsTitle', { start: 2006, end: selectedYear })}
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
                  dataKey="vitaminA_deficiency_children_pct"
                  stroke="var(--olive-green)"
                  name={t('micronutrient.vitaminAChildren')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="iron_deficiency_women_pct"
                  stroke="var(--wine)"
                  name={t('micronutrient.ironWomen')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="prevalence_anaemia_women_pct"
                  stroke="var(--yellow)"
                  name={t('micronutrient.anemiaWomen')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="vitaminA_supplementation_coverage_children_pct"
                  stroke="var(--medium-green)"
                  name={t('micronutrient.vitaminACoverage')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="pregnant_women_receiving_iron_folic_acid_pct"
                  stroke="var(--red)"
                  name={t('micronutrient.ironFolicPregnant')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('micronutrient.comparisonChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('micronutrient.comparisonTitle', { country: (country as string).charAt(0).toUpperCase() + (country as string).slice(1) })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('micronutrient.selectMetric')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MicronutrientMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {micronutrientFields.map((field) => (
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
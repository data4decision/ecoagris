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

interface NutritionInterventionData {
  country: string;
  year: number;
  exclusive_breastfeeding_under6months_pct?: number;
  minimum_dietary_diversity_children_pct?: number;
  school_meal_coverage_pct?: number;
  wfp_food_assistance_beneficiaries?: number;
  [key: string]: unknown;
}

interface Dataset {
  Nutrition_Data: NutritionInterventionData[];
}

type NutritionInterventionMetric =
  | 'exclusive_breastfeeding_under6months_pct'
  | 'minimum_dietary_diversity_children_pct'
  | 'school_meal_coverage_pct'
  | 'wfp_food_assistance_beneficiaries';

export default function InterventionsPage() {
  const { t } = useTranslation('common');
  const { country } = useParams();
  const [countryData, setCountryData] = useState<NutritionInterventionData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<NutritionInterventionMetric>('exclusive_breastfeeding_under6months_pct');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nutritionInterventionFields = [
    {
      key: 'exclusive_breastfeeding_under6months_pct',
      label: t('interventions.breastfeeding'),
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      key: 'minimum_dietary_diversity_children_pct',
      label: t('interventions.dietaryDiversity'),
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      key: 'school_meal_coverage_pct',
      label: t('interventions.schoolMeals'),
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      key: 'wfp_food_assistance_beneficiaries',
      label: t('interventions.wfpBeneficiaries'),
      format: (v: number) => v.toLocaleString(),
    },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('interventions.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json');
        if (!response.ok) {
          throw new Error(t('interventions.errors.fetchFailed', { status: response.status, text: response.statusText }));
        }
        const jsonData = (await response.json()) as Dataset;

        console.log('Sample dataset record:', jsonData.Nutrition_Data[0]);

        if (!jsonData.Nutrition_Data || !Array.isArray(jsonData.Nutrition_Data)) {
          throw new Error(t('interventions.errors.invalidFormat'));
        }

        const years = jsonData.Nutrition_Data.map((d) => d.year).filter((y) => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years, 2025) : 2025;
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Nutrition_Data.filter(
          (d) => d.country && d.country.toLowerCase() === (country as string).toLowerCase()
        );

        console.log(`Filtered data for ${country}:`, filteredCountryData);

        if (filteredCountryData.length === 0) {
          setError(t('interventions.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(t('interventions.errors.loadingError', { message: (err as Error).message }));
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
      const row: { [key: string]: string | number } = { [t('interventions.year')]: data.year };
      nutritionInterventionFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('interventions.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_interventions_data.csv`;
    link.click();
  };

  const handlePDFDownload = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) {
      console.error(t('interventions.errors.dashboardNotFound'));
      return;
    }

    try {
      const canvas = await html2canvas(dashboard, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`${country}_interventions_dashboard.pdf`);
    } catch (err) {
      console.error(t('interventions.errors.pdfError'), err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('interventions.loading')}</p>
        </div>
      </div>
    );
  }

  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || t('interventions.errors.noData', { country })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content">
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={t('interventions.overview', { country })}
        >
          <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" /> {t('interventions.title')} -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          {t('interventions.simulatedNote')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('interventions.downloadCSV')}
          >
            <FaDownload /> {t('interventions.downloadCSV')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('interventions.downloadPDF')}
          >
            <FaDownload /> {t('interventions.downloadPDF')}
          </button>
        </div>

        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('interventions.selectYear')}
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
          {nutritionInterventionFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0"
              aria-label={t('interventions.cardLabel', { label: field.label, year: selectedYear })}
            >
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{field.label} ({selectedYear})</h3>
              <p className="text-[var(--wine)] text-base sm:text-lg">
                {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('interventions.na')}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-full">
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('interventions.trendsChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('interventions.trendsTitle', { start: 2006, end: selectedYear })}
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
                  dataKey="exclusive_breastfeeding_under6months_pct"
                  stroke="var(--olive-green)"
                  name={t('interventions.breastfeeding')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="minimum_dietary_diversity_children_pct"
                  stroke="var(--wine)"
                  name={t('interventions.dietaryDiversity')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="school_meal_coverage_pct"
                  stroke="var(--yellow)"
                  name={t('interventions.schoolMeals')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="wfp_food_assistance_beneficiaries"
                  stroke="var(--medium-green)"
                  name={t('interventions.wfpBeneficiaries')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('interventions.comparisonChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('interventions.comparisonTitle', { country: (country as string).charAt(0).toUpperCase() + (country as string).slice(1) })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('interventions.selectMetric')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as NutritionInterventionMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {nutritionInterventionFields.map((field) => (
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
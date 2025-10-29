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

interface DietaryData {
  country: string;
  year: number;
  average_daily_caloric_intake_kcal?: number;
  protein_intake_g_per_capita_per_day?: number;
  dietary_energy_supply_kcal_per_capita_per_day?: number;
  fruit_vegetable_consumption_g_per_day?: number;
  animal_protein_share_of_total_protein_pct?: number;
  household_food_expenditure_share_pct?: number;
  household_food_insecurity_pct?: number;
  [key: string]: unknown;
}

interface Dataset {
  Nutrition_Data: DietaryData[];
}

type DietaryMetric =
  | 'average_daily_caloric_intake_kcal'
  | 'protein_intake_g_per_capita_per_day'
  | 'dietary_energy_supply_kcal_per_capita_per_day'
  | 'fruit_vegetable_consumption_g_per_day'
  | 'animal_protein_share_of_total_protein_pct'
  | 'household_food_expenditure_share_pct'
  | 'household_food_insecurity_pct';

export default function DietaryNutrientIntakePage() {
  const { t } = useTranslation('common');
  const { country } = useParams();
  const [countryData, setCountryData] = useState<DietaryData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<DietaryMetric>('average_daily_caloric_intake_kcal');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dietaryFields = [
    { key: 'average_daily_caloric_intake_kcal', label: t('dietary.caloricIntake'), format: (v: number) => `${v.toFixed(0)} kcal` },
    { key: 'protein_intake_g_per_capita_per_day', label: t('dietary.proteinIntake'), format: (v: number) => `${v.toFixed(1)} g` },
    { key: 'dietary_energy_supply_kcal_per_capita_per_day', label: t('dietary.energySupply'), format: (v: number) => `${v.toFixed(0)} kcal` },
    { key: 'fruit_vegetable_consumption_g_per_day', label: t('dietary.fruitVeg'), format: (v: number) => `${v.toFixed(0)} g` },
    { key: 'animal_protein_share_of_total_protein_pct', label: t('dietary.animalProtein'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'household_food_expenditure_share_pct', label: t('dietary.foodExpenditure'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'household_food_insecurity_pct', label: t('dietary.foodInsecurity'), format: (v: number) => `${v.toFixed(1)}%` },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('dietary.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json');
        if (!response.ok) throw new Error(t('dietary.errors.fetchFailed'));
        const jsonData = (await response.json()) as Dataset;

        const years = jsonData.Nutrition_Data.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Nutrition_Data.filter(
          (d) => d.country.toLowerCase() === (country as string).toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('dietary.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (error) {
        setError(t('dietary.errors.loadingError'));
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
      const row: { [key: string]: string | number } = { [t('dietary.year')]: data.year };
      dietaryFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('dietary.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_dietary_nutrient_intake.csv`;
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
    pdf.save(`${country}_dietary_nutrient_intake_dashboard.pdf`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('dietary.loading')}</p>
        </div>
      </div>
    );
  }

  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || t('dietary.errors.noData', { country })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content">
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={t('dietary.overview', { country })}
        >
          <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" /> {t('dietary.title')} -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          {t('dietary.simulatedNote')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('dietary.downloadCSV')}
          >
            <FaDownload /> {t('dietary.downloadCSV')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('dietary.downloadPDF')}
          >
            <FaDownload /> {t('dietary.downloadPDF')}
          </button>
        </div>

        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('dietary.selectYear')}
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
          {dietaryFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0"
              aria-label={t('dietary.cardLabel', { label: field.label, year: selectedYear })}
            >
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{field.label} ({selectedYear})</h3>
              <p className="text-[var(--wine)] text-base sm:text-lg">
                {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('dietary.na')}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-full">
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('dietary.trendsChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('dietary.trendsTitle', { start: 2006, end: selectedYear })}
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
                  dataKey="average_daily_caloric_intake_kcal"
                  stroke="var(--olive-green)"
                  name={t('dietary.caloricIntake')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="protein_intake_g_per_capita_per_day"
                  stroke="var(--wine)"
                  name={t('dietary.proteinIntake')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="dietary_energy_supply_kcal_per_capita_per_day"
                  stroke="var(--yellow)"
                  name={t('dietary.energySupply')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="fruit_vegetable_consumption_g_per_day"
                  stroke="var(--medium-green)"
                  name={t('dietary.fruitVeg')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="animal_protein_share_of_total_protein_pct"
                  stroke="var(--red)"
                  name={t('dietary.animalProtein')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="household_food_expenditure_share_pct"
                  stroke="var(--dark-green)"
                  name={t('dietary.foodExpenditure')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="household_food_insecurity_pct"
                  stroke="var(--green)"
                  name={t('dietary.foodInsecurity')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('dietary.comparisonChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('dietary.comparisonTitle', { country: (country as string).charAt(0).toUpperCase() + (country as string).slice(1) })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('dietary.selectMetric')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as DietaryMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {dietaryFields.map((field) => (
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
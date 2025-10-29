'use client';

// Import required dependencies
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

// Define TypeScript interfaces directly in the file
interface NutritionData {
  country: string;
  year: number;
  prevalence_undernourishment_pct?: number;
  prevalence_stunting_children_under5_pct?: number;
  prevalence_wasting_children_under5_pct?: number;
  prevalence_overweight_children_under5_pct?: number;
  adult_obesity_prevalence_pct?: number;
  adult_underweight_prevalence_pct?: number;
  child_obesity_prevalence_pct?: number;
  [key: string]: unknown; // Allow for other fields in the dataset
}

interface Dataset {
  Nutrition_Data: NutritionData[];
}

// Define available metrics for the bar chart
type MalnutritionMetric =
  | 'prevalence_undernourishment_pct'
  | 'prevalence_stunting_children_under5_pct'
  | 'prevalence_wasting_children_under5_pct'
  | 'prevalence_overweight_children_under5_pct'
  | 'adult_obesity_prevalence_pct'
  | 'adult_underweight_prevalence_pct'
  | 'child_obesity_prevalence_pct';

export default function MalnutritionPage() {
  const { t } = useTranslation('common');
  // Get dynamic country parameter from URL
  const { country } = useParams();
  // State for country-specific data, selected metric, selected year, loading, error
  const [countryData, setCountryData] = useState<NutritionData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MalnutritionMetric>('prevalence_undernourishment_pct');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define field metadata for display and formatting
  const malnutritionFields = [
    { key: 'prevalence_undernourishment_pct', label: t('malnutrition.undernourishment'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'prevalence_stunting_children_under5_pct', label: t('malnutrition.stunting'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'prevalence_wasting_children_under5_pct', label: t('malnutrition.wasting'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'prevalence_overweight_children_under5_pct', label: t('malnutrition.overweight'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'adult_obesity_prevalence_pct', label: t('malnutrition.adultObesity'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'adult_underweight_prevalence_pct', label: t('malnutrition.adultUnderweight'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'child_obesity_prevalence_pct', label: t('malnutrition.childObesity'), format: (v: number) => `${v.toFixed(1)}%` },
  ];

  // Fetch data from JSON file
  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('malnutrition.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Data Fetch Location: Load the malnutrition dataset
        // Path: /public/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json
        const response = await fetch('/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json');
        if (!response.ok) {
          throw new Error(t('malnutrition.errors.fetchFailed', { status: response.status, text: response.statusText }));
        }
        const jsonData = (await response.json()) as Dataset;

        // Log sample data to verify fields
        console.log('Sample dataset record:', jsonData.Nutrition_Data[0]);

        // Validate dataset structure
        if (!jsonData.Nutrition_Data || !Array.isArray(jsonData.Nutrition_Data)) {
          throw new Error(t('malnutrition.errors.invalidFormat'));
        }

        // Calculate the latest year dynamically
        const years = jsonData.Nutrition_Data.map((d) => d.year).filter((y) => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years, 2025) : 2025;
        setSelectedYear(maxYear);

        // Filter data for the selected country
        const filteredCountryData = jsonData.Nutrition_Data.filter(
          (d) => d.country && d.country.toLowerCase() === (country as string).toLowerCase()
        );

        // Log filtered data to check values
        console.log(`Filtered data for ${country}:`, filteredCountryData);

        if (filteredCountryData.length === 0) {
          setError(t('malnutrition.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(t('malnutrition.errors.loadingError', { message: (err as Error).message }));
        setLoading(false);
      }
    }

    fetchData();
  }, [country, t]);

  // Get unique years for dropdown
  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map((d) => d.year).filter((y) => typeof y === 'number'))).sort((a, b) => a - b);
  }, [countryData]);

  // Get data for the selected year
  const selectedData = countryData.find((d) => d.year === selectedYear);

  // Function to handle CSV download
  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => {
      const row: { [key: string]: string | number } = { [t('malnutrition.year')]: data.year };
      malnutritionFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('malnutrition.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_malnutrition_data.csv`;
    link.click();
  };

  // Function to handle PDF download
  const handlePDFDownload = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) {
      console.error(t('malnutrition.errors.dashboardNotFound'));
      return;
    }

    try {
      const canvas = await html2canvas(dashboard, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`${country}_malnutrition_dashboard.pdf`);
    } catch (err) {
      console.error(t('malnutrition.errors.pdfError'), err);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('malnutrition.loading')}</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || t('malnutrition.errors.noData', { country })}</p>
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
          aria-label={t('malnutrition.overview', { country })}
        >
          <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" /> {t('malnutrition.title')} -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          {t('malnutrition.simulatedNote')}
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('malnutrition.downloadCSV')}
          >
            <FaDownload /> {t('malnutrition.downloadCSV')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('malnutrition.downloadPDF')}
          >
            <FaDownload /> {t('malnutrition.downloadPDF')}
          </button>
        </div>

        {/* Year Selection for Cards */}
        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('malnutrition.selectYear')}
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
          {malnutritionFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0"
              aria-label={t('malnutrition.cardLabel', { label: field.label, year: selectedYear })}
            >
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{field.label} ({selectedYear})</h3>
              <p className="text-[var(--wine)] text-base sm:text-lg">
                {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('malnutrition.na')}
              </p>
            </div>
          ))}
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 gap-6 max-w-full">
          {/* Line Chart: Malnutrition Trends */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('malnutrition.trendsChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('malnutrition.trendsTitle', { start: 2006, end: selectedYear })}
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
                  dataKey="prevalence_undernourishment_pct"
                  stroke="var(--olive-green)"
                  name={t('malnutrition.undernourishment')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="prevalence_stunting_children_under5_pct"
                  stroke="var(--wine)"
                  name={t('malnutrition.stunting')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="prevalence_wasting_children_under5_pct"
                  stroke="var(--yellow)"
                  name={t('malnutrition.wasting')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="prevalence_overweight_children_under5_pct"
                  stroke="var(--medium-green)"
                  name={t('malnutrition.overweight')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="adult_obesity_prevalence_pct"
                  stroke="var(--red)"
                  name={t('malnutrition.adultObesity')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="adult_underweight_prevalence_pct"
                  stroke="var(--green)"
                  name={t('malnutrition.adultUnderweight')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="child_obesity_prevalence_pct"
                  stroke="var(--dark-green)"
                  name={t('malnutrition.childObesity')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Year Comparison for Selected Country */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('malnutrition.comparisonChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('malnutrition.comparisonTitle', { country: (country as string).charAt(0).toUpperCase() + (country as string).slice(1) })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('malnutrition.selectMetric')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MalnutritionMetric)}
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {malnutritionFields.map((field) => (
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
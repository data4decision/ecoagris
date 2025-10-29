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
import { FaChartLine, FaDownload, FaDatabase, FaFileAlt } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';

interface MethodologyNotes {
  methodology?: string;
  [key: string]: unknown;
}

interface DataQualityAndMethodologyData {
  country: string;
  year: number;
  nutrition_data_quality_index?: number;
  Methodology_Notes?: string | MethodologyNotes;
  [key: string]: unknown;
}

interface Dataset {
  Nutrition_Data: DataQualityAndMethodologyData[];
  Methodology_Notes?: string | MethodologyNotes;
}

export default function DataQualityAndMethodologyPage() {
  const { t } = useTranslation('common');
  const { country } = useParams();
  const [countryData, setCountryData] = useState<DataQualityAndMethodologyData[]>([]);
  const [methodologyNotes, setMethodologyNotes] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dataQualityFields = [
    {
      key: 'nutrition_data_quality_index',
      label: t('dataQuality.dataQualityIndex'),
      format: (v: number) => v.toFixed(1),
      icon: <FaDatabase className="text-[var(--dark-green)] text-lg" />,
    },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('dataQuality.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json');
        if (!response.ok) {
          throw new Error(t('dataQuality.errors.fetchFailed', { status: response.status, text: response.statusText }));
        }
        const jsonData = (await response.json()) as Dataset;

        if (!jsonData.Nutrition_Data || !Array.isArray(jsonData.Nutrition_Data)) {
          throw new Error(t('dataQuality.errors.invalidFormat'));
        }

        let notes: string | null = null;
        if (typeof jsonData.Methodology_Notes === 'string') {
          notes = jsonData.Methodology_Notes;
        } else if (jsonData.Methodology_Notes && typeof jsonData.Methodology_Notes === 'object') {
          notes = jsonData.Methodology_Notes.methodology || JSON.stringify(jsonData.Methodology_Notes);
        } else if (jsonData.Nutrition_Data[0]?.Methodology_Notes) {
          const firstNote = jsonData.Nutrition_Data[0].Methodology_Notes;
          notes = typeof firstNote === 'string' ? firstNote : firstNote?.methodology || JSON.stringify(firstNote);
        } else {
          notes = t('dataQuality.noNotes');
        }
        setMethodologyNotes(notes);

        const years = jsonData.Nutrition_Data.map((d) => d.year).filter((y) => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years, 2025) : 2025;
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Nutrition_Data.filter(
          (d) => d.country && d.country.toLowerCase() === (country as string).toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('dataQuality.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(t('dataQuality.errors.loadingError', { message: (err as Error).message }));
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
      const row: { [key: string]: string | number } = { [t('dataQuality.year')]: data.year };
      dataQualityFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('dataQuality.na');
      });
      if (data.Methodology_Notes) {
        row[t('dataQuality.methodologyNotes')] =
          typeof data.Methodology_Notes === 'string'
            ? data.Methodology_Notes
            : data.Methodology_Notes?.methodology || JSON.stringify(data.Methodology_Notes);
      }
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_data_quality_methodology_data.csv`;
    link.click();
  };

  // Same as MalnutritionPage — 100% working
  const handlePDFDownload = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) {
      console.error(t('dataQuality.errors.dashboardNotFound'));
      return;
    }

    try {
      const canvas = await html2canvas(dashboard, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`${country}_data_quality_methodology_dashboard.pdf`);
    } catch (err) {
      console.error(t('dataQuality.errors.pdfError'), err);
    }
  };

  const renderMethodologyNotes = () => {
    const notes = selectedData?.Methodology_Notes || methodologyNotes;
    if (typeof notes === 'string') return notes;
    if (notes && typeof notes === 'object') return notes.methodology || JSON.stringify(notes);
    return t('dataQuality.noNotes');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('dataQuality.loading')}</p>
        </div>
      </div>
    );
  }

  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || t('dataQuality.errors.noData', { country })}</p>
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
          aria-label={t('dataQuality.overview', { country })}
        >
          <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" /> {t('dataQuality.title')} -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          {t('dataQuality.simulatedNote')}
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('dataQuality.downloadCSV')}
          >
            <FaDownload /> {t('dataQuality.downloadCSV')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('dataQuality.downloadPDF')}
          >
            <FaDownload /> {t('dataQuality.downloadPDF')}
          </button>
        </div>

        {/* Year Selection */}
        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('dataQuality.selectYear')}
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

        {/* Metric Cards + Notes — Same as MalnutritionPage */}
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6 max-w-full">
          {/* Data Quality Index Card */}
          {dataQualityFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0"
              aria-label={t('dataQuality.cardLabel', { label: field.label, year: selectedYear })}
            >
              <div className="flex items-center gap-2 mb-1">
                {field.icon}
                <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">
                  {field.label} ({selectedYear})
                </h3>
              </div>
              <p className="text-[var(--wine)] text-base sm:text-lg">
                {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('dataQuality.na')}
              </p>
            </div>
          ))}

          {/* Methodology Notes Card */}
          <div
            className="p-3 sm:p-4 rounded  min-w-0"
            aria-label={t('dataQuality.methodologyCard')}
          >
            {/* <div className="flex items-center gap-2 mb-1">
              <FaFileAlt className="text-[var(--olive-green)] text-lg" />
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">
                {t('dataQuality.methodologyNotes')} ({selectedYear})
              </h3>
            </div> */}
            {/* <p className="text-[var(--dark-green)] text-xs sm:text-sm max-h-32 overflow-y-auto">
              {renderMethodologyNotes()}
            </p> */}
          </div>
        </div>

        {/* Visualizations — Same as MalnutritionPage */}
        <div className="grid grid-cols-1 gap-6 max-w-full">
          {/* Line Chart */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('dataQuality.trendsChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('dataQuality.trendsTitle', { start: 2006, end: selectedYear })}
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
                  dataKey="nutrition_data_quality_index"
                  stroke="var(--olive-green)"
                  name={t('dataQuality.dataQualityIndex')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden" aria-label={t('dataQuality.comparisonChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('dataQuality.comparisonTitle', { country: (country as string).charAt(0).toUpperCase() + (country as string).slice(1) })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('dataQuality.selectMetric')}
            </label>
            <select
              id="metric-select"
              value="nutrition_data_quality_index"
              disabled
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto opacity-50 cursor-not-allowed"
            >
              <option value="nutrition_data_quality_index">{t('dataQuality.dataQualityIndex')}</option>
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
                <Bar dataKey="nutrition_data_quality_index" fill="var(--olive-green)" minPointSize={5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
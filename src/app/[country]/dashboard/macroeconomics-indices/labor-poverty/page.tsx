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
import { FaUsers, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import '@/styles/dashboard-styles.css';

interface MacroData {
  country: string;
  year: number;
  population: number;
  unemployment_pct: number;
  poverty_headcount_pct: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Macro_Data: MacroData[];
  Methodology_Assumptions?: { note: string }[];
}

type MacroMetric = 'population' | 'unemployment_pct' | 'poverty_headcount_pct';

export default function LaborPovertyYearTrendPage() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<MacroData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MacroMetric>('population');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestYear, setLatestYear] = useState(2025);
  const [methodologyNote, setMethodologyNote] = useState<string>('');

  const laborPovertyFields = [
    {
      key: 'population',
      label: t('laborPovertyYearTrend.cards.population'),
      format: (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 }),
    },
    {
      key: 'unemployment_pct',
      label: t('laborPovertyYearTrend.cards.unemployment'),
      format: (v: number) => `${v.toFixed(2)}%`,
    },
    {
      key: 'poverty_headcount_pct',
      label: t('laborPovertyYearTrend.cards.poverty'),
      format: (v: number) => `${v.toFixed(2)}%`,
    },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('laborPovertyYearTrend.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/macro/WestAfrica_Macro_Simulated_2006_2025.json');
        if (!response.ok) throw new Error(t('laborPovertyYearTrend.errors.fetchFailed'));

        const jsonData = (await response.json()) as Dataset;

        if (!jsonData.Simulated_Macro_Data || !Array.isArray(jsonData.Simulated_Macro_Data)) {
          throw new Error(t('laborPovertyYearTrend.errors.invalidFormat'));
        }

        setMethodologyNote(
          jsonData.Methodology_Assumptions?.[0]?.note || t('laborPovertyYearTrend.simulatedNote')
        );

        const dataArray = jsonData.Simulated_Macro_Data;

        const years = dataArray
          .map((d) => d.year)
          .filter((y): y is number => typeof y === 'number');

        if (years.length === 0) {
          throw new Error(t('laborPovertyYearTrend.errors.noData', { country }));
        }

        const maxYear = Math.max(...years, 2025);
        setLatestYear(maxYear);
        setSelectedYear(maxYear);

        const filteredCountryData = dataArray.filter(
          (d) => d.country && d.country.toLowerCase() === country.toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('laborPovertyYearTrend.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('laborPovertyYearTrend.errors.loadingError'));
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
      const row: { [key: string]: string | number } = {
        [t('laborPovertyYearTrend.csv.year')]: data.year,
      };
      laborPovertyFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('laborPovertyYearTrend.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_labor_poverty_year_trend.csv`;
    link.click();
  };

  const handlePdfDownload = async () => {
    if (!dashboardRef.current) {
      alert(t('laborPovertyYearTrend.errors.pdfFailed'));
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      dashboardRef.current.classList.add('snapshot');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      dashboardRef.current.classList.remove('snapshot');

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas capture failed');
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 30;

      pdf.setFontSize(16);
      pdf.text(t('laborPovertyYearTrend.pdf.title', { country: country.toUpperCase() }), 10, 15);
      pdf.setFontSize(10);
      pdf.text(t('laborPovertyYearTrend.pdf.exported', { date: new Date().toLocaleDateString() }), 10, 22);

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 40;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 40;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 40;
      }

      pdf.save(`${country}_labor_poverty_year_trend_report.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(t('laborPovertyYearTrend.errors.pdfFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">
            {t('laborPovertyYearTrend.loading')}
          </p>
        </div>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">
            {error || t('laborPovertyYearTrend.errors.noData', { country })}
          </p>
        </div>
      </div>
    );
  }

  const countryName = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" ref={dashboardRef}>
        {/* Header */}
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={t('laborPovertyYearTrend.title', { countryName })}
        >
          <FaUsers aria-hidden="true" className="text-lg sm:text-xl" />
          {t('laborPovertyYearTrend.title', { countryName })}
        </h1>
        {/* <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          {methodologyNote}
        </p> */}

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
          >
            <FaDownload /> {t('laborPovertyYearTrend.downloadCSV')}
          </button>
          <button
            onClick={handlePdfDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
          >
            <FaDownload /> {t('laborPovertyYearTrend.downloadPDF')}
          </button>
        </div>

        {/* Year Selector */}
        <div className="mb-4">
          <label htmlFor="year-select" className="sr-only">
            {t('laborPovertyYearTrend.yearSelectLabel')}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          {laborPovertyFields.map((field) => (
            <div
              key={field.key}
              className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow"
            >
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">
                {field.label} ({selectedYear})
              </h3>
              <p className="text-[var(--wine)] text-base sm:text-lg">
                {selectedData[field.key] != null
                  ? field.format(selectedData[field.key] as number)
                  : t('laborPovertyYearTrend.na')}
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6">
          {/* Line Chart */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow chart-section">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('laborPovertyYearTrend.lineChartTitle', { year: latestYear })}
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" fontSize={10} angle={-45} textAnchor="end" height={60} />
                <YAxis fontSize={10} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="population"
                  stroke="var(--olive-green)"
                  name={t('laborPovertyYearTrend.cards.population')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="unemployment_pct"
                  stroke="var(--wine)"
                  name={t('laborPovertyYearTrend.cards.unemployment')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="poverty_headcount_pct"
                  stroke="var(--yellow)"
                  name={t('laborPovertyYearTrend.cards.poverty')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow chart-section">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('laborPovertyYearTrend.barChartTitle', { countryName })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('laborPovertyYearTrend.metricSelectLabel')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MacroMetric)}
              className="mb-3 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {laborPovertyFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" fontSize={10} angle={-45} textAnchor="end" height={60} />
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
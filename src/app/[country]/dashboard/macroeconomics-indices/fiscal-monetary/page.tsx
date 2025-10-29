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
import { FaDollarSign, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import '@/styles/dashboard-styles.css';

interface MacroData {
  country: string;
  year: number;
  cpi_inflation_pct: number;
  fiscal_deficit_pct_gdp: number;
  public_debt_pct_gdp: number;
  exchange_rate_local_per_usd: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Macro_Data: MacroData[];
}

type MacroMetric =
  | 'cpi_inflation_pct'
  | 'fiscal_deficit_pct_gdp'
  | 'public_debt_pct_gdp'
  | 'exchange_rate_local_per_usd';

export default function FiscalMonetaryYearTrendPage() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<MacroData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MacroMetric>('cpi_inflation_pct');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestYear, setLatestYear] = useState(2025);

  const fiscalMonetaryFields = [
    {
      key: 'cpi_inflation_pct',
      label: t('fiscalMonetaryYearTrend.cards.cpiInflation'),
      format: (v: number) => `${v.toFixed(2)}%`,
    },
    {
      key: 'fiscal_deficit_pct_gdp',
      label: t('fiscalMonetaryYearTrend.cards.fiscalDeficit'),
      format: (v: number) => `${v.toFixed(2)}%`,
    },
    {
      key: 'public_debt_pct_gdp',
      label: t('fiscalMonetaryYearTrend.cards.publicDebt'),
      format: (v: number) => `${v.toFixed(2)}%`,
    },
    {
      key: 'exchange_rate_local_per_usd',
      label: t('fiscalMonetaryYearTrend.cards.exchangeRate'),
      format: (v: number) => v.toFixed(3),
    },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('fiscalMonetaryYearTrend.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/macro/WestAfrica_Macro_Simulated_2006_2025.json');
        if (!response.ok) throw new Error(t('fiscalMonetaryYearTrend.errors.fetchFailed'));

        const jsonData = (await response.json()) as Dataset;

        if (!jsonData.Simulated_Macro_Data || !Array.isArray(jsonData.Simulated_Macro_Data)) {
          throw new Error(t('fiscalMonetaryYearTrend.errors.invalidFormat'));
        }

        const dataArray = jsonData.Simulated_Macro_Data;

        const years = dataArray
          .map((d) => d.year)
          .filter((y): y is number => typeof y === 'number');

        if (years.length === 0) {
          throw new Error(t('fiscalMonetaryYearTrend.errors.noData', { country }));
        }

        const maxYear = Math.max(...years, 2025);
        setLatestYear(maxYear);
        setSelectedYear(maxYear);

        const filteredCountryData = dataArray.filter(
          (d) => d.country && d.country.toLowerCase() === country.toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('fiscalMonetaryYearTrend.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('fiscalMonetaryYearTrend.errors.loadingError'));
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
        [t('fiscalMonetaryYearTrend.csv.year')]: data.year,
      };
      fiscalMonetaryFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('fiscalMonetaryYearTrend.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_fiscal_monetary_year_trend.csv`;
    link.click();
  };

  const handlePdfDownload = async () => {
    if (!dashboardRef.current) {
      alert(t('fiscalMonetaryYearTrend.errors.pdfFailed'));
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

      // Title & Export Date
      pdf.setFontSize(16);
      pdf.text(t('fiscalMonetaryYearTrend.pdf.title', { country: country.toUpperCase() }), 10, 15);
      pdf.setFontSize(10);
      pdf.text(t('fiscalMonetaryYearTrend.pdf.exported', { date: new Date().toLocaleDateString() }), 10, 22);

      // First page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 40;

      // Additional pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 40;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 40;
      }

      pdf.save(`${country}_fiscal_monetary_year_trend_report.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(t('fiscalMonetaryYearTrend.errors.pdfFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">
            {t('fiscalMonetaryYearTrend.loading')}
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
            {error || t('fiscalMonetaryYearTrend.errors.noData', { country })}
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
          aria-label={t('fiscalMonetaryYearTrend.title', { countryName })}
        >
          <FaDollarSign aria-hidden="true" className="text-lg sm:text-xl" />
          {t('fiscalMonetaryYearTrend.title', { countryName })}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          {t('fiscalMonetaryYearTrend.simulatedNote')}
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
          >
            <FaDownload /> {t('fiscalMonetaryYearTrend.downloadCSV')}
          </button>
          <button
            onClick={handlePdfDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto"
          >
            <FaDownload /> {t('fiscalMonetaryYearTrend.downloadPDF')}
          </button>
        </div>

        {/* Year Selector */}
        <div className="mb-4">
          <label htmlFor="year-select" className="sr-only">
            {t('fiscalMonetaryYearTrend.yearSelectLabel')}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {fiscalMonetaryFields.map((field) => (
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
                  : t('fiscalMonetaryYearTrend.na')}
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6">
          {/* Line Chart */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow chart-section">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('fiscalMonetaryYearTrend.lineChartTitle', { year: latestYear })}
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
                  dataKey="cpi_inflation_pct"
                  stroke="var(--olive-green)"
                  name={t('fiscalMonetaryYearTrend.cards.cpiInflation')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="fiscal_deficit_pct_gdp"
                  stroke="var(--wine)"
                  name={t('fiscalMonetaryYearTrend.cards.fiscalDeficit')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="public_debt_pct_gdp"
                  stroke="var(--yellow)"
                  name={t('fiscalMonetaryYearTrend.cards.publicDebt')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="exchange_rate_local_per_usd"
                  stroke="var(--dark-green)"
                  name={t('fiscalMonetaryYearTrend.cards.exchangeRate')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow chart-section">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('fiscalMonetaryYearTrend.barChartTitle', { countryName })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('fiscalMonetaryYearTrend.metricSelectLabel')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MacroMetric)}
              className="mb-3 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {fiscalMonetaryFields.map((field) => (
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
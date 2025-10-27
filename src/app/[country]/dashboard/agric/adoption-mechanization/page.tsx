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
import { FaTractor, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import '@/styles/dashboard-styles.css';

interface InputData {
  country: string;
  year: number;
  cereal_seeds_tons: number;
  fertilizer_tons: number;
  pesticide_liters: number;
  input_subsidy_budget_usd: number;
  credit_access_pct: number;
  stockouts_days_per_year: number;
  fertilizer_kg_per_ha: number;
  improved_seed_use_pct: number;
  mechanization_units_per_1000_farms: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Input_Data: InputData[];
}

export default function AdoptionMechanizationPage() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<
    'improved_seed_use_pct' | 'fertilizer_kg_per_ha' | 'mechanization_units_per_1000_farms'
  >('improved_seed_use_pct');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const adoptionMechanizationFields = [
    { key: 'improved_seed_use_pct', label: t('adoptionMechanization.improvedSeed'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'fertilizer_kg_per_ha', label: t('adoptionMechanization.fertilizerIntensity'), format: (v: number) => `${v.toFixed(1)} kg/ha` },
    { key: 'mechanization_units_per_1000_farms', label: t('adoptionMechanization.mechanization'), format: (v: number) => `${v.toFixed(1)} units/1,000 farms` },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('adoptionMechanization.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/agric/APMD_ECOWAS_Input_Simulated_2006_2025.json');
        if (!response.ok) throw new Error(t('adoptionMechanization.errors.fetchFailed'));
        const jsonData = (await response.json()) as Dataset;

        const years = jsonData.Simulated_Input_Data.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Simulated_Input_Data.filter(
          (d) => d.country.toLowerCase() === country.toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('adoptionMechanization.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (error) {
        setError(t('adoptionMechanization.errors.fetchFailed'));
        setLoading(false);
      }
    }

    fetchData();
  }, [country, t]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map((d) => d.year))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find((d) => d.year === selectedYear);
  const totalInputUsage = selectedData
    ? selectedData.cereal_seeds_tons + selectedData.fertilizer_tons + selectedData.pesticide_liters
    : 0;

  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => {
      const row: { [key: string]: string | number } = { Year: data.year };
      adoptionMechanizationFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('adoptionMechanization.na');
      });
      row[t('adoptionMechanization.cerealSeeds')] = data.cereal_seeds_tons.toLocaleString();
      row[t('adoptionMechanization.fertilizer')] = data.fertilizer_tons.toLocaleString();
      row[t('adoptionMechanization.pesticides')] = data.pesticide_liters.toLocaleString();
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_adoption_mechanization_data.csv`;
    link.click();
    console.log('CSV downloaded successfully');
  };

  const handlePNGDownload = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found for PNG generation');
      alert(t('adoptionMechanization.errors.pngFailed'));
      return;
    }

    try {
      console.log('Starting PNG download...');
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1000ms delay
      dashboardRef.current.classList.add('snapshot');
      console.log('Applied snapshot styles');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
      });

      console.log('PNG Canvas dimensions:', { width: canvas.width, height: canvas.height });
      dashboardRef.current.classList.remove('snapshot');
      console.log('Removed snapshot styles');

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas is empty or invalid:', { width: canvas?.width, height: canvas?.height });
        throw new Error(t('adoptionMechanization.errors.invalidCanvas'));
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated');
        throw new Error(t('adoptionMechanization.errors.invalidImageData'));
      }

      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${country}_adoption_mechanization_dashboard.png`;
      link.click();
      console.log('PNG downloaded successfully');
    } catch (err) {
      console.error('PNG generation error:', err);
      alert(t('adoptionMechanization.errors.pngFailed'));
    }
  };

  const handlePDFDownload = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found for PDF generation');
      alert(t('adoptionMechanization.errors.pdfFailed'));
      return;
    }

    try {
      console.log('Starting PDF download...');
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1000ms delay
      dashboardRef.current.classList.add('snapshot');
      console.log('Applied snapshot styles');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
      });

      console.log('PDF Canvas dimensions:', { width: canvas.width, height: canvas.height });
      dashboardRef.current.classList.remove('snapshot');
      console.log('Removed snapshot styles');

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas is empty or invalid:', { width: canvas?.width, height: canvas?.height });
        throw new Error(t('adoptionMechanization.errors.invalidCanvas'));
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated');
        throw new Error(t('adoptionMechanization.errors.invalidImageData'));
      }

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.setFontSize(12);
      pdf.text(t('adoptionMechanization.title', { countryName: country.toUpperCase() }), 10, 10);
      pdf.text(t('adoptionMechanization.metrics'), 10, 18);
      pdf.text(t('adoptionMechanization.report_exported', { date: new Date().toLocaleDateString() }), 10, 26);
      pdf.addImage(imgData, 'PNG', 10, 35, imgWidth, imgHeight);
      pdf.save(`${country}_adoption_mechanization_dashboard.pdf`);
      console.log('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(t('adoptionMechanization.errors.pdfFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('adoptionMechanization.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || t('adoptionMechanization.errors.noData', { country })}</p>
        </div>
      </div>
    );
  }

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content" ref={dashboardRef}>
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={t('adoptionMechanization.ariaTitle', { country: countryName })}
        >
          <FaTractor aria-hidden="true" className="text-lg sm:text-xl" /> {t('adoptionMechanization.title', { countryName })}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">{t('adoptionMechanization.simulatedDataNote')}</p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            aria-label={t('adoptionMechanization.downloadCSVLabel')}
          >
            <FaDownload /> {t('adoptionMechanization.downloadCSV')}
          </button>
          <button
            onClick={handlePNGDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            aria-label={t('adoptionMechanization.downloadPNGLabel')}
          >
            <FaDownload /> {t('adoptionMechanization.downloadPNG')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto cursor-pointer"
            aria-label={t('adoptionMechanization.downloadPDFLabel')}
          >
            <FaDownload /> {t('adoptionMechanization.downloadPDF')}
          </button>
        </div>

        <div className="mb-4 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('adoptionMechanization.yearSelectLabel')}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 max-w-full">
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={t('adoptionMechanization.improvedSeedCard', { year: selectedYear })}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{t('adoptionMechanization.improvedSeed')} ({selectedYear})</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">{selectedData.improved_seed_use_pct.toFixed(1)}%</p>
          </div>
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={t('adoptionMechanization.fertilizerCard', { year: selectedYear })}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{t('adoptionMechanization.fertilizerIntensity')} ({selectedYear})</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">{selectedData.fertilizer_kg_per_ha.toFixed(1)} kg/ha</p>
          </div>
          <div className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0" aria-label={t('adoptionMechanization.mechanizationCard', { year: selectedYear })}>
            <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{t('adoptionMechanization.mechanization')} ({selectedYear})</h3>
            <p className="text-[var(--wine)] text-base sm:text-lg">{selectedData.mechanization_units_per_1000_farms.toFixed(1)} units/1,000 farms</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-full">
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section" aria-label={t('adoptionMechanization.trendsChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('adoptionMechanization.trendsTitle', { year: selectedYear })}
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
                  dataKey="improved_seed_use_pct"
                  stroke="var(--olive-green)"
                  name={t('adoptionMechanization.improvedSeed')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="fertilizer_kg_per_ha"
                  stroke="var(--wine)"
                  name={t('adoptionMechanization.fertilizerIntensity')}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="mechanization_units_per_1000_farms"
                  stroke="#8884d8"
                  name={t('adoptionMechanization.mechanization')}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--white)] p-3 sm:p-4 rounded shadow min-w-0 overflow-x-hidden chart-section" aria-label={t('adoptionMechanization.comparisonChart')}>
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              {t('adoptionMechanization.comparisonTitle', { country: countryName })}
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              {t('adoptionMechanization.metricSelectLabel')}
            </label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) =>
                setSelectedMetric(
                  e.target.value as 'improved_seed_use_pct' | 'fertilizer_kg_per_ha' | 'mechanization_units_per_1000_farms'
                )
              }
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto"
            >
              {adoptionMechanizationFields.map((field) => (
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
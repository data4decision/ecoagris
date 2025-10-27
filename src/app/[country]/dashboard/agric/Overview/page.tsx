'use client';

// Import required dependencies
import { useParams, useRouter, useTranslations } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { FaChartBar, FaGlobe, FaCalendarAlt, FaUsers, FaChartLine, FaDollarSign, FaHandsHelping, FaSeedling, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf'; // Ensure jsPDF is imported
import html2canvas from 'html2canvas';
import '@/styles/dashboard-styles.css'; // Import CSS for snapshot styling

// Define TypeScript interfaces
interface MacroData {
  country: string;
  year: number;
  population: number;
  [key: string]: unknown; // Type-safe dynamic keys
}

interface Dataset {
  Simulated_Macro_Data: MacroData[];
  Methodology_Assumptions: { note: string }[];
}

export default function AgricOverviewPage() {
  const { country } = useParams<{ country: string }>();
  const router = useRouter();
  const t = useTranslations('client_trends');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [overviewData, setOverviewData] = useState<MacroData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceRender, setForceRender] = useState(false); // For forcing re-render

  // Page preview data (adjusted for agriculture context)
  const pagePreviews = [
    {
      title: t('pagePreviews.adoptionMechanization.title'),
      icon: FaChartLine,
      path: `/${country}/dashboard/agric/adoption-mechanization`,
      description: t('pagePreviews.adoptionMechanization.description'),
    },
    {
      title: t('pagePreviews.economicIndicators.title'),
      icon: FaDollarSign,
      path: `/${country}/dashboard/agric/economic-indicators`,
      description: t('pagePreviews.economicIndicators.description'),
    },
    {
      title: t('pagePreviews.inputMetric.title'),
      icon: FaHandsHelping,
      path: `/${country}/dashboard/agric/input-metric`,
      description: t('pagePreviews.inputMetric.description'),
    },
    {
      title: t('pagePreviews.forecastSimulation.title'),
      icon: FaGlobe,
      path: `/${country}/dashboard/agric/forecast-simulation`,
      description: t('pagePreviews.forecastSimulation.description'),
    },
    {
      title: t('pagePreviews.dataMethodology.title'),
      icon: FaSeedling,
      path: `/${country}/dashboard/agric/data-methodology`,
      description: t('pagePreviews.dataMethodology.description'),
    },
  ];

  // Fetch data from backend only
  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/macro/WestAfrica_Agric_Simulated_2006_2025.json'); // Adjusted file path for agriculture
        if (!response.ok) throw new Error(t('errors.fetchFailed'));
        const jsonData = (await response.json()) as Dataset;

        if (!jsonData.Simulated_Macro_Data || !Array.isArray(jsonData.Simulated_Macro_Data)) {
          throw new Error(t('errors.invalidDataFormat'));
        }

        const filteredCountryData = jsonData.Simulated_Macro_Data.filter(
          (d) => d.country && d.country.toLowerCase() === country.toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('errors.noData', { country }));
          setLoading(false);
          return;
        }

        const years = filteredCountryData.map((d) => d.year).filter((y) => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years, 2025) : 2025;
        setSelectedYear(maxYear);

        setOverviewData(filteredCountryData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(t('errors.fetchFailed'));
        setLoading(false);
      }
    }

    fetchData();
  }, [country, t]);

  // Get unique years for dropdown
  const availableYears = useMemo(() => {
    return Array.from(new Set(overviewData.map((d) => d.year).filter((y) => typeof y === 'number'))).sort((a, b) => a - b);
  }, [overviewData]);

  // Get data for the selected year
  const selectedData = overviewData.find((d) => d.year === selectedYear);

  // Unified download function for CSV and PDF
  const handleDownload = async (format: 'csv' | 'pdf') => {
    if (!dashboardRef.current && format === 'pdf') {
      console.error('Dashboard element not found');
      alert(t(`errors.${format}Failed`));
      return;
    }

    try {
      if (format === 'csv') {
        // CSV download
        const csvData = overviewData.map((data) => ({
          Country: data.country,
          Year: data.year,
          Population: data.population,
        }));

        const csv = stringify(csvData, { header: true });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${country}_agric_overview.csv`;
        link.click();
        console.log('CSV downloaded successfully');
      } else {
        // PDF download
        setForceRender(true);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for render

        // Apply snapshot styles
        dashboardRef.current.classList.add('snapshot');
        await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for styles

        // Ensure all content is in view
        const originalScrollPosition = { x: window.scrollX, y: window.scrollY };
        window.scrollTo(0, 0);

        // Calculate full content dimensions
        const { scrollWidth, scrollHeight } = dashboardRef.current;
        console.log('Content dimensions:', { scrollWidth, scrollHeight });

        // Capture canvas
        const canvas = await html2canvas(dashboardRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: true,
          width: scrollWidth,
          height: scrollHeight,
          windowWidth: scrollWidth + 200,
          windowHeight: scrollHeight + 200,
          scrollX: 0,
          scrollY: 0,
        });

        // Cleanup
        dashboardRef.current.classList.remove('snapshot');
        setForceRender(false);
        window.scrollTo(originalScrollPosition.x, originalScrollPosition.y);

        // Validate canvas
        if (!canvas || canvas.width === 0 || canvas.height === 0) {
          console.error('Canvas is empty or invalid:', { width: canvas?.width, height: canvas?.height });
          throw new Error(t('errors.invalidCanvas'));
        }

        const imgData = canvas.toDataURL('image/png', 1.0);
        if (!imgData || imgData === 'data:,') {
          console.error('Invalid image data generated from canvas');
          throw new Error(t('errors.invalidImageData'));
        }

        // Create PDF with canvas dimensions
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.setFontSize(12);
        pdf.text(t('title', { countryName: country.toUpperCase() }), 10, 10);
        pdf.text(t('metrics'), 10, 18);
        pdf.text(t('report_exported', { date: new Date().toLocaleDateString() }), 10, 26);
        pdf.save(`${country}_agric_overview.pdf`);
        console.log('PDF downloaded successfully');
      }
    } catch (err) {
      console.error(`${format.toUpperCase()} generation error:`, err);
      alert(t(`errors.${format}Failed`));
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || t('errors.noData', { country })}</p>
        </div>
      </div>
    );
  }

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div ref={dashboardRef} className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content">
        {/* Page Header */}
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={t('ariaTitle', { country: countryName })}
        >
          <FaChartBar aria-hidden="true" className="text-lg sm:text-xl" />
          {t('title', { countryName })}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">{t('simulatedDataNote')}</p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={() => handleDownload('csv')}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label={t('downloadCSVLabel')}
          >
            <FaDownload /> {t('downloadCSV')}
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label={t('downloadPDFLabel')}
          >
            <FaDownload /> {t('downloadPDF')}
          </button>
        </div>

        {/* Year Selection */}
        <div className="mb-6 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            {t('yearSelectLabel')}
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-[var(--olive-green)]"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Overview Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 max-w-full">
          {/* Country Card */}
          <div
            className="bg-gradient-to-br from-[var(--white)] to-[var(--yellow)]/30 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 min-w-0 card"
            aria-label={t('metricCard', { label: 'Country', year: selectedYear })}
          >
            <div className="flex items-center gap-3 mb-2">
              <FaGlobe className="text-[var(--dark-green)] text-lg" />
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base leading-tight">{t('country')}</h3>
            </div>
            <p className="text-[var(--wine)] text-lg sm:text-2xl font-bold">{selectedData.country}</p>
            <p className="text-[var(--olive-green)] text-xs sm:text-sm mt-1">{t('currentYear', { year: selectedYear })}</p>
          </div>

          {/* Year Card */}
          <div
            className="bg-gradient-to-br from-[var(--white)] to-[var(--green)]/30 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 min-w-0 card"
            aria-label={t('metricCard', { label: 'Year', year: selectedYear })}
          >
            <div className="flex items-center gap-3 mb-2">
              <FaCalendarAlt className="text-[var(--dark-green)] text-lg" />
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base leading-tight">{t('year')}</h3>
            </div>
            <p className="text-[var(--wine)] text-lg sm:text-2xl font-bold">{selectedYear}</p>
            <p className="text-[var(--olive-green)] text-xs sm:text-sm mt-1">{t('selected')}</p>
          </div>

          {/* Population Card */}
          <div
            className="bg-gradient-to-br from-[var(--white)] to-[var(--wine)]/30 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 min-w-0 card"
            aria-label={t('metricCard', { label: 'Population', year: selectedYear })}
          >
            <div className="flex items-center gap-3 mb-2">
              <FaUsers className="text-[var(--dark-green)] text-lg" />
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base leading-tight">{t('population')}</h3>
            </div>
            <p className="text-[var(--wine)] text-lg sm:text-2xl font-bold">{selectedData.population?.toLocaleString() || t('na')}</p>
            <p className="text-[var(--olive-green)] text-xs sm:text-sm mt-1">{t('currentYear', { year: selectedYear })}</p>
          </div>
        </div>

        {/* Page Previews Grid */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--dark-green)] mb-4">{t('exploreCategories')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pagePreviews.map((preview) => (
              <div
                key={preview.title}
                className="bg-gradient-to-br from-[var(--white)] to-[var(--green)]/20 p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 cursor-pointer card"
                onClick={() => router.push(preview.path)}
                aria-label={t('navigateTo', { title: preview.title })}
              >
                <div className="flex items-center gap-3 mb-2">
                  <preview.icon className="text-[var(--dark-green)] text-2xl" />
                  <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{preview.title}</h3>
                </div>
                <p className="text-[var(--olive-green)] text-xs sm:text-sm">{preview.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
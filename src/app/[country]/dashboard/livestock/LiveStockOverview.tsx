'use client';

// Import required dependencies
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  FaChartBar,
  FaLeaf,
  FaIndustry,
  FaMoneyBillWave,
  FaHeartbeat,
  FaMap,
  FaChartLine,
  FaDatabase,
  FaDownload,
} from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '@/styles/pdf-styles.css'; // Import CSS for snapshot styling

// Define TypeScript interfaces
interface LivestockData {
  country: string;
  year: number;
  cattle_head: number;
  milk_production_tons: number;
  meat_production_tons: number;
}

interface Dataset {
  Simulated_Livestock_Data: LivestockData[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export default function LivestockOverview() {
  const { country } = useParams<{ country: string }>();
  const router = useRouter();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<LivestockData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation cards
  const nav: NavItem[] = [
    { label: t('livestockOverview.nav.overview'), href: `/${country}/dashboard/livestock`, icon: FaChartBar, description: t('livestockOverview.navDesc.overview') },
    { label: t('livestockOverview.nav.population'), href: `/${country}/dashboard/livestock/population`, icon: FaLeaf, description: t('livestockOverview.navDesc.population') },
    { label: t('livestockOverview.nav.production'), href: `/${country}/dashboard/livestock/production`, icon: FaIndustry, description: t('livestockOverview.navDesc.production') },
    { label: t('livestockOverview.nav.economic'), href: `/${country}/dashboard/livestock/economic-indicators`, icon: FaMoneyBillWave, description: t('livestockOverview.navDesc.economic') },
    { label: t('livestockOverview.nav.health'), href: `/${country}/dashboard/livestock/health-welfare`, icon: FaHeartbeat, description: t('livestockOverview.navDesc.health') },
    { label: t('livestockOverview.nav.grazing'), href: `/${country}/dashboard/livestock/grazing-tranhumance`, icon: FaMap, description: t('livestockOverview.navDesc.grazing') },
    { label: t('livestockOverview.nav.forecast'), href: `/${country}/dashboard/livestock/forecast-simulation`, icon: FaChartLine, description: t('livestockOverview.navDesc.forecast') },
    { label: t('livestockOverview.nav.methodology'), href: `/${country}/dashboard/livestock/data-methodology`, icon: FaDatabase, description: t('livestockOverview.navDesc.methodology') },
  ];

  // Fetch data
  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('livestockOverview.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!response.ok) throw new Error(t('livestockOverview.errors.fetchFailed'));
        const jsonData = (await response.json()) as Dataset;

        if (!jsonData.Simulated_Livestock_Data || !Array.isArray(jsonData.Simulated_Livestock_Data)) {
          throw new Error(t('livestockOverview.errors.invalidDataFormat'));
        }

        const filteredCountryData = jsonData.Simulated_Livestock_Data.filter(
          (d) => d.country && d.country.toLowerCase() === country.toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('livestockOverview.errors.noData', { country }));
          setLoading(false);
          return;
        }

        const years = filteredCountryData.map((d) => d.year).filter((y) => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years, 2025) : 2025;
        setSelectedYear(maxYear);

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(t('livestockOverview.errors.loadingError'));
        setLoading(false);
      }
    }

    fetchData();
  }, [country, t]);

  // Get data for selected year
  const selectedData = countryData.find((d) => d.year === selectedYear);

  // CSV Download (same as AgricInput)
  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => ({
      Country: data.country,
      Year: data.year,
      CattleHead: data.cattle_head?.toLocaleString() ?? t('livestockOverview.na'),
      MilkProductionTons: data.milk_production_tons?.toLocaleString() ?? t('livestockOverview.na'),
      MeatProductionTons: data.meat_production_tons?.toLocaleString() ?? t('livestockOverview.na'),
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_livestock_overview.csv`;
    link.click();
    console.log('CSV downloaded successfully');
  };

  // PNG Download (same as AgricInput)
  const handlePNGDownload = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found for PNG generation');
      alert(t('livestockOverview.errors.pngFailed'));
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
      });

      console.log('PNG Canvas dimensions:', { width: canvas.width, height: canvas.height });

      const imgData = canvas.toDataURL('image/png');
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated');
        throw new Error(t('livestockOverview.errors.invalidImageData'));
      }

      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${country}_livestock_overview.png`;
      link.click();
      console.log('PNG downloaded successfully');
    } catch (err) {
      console.error('PNG generation error:', err);
      alert(t('livestockOverview.errors.pngFailed'));
    }
  };

  // PDF Download (same as AgricInput)
  const handlePDFDownload = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found for PDF generation');
      alert(t('livestockOverview.errors.pdfFailed'));
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
      });

      console.log('PDF Canvas dimensions:', { width: canvas.width, height: canvas.height });

      const imgData = canvas.toDataURL('image/png');
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated');
        throw new Error(t('livestockOverview.errors.invalidImageData'));
      }

      const pdf = new jsPDF('landscape');
      pdf.setFontSize(12);
      pdf.text(t('livestockOverview.title', { countryName: country.toUpperCase() }), 10, 10);
      pdf.text(t('livestockOverview.metrics'), 10, 18);
      pdf.text(t('livestockOverview.report_exported', { date: new Date().toLocaleDateString() }), 10, 26);
      pdf.addImage(imgData, 'PNG', 10, 35, 270, 120);
      pdf.save(`${country}_livestock_overview.pdf`);
      console.log('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(t('livestockOverview.errors.pdfFailed'));
    }
  };

  // Loading & Error States
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--dark-green)] text-lg font-medium">{t('livestockOverview.loading')}</p>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--wine)] text-lg font-medium">{error || t('livestockOverview.errors.noData', { country })}</p>
      </div>
    );
  }

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="min-h-screen bg-[var(--white)] font-sans">
      {/* Header */}
      <header className="bg-[var(--medium-green)] text-[var(--white)] p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-2">
          <FaChartBar className="text-2xl sm:text-3xl text-[var(--yellow)]" />
          <h1 className="text-xl sm:text-2xl font-bold">{t('livestockOverview.title', { countryName })}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 rounded bg-[var(--white)] text-[var(--dark-green)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
            aria-label={t('livestockOverview.yearSelectLabel')}
          >
            {Array.from(new Set(countryData.map(d => d.year))).sort((a, b) => a - b).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={handleCSVDownload}
            className="flex items-center gap-2 cursor-pointer bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 transition-colors"
            aria-label={t('livestockOverview.downloadCSV')}
          >
            <FaDownload className="text-[var(--dark-green)]" /> {t('livestockOverview.downloadCSV')}
          </button>
          <button
            onClick={handlePNGDownload}
            className="flex items-center gap-2 bg-[var(--yellow)] cursor-pointer text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 transition-colors"
            aria-label={t('livestockOverview.downloadPNG')}
          >
            <FaDownload className="text-[var(--dark-green)]" /> {t('livestockOverview.downloadPNG')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center gap-2 bg-[var(--yellow)] cursor-pointer text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 transition-colors"
            aria-label={t('livestockOverview.downloadPDF')}
          >
            <FaDownload className="text-[var(--dark-green)]" /> {t('livestockOverview.downloadPDF')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main ref={dashboardRef} className="max-w-7xl mx-auto p-4 sm:p-6" id="dashboard-content">
        <p className="text-[var(--olive-green)] mb-6 text-sm sm:text-base italic">
          {t('livestockOverview.simulatedDataNote')}
        </p>

        {/* KPI Cards */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--dark-green)] mb-4">
            {t('livestockOverview.kpiTitle', { year: selectedYear })}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[var(--light-green)] p-4 rounded-lg text-center shadow">
              <p className="font-medium text-[var(--dark-green)]">{t('livestockOverview.cattle')}</p>
              <p className="text-3xl font-bold text-[var(--olive-green)]">{selectedData.cattle_head.toLocaleString()}</p>
            </div>
            <div className="bg-[var(--light-green)] p-4 rounded-lg text-center shadow">
              <p className="font-medium text-[var(--dark-green)]">{t('livestockOverview.milk')}</p>
              <p className="text-3xl font-bold text-[var(--olive-green)]">{selectedData.milk_production_tons.toLocaleString()}</p>
            </div>
            <div className="bg-[var(--light-green)] p-4 rounded-lg text-center shadow">
              <p className="font-medium text-[var(--dark-green)]">{t('livestockOverview.meat')}</p>
              <p className="text-3xl font-bold text-[var(--olive-green)]">{selectedData.meat_production_tons.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--dark-green)] mb-4">{t('livestockOverview.exploreCategories')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-[var(--white)] p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)] cursor-pointer"
                  onClick={() => router.push(item.href)}
                  aria-label={t('livestockOverview.navigateTo', { title: item.label })}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="text-[var(--dark-green)] text-2xl" />
                    <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{item.label}</h3>
                  </div>
                  <p className="text-[var(--olive-green)] text-xs sm:text-sm">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
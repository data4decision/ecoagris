'use client';

// Import required dependencies
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { FaChartBar, FaTruck, FaMoneyBillWave, FaSeedling, FaChartLine, FaDatabase, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '@/styles/pdf-styles.css'; // Import CSS for snapshot styling

// Define TypeScript interfaces
interface InputData {
  country: string;
  year: number;
  cereal_seeds_tons?: number;
  fertilizer_tons?: number;
  pesticide_liters?: number;
  input_subsidy_budget_usd?: number;
  credit_access_pct?: number;
  stockouts_days_per_year?: number;
  fertilizer_kg_per_ha?: number;
  improved_seed_use_pct?: number;
  mechanization_units_per_1000_farms?: number;
  distribution_timeliness_pct?: number;
  input_price_index_2006_base?: number;
  agro_dealer_count?: number;
  input_import_value_usd?: number;
  local_production_inputs_tons?: number;
  [key: string]: unknown; // Type-safe dynamic keys
}

interface Dataset {
  Simulated_Input_Data: InputData[];
  Methodology_Assumptions?: {
    data_source?: string;
    simulation_method?: string;
    assumptions?: string[];
  };
}

export default function AgricInputOverviewPage() {
  const { country } = useParams<{ country: string }>();
  const router = useRouter();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation cards based on provided nav array
  const nav = [
    { label: t('overview.overview'), href: `/${country}/dashboard/agric`, icon: FaChartBar, description: t('overview.overviewDescription') },
    { label: t('overview.supplyChain'), href: `/${country}/dashboard/agric/supply`, icon: FaTruck, description: t('overview.supplyChainDescription') },
    { label: t('overview.economicIndicators'), href: `/${country}/dashboard/agric/economic-indicators`, icon: FaMoneyBillWave, description: t('overview.economicIndicatorsDescription') },
    { label: t('overview.adoptionMechanization'), href: `/${country}/dashboard/agric/adoption-mechanization`, icon: FaSeedling, description: t('overview.adoptionMechanizationDescription') },
    { label: t('overview.forecastSimulation'), href: `/${country}/dashboard/agric/forecast-simulation`, icon: FaChartLine, description: t('overview.forecastSimulationDescription') },
    { label: t('overview.dataMethodology'), href: `/${country}/dashboard/agric/data-methodology`, icon: FaDatabase, description: t('overview.dataMethodologyDescription') },
  ];

  // Fetch data from backend only
  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('overview.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/agric/APMD_ECOWAS_Input_Simulated_2006_2025.json');
        if (!response.ok) throw new Error(t('overview.errors.fetchFailed'));
        const jsonData = (await response.json()) as Dataset;

        if (!jsonData.Simulated_Input_Data || !Array.isArray(jsonData.Simulated_Input_Data)) {
          throw new Error(t('overview.errors.invalidDataFormat'));
        }

        const filteredCountryData = jsonData.Simulated_Input_Data.filter(
          (d) => d.country && d.country.toLowerCase() === country.toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('overview.errors.noData', { country }));
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
        setError(t('overview.errors.loadingError'));
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
    const csvData = countryData.map((data) => ({
      Country: data.country,
      Year: data.year,
      CerealSeedsTons: data.cereal_seeds_tons?.toLocaleString() ?? t('overview.na'),
      FertilizerTons: data.fertilizer_tons?.toLocaleString() ?? t('overview.na'),
      PesticideLiters: data.pesticide_liters?.toLocaleString() ?? t('overview.na'),
      InputSubsidyBudgetUSD: data.input_subsidy_budget_usd ? `$${data.input_subsidy_budget_usd.toLocaleString()}` : t('overview.na'),
      CreditAccessPct: data.credit_access_pct ? `${data.credit_access_pct.toFixed(1)}%` : t('overview.na'),
      StockoutsDaysPerYear: data.stockouts_days_per_year?.toLocaleString() ?? t('overview.na'),
      FertilizerKgPerHa: data.fertilizer_kg_per_ha?.toFixed(1) ?? t('overview.na'),
      ImprovedSeedUsePct: data.improved_seed_use_pct ? `${data.improved_seed_use_pct.toFixed(1)}%` : t('overview.na'),
      MechanizationUnitsPer1000Farms: data.mechanization_units_per_1000_farms?.toFixed(1) ?? t('overview.na'),
      DistributionTimelinessPct: data.distribution_timeliness_pct ? `${data.distribution_timeliness_pct.toFixed(1)}%` : t('overview.na'),
      InputPriceIndex2006Base: data.input_price_index_2006_base?.toFixed(2) ?? t('overview.na'),
      AgroDealerCount: data.agro_dealer_count?.toLocaleString() ?? t('overview.na'),
      InputImportValueUSD: data.input_import_value_usd ? `$${data.input_import_value_usd.toLocaleString()}` : t('overview.na'),
      LocalProductionInputsTons: data.local_production_inputs_tons?.toLocaleString() ?? t('overview.na'),
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_agric_input_overview.csv`;
    link.click();
    console.log('CSV downloaded successfully');
  };

  // Function to handle PNG download
  const handlePNGDownload = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found for PNG generation');
      alert(t('overview.errors.pngFailed'));
      return;
    }

    try {
      // Wait for DOM to be fully rendered
      await new Promise((resolve) => setTimeout(resolve, 500)); // Increased to 500ms

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true, // Enable logging for debugging
      });

      console.log('PNG Canvas dimensions:', { width: canvas.width, height: canvas.height });

      const imgData = canvas.toDataURL('image/png');
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated');
        throw new Error(t('overview.errors.invalidImageData'));
      }

      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${country}_agric_input_overview.png`;
      link.click();
      console.log('PNG downloaded successfully');
    } catch (err) {
      console.error('PNG generation error:', err);
      alert(t('overview.errors.pngFailed'));
    }
  };

  // Function to handle PDF download
  const handlePDFDownload = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found for PDF generation');
      alert(t('overview.errors.pdfFailed'));
      return;
    }

    try {
      // Wait for DOM to be fully rendered
      await new Promise((resolve) => setTimeout(resolve, 500)); // Increased to 500ms

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true, // Enable logging for debugging
      });

      console.log('PDF Canvas dimensions:', { width: canvas.width, height: canvas.height });

      const imgData = canvas.toDataURL('image/png');
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated');
        throw new Error(t('overview.errors.invalidImageData'));
      }

      const pdf = new jsPDF('landscape');
      pdf.setFontSize(12);
      pdf.text(t('overview.title', { countryName: country.toUpperCase() }), 10, 10);
      pdf.text(t('overview.metrics'), 10, 18);
      pdf.text(t('overview.report_exported', { date: new Date().toLocaleDateString() }), 10, 26);
      pdf.addImage(imgData, 'PNG', 10, 35, 270, 120);
      pdf.save(`${country}_agric_input_overview.pdf`);
      console.log('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(t('overview.errors.pdfFailed'));
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--dark-green)] text-lg font-medium">{t('overview.loading')}</p>
      </div>
    );
  }

  // Render error state
  if (error || !selectedData) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--wine)] text-lg font-medium">{error || t('overview.errors.noData', { country })}</p>
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
          <h1 className="text-xl sm:text-2xl font-bold">{t('overview.title', { countryName })}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 rounded bg-[var(--white)] text-[var(--dark-green)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
            aria-label={t('overview.yearSelectLabel')}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            onClick={handleCSVDownload}
            className="flex items-center gap-2 cursor-pointer bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 transition-colors"
            aria-label={t('overview.downloadCSV')}
          >
            <FaDownload className="text-[var(--dark-green)]" /> {t('overview.downloadCSV')}
          </button>
          <button
            onClick={handlePNGDownload}
            className="flex items-center gap-2 bg-[var(--yellow)] cursor-pointer text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 transition-colors"
            aria-label={t('overview.downloadPNG')}
          >
            <FaDownload className="text-[var(--dark-green)]" /> {t('overview.downloadPNG')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center gap-2 bg-[var(--yellow)] cursor-pointer text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 transition-colors"
            aria-label={t('overview.downloadPDF')}
          >
            <FaDownload className="text-[var(--dark-green)]" /> {t('overview.downloadPDF')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main ref={dashboardRef} className="max-w-7xl mx-auto p-4 sm:p-6" id="dashboard-content">
        <p className="text-[var(--olive-green)] mb-6 text-sm sm:text-base italic">
          {t('overview.simulatedDataNote')}
        </p>

        {/* Navigation Cards */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--dark-green)] mb-4">{t('overview.exploreCategories')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {nav.map((item) => (
              <div
                key={item.label}
                className="bg-[var(--white)] p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)] cursor-pointer"
                onClick={() => router.push(item.href)}
                aria-label={t('overview.navigateTo', { title: item.label })}
              >
                <div className="flex items-center gap-3 mb-2">
                  <item.icon className="text-[var(--dark-green)] text-2xl" />
                  <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{item.label}</h3>
                </div>
                <p className="text-[var(--olive-green)] text-xs sm:text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
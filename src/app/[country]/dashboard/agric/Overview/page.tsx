'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { FaChartBar, FaGlobe, FaCalendarAlt, FaSeedling, FaDownload, FaTruck, FaMoneyBillWave, FaChartLine, FaChartPie, FaDatabase } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import '@/styles/dashboard-styles.css';

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
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Input_Data: InputData[];
  Methodology_Assumptions?: {
    data_source?: string;
    simulation_method?: string;
    assumptions?: string[];
  };
}

export default function OverviewPage() {
  const { country } = useParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);

  // Page previews for navigation
  const pagePreviews = [
    {
      title: t('overview.nav.supplyChain'),
      icon: FaTruck,
      path: `/${country}/dashboard/agric/supply`,
      description: t('overview.navDescriptions.supplyChain'),
    },
    {
      title: t('overview.nav.economicIndicators'),
      icon: FaMoneyBillWave,
      path: `/${country}/dashboard/agric/economic-indicators`,
      description: t('overview.navDescriptions.economicIndicators'),
    },
    {
      title: t('overview.nav.adoptionMechanization'),
      icon: FaSeedling,
      path: `/${country}/dashboard/agric/adoption-mechanization`,
      description: t('overview.navDescriptions.adoptionMechanization'),
    },
    {
      title: t('overview.nav.forecastSimulation'),
      icon: FaChartLine,
      path: `/${country}/dashboard/agric/forecast-simulation`,
      description: t('overview.navDescriptions.forecastSimulation'),
    },
    {
      title: t('overview.nav.inputMetrics'),
      icon: FaChartPie,
      path: `/${country}/dashboard/agric/input-metric`,
      description: t('overview.navDescriptions.inputMetrics'),
    },
    {
      title: t('overview.nav.dataMethodology'),
      icon: FaDatabase,
      path: `/${country}/dashboard/agric/data-methodology`,
      description: t('overview.navDescriptions.dataMethodology'),
    },
  ];

  // Fetch data from JSON file
  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/agric/APMD_ECOWAS_Input_Simulated_2006_2025.json');
        if (!response.ok) {
          throw new Error(t('overview.errors.fetchFailed'));
        }
        const jsonData = (await response.json()) as Dataset;

        if (!jsonData.Simulated_Input_Data || !Array.isArray(jsonData.Simulated_Input_Data)) {
          throw new Error(t('overview.errors.invalidDataset'));
        }

        const filteredCountryData = jsonData.Simulated_Input_Data.filter(
          (d) => d.country && d.country.toLowerCase() === (country as string).toLowerCase()
        );

        if (filteredCountryData.length === 0) {
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

  // CSV download
  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => ({
      Country: data.country,
      Year: data.year,
      Cereal_Seeds_Tons: data.cereal_seeds_tons?.toLocaleString() || t('overview.na'),
      Fertilizer_Tons: data.fertilizer_tons?.toLocaleString() || t('overview.na'),
      Pesticide_Liters: data.pesticide_liters?.toLocaleString() || t('overview.na'),
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_agric_overview.csv`;
    link.click();
  };

  // Unified download logic for PNG and PDF
  const handleDownload = async (format: 'png' | 'pdf') => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found');
      alert(t(`overview.errors.${format}Failed`));
      return;
    }

    try {
      // Wait for DOM to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Apply snapshot styles
      dashboardRef.current.classList.add('snapshot');
      await new Promise((resolve) => setTimeout(resolve, 500)); // Additional wait for styles

      // Capture canvas
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
      });

      dashboardRef.current.classList.remove('snapshot');

      // Validate canvas
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas is empty or invalid:', { width: canvas?.width, height: canvas?.height });
        throw new Error(t('overview.errors.invalidCanvas'));
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated from canvas');
        throw new Error(t('overview.errors.invalidImageData'));
      }

      if (format === 'png') {
        // PNG download
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${country}_agric_overview.png`;
        link.click();
        console.log('PNG downloaded successfully');
      } else {
        // PDF download
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2], // Scale down for PDF
        });

        pdf.setFontSize(12);
        pdf.text(t('overview.title', { countryName: (country as string).toUpperCase() }), 10, 10);
        pdf.text(t('overview.cards.cerealSeeds'), 10, 18);
        pdf.text(t('overview.report_exported', { date: new Date().toLocaleDateString() }), 10, 26);
        pdf.addImage(imgData, 'PNG', 10, 35, canvas.width / 2 - 20, canvas.height / 2 - 20);
        pdf.save(`${country}_agric_overview.pdf`);
        console.log('PDF downloaded successfully');
      }
    } catch (err) {
      console.error(`${format.toUpperCase()} generation error:`, err);
      alert(t(`overview.errors.${format}Failed`));
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-dark-green text-base sm:text-lg">{t('overview.loading')}</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-wine text-base sm:text-lg">{t('overview.errors.noData', { country })}</p>
        </div>
      </div>
    );
  }

  const countryName = (country as string).charAt(0).toUpperCase() + (country as string).slice(1);

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div ref={dashboardRef} className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content">
        <h1
          className="text-xl sm:text-2xl font-bold text-dark-green mb-4 flex items-center gap-2"
          aria-label={t('overview.ariaTitle', { country: countryName })}
        >
          <FaChartBar aria-hidden="true" className="text-lg sm:text-xl" />
          {t('overview.title', { countryName })}
        </h1>
        <p className="text-olive-green mb-4 text-sm sm:text-base">{t('overview.simulatedDataNote')}</p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('overview.downloadCSVLabel')}
          >
            <FaDownload /> {t('overview.downloadCSV')}
          </button>
          <button
            onClick={() => handleDownload('png')}
            className="flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('overview.downloadPNGLabel')}
          >
            <FaDownload /> {t('overview.downloadPNG')}
          </button>
          <button
            onClick={() => handleDownload('pdf')}
            className="flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('overview.downloadPDFLabel')}
          >
            <FaDownload /> {t('overview.downloadPDF')}
          </button>
        </div>

        <div className="mb-6 max-w-full">
          <label htmlFor="year-select" className="sr-only">{t('overview.yearSelectLabel')}</label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-sm sm:text-base w-full sm:w-auto"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 max-w-full">
          <div
            className="card min-w-0"
            aria-label={t('overview.countryCardAria', { year: selectedYear })}
          >
            <div className="flex items-center gap-3 mb-2">
              <FaGlobe className="text-dark-green text-lg" />
              <h3 className="text-dark-green font-semibold text-sm sm:text-base leading-tight">{t('overview.cards.country')}</h3>
            </div>
            <p className="text-wine text-lg sm:text-2xl font-bold">{selectedData.country}</p>
            <p className="text-olive-green text-xs sm:text-sm mt-1">{t('overview.cards.currentYear', { year: selectedYear })}</p>
          </div>

          <div
            className="card min-w-0"
            aria-label={t('overview.yearCardAria', { year: selectedYear })}
          >
            <div className="flex items-center gap-3 mb-2">
              <FaCalendarAlt className="text-dark-green text-lg" />
              <h3 className="text-dark-green font-semibold text-sm sm:text-base leading-tight">{t('overview.cards.year')}</h3>
            </div>
            <p className="text-wine text-lg sm:text-2xl font-bold">{selectedYear}</p>
            <p className="text-olive-green text-xs sm:text-sm mt-1">{t('overview.cards.selected')}</p>
          </div>

          <div
            className="card min-w-0"
            aria-label={t('overview.cerealSeedsCardAria', { year: selectedYear })}
          >
            <div className="flex items-center gap-3 mb-2">
              <FaSeedling className="text-dark-green text-lg" />
              <h3 className="text-dark-green font-semibold text-sm sm:text-base leading-tight">{t('overview.cards.cerealSeeds')}</h3>
            </div>
            <p className="text-wine text-lg sm:text-2xl font-bold">{selectedData.cereal_seeds_tons?.toLocaleString() || t('overview.na')}</p>
            <p className="text-olive-green text-xs sm:text-sm mt-1">{t('overview.cards.yearLabel', { year: selectedYear })}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-dark-green mb-4">{t('overview.exploreCategories')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pagePreviews.map((preview) => (
              <div
                key={preview.title}
                className="card cursor-pointer"
                onClick={() => router.push(preview.path)}
                aria-label={t('overview.navAria', { title: preview.title })}
              >
                <div className="flex items-center gap-3 mb-2">
                  <preview.icon className="text-dark-green text-2xl" />
                  <h3 className="text-dark-green font-semibold text-sm sm:text-base">{preview.title}</h3>
                </div>
                <p className="text-olive-green text-xs sm:text-sm">{preview.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
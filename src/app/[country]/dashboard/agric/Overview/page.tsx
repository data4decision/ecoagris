'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { FaChartBar, FaGlobe, FaCalendarAlt, FaSeedling, FaDownload, FaTruck, FaMoneyBillWave, FaChartLine, FaChartPie, FaDatabase } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf'; // Commented out unless PDF is needed
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

  // PNG download
  const handlePNGDownload = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found: dashboardRef.current is null');
      alert(t('overview.errors.pngFailed'));
      return;
    }

    try {
      // Validate dashboard visibility and dimensions
      const rect = dashboardRef.current.getBoundingClientRect();
      console.log('Dashboard dimensions:', { width: rect.width, height: rect.height });
      if (rect.width === 0 || rect.height === 0) {
        console.error('Dashboard has zero dimensions:', rect);
        throw new Error(t('overview.errors.invalidDimensions'));
      }

      const computedStyle = window.getComputedStyle(dashboardRef.current);
      if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        console.error('Dashboard is not visible:', { display: computedStyle.display, visibility: computedStyle.visibility });
        throw new Error(t('overview.errors.notVisible'));
      }

      // Handle images (if any)
      const images = dashboardRef.current.querySelectorAll('img');
      if (images.length > 0) {
        console.log(`Found ${images.length} images, ensuring they are loaded...`);
        await Promise.all(
          Array.from(images).map((img) => {
            if (img.src.includes('/_next/image')) {
              const url = new URL(img.src).searchParams.get('url');
              img.src = url ? decodeURIComponent(url) : img.src;
            }
            img.crossOrigin = 'anonymous';
            return new Promise((resolve) => {
              if (img.complete && img.naturalWidth !== 0) {
                console.log(`Image loaded: ${img.src}`);
                resolve(true);
              } else {
                img.onload = () => {
                  console.log(`Image loaded: ${img.src}`);
                  resolve(true);
                };
                img.onerror = () => {
                  console.warn(`Failed to load image: ${img.src}`);
                  resolve(false);
                };
              }
            });
          })
        );
      } else {
        console.log('No images found in dashboard, skipping image processing.');
      }

      // Apply snapshot styles
      console.log('Applying snapshot styles...');
      dashboardRef.current.classList.add('snapshot');
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Wait for rendering

      // Force scroll to top
      window.scrollTo(0, 0);
      dashboardRef.current.scrollTop = 0;

      // Capture canvas
      console.log('Capturing dashboard with html2canvas...');
      const canvas = await html2canvas(dashboardRef.current, {
        scale: window.devicePixelRatio || 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
        width: dashboardRef.current.scrollWidth,
        height: dashboardRef.current.scrollHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedDashboard = clonedDoc.getElementById('dashboard-content');
          if (clonedDashboard) {
            clonedDashboard.style.width = `${dashboardRef.current!.scrollWidth}px`;
            clonedDashboard.style.height = `${dashboardRef.current!.scrollHeight}px`;
            clonedDashboard.style.overflow = 'visible';
            clonedDashboard.style.background = '#ffffff';
            clonedDashboard.style.padding = '20px';
            const styles = document.styleSheets;
            for (let i = 0; i < styles.length; i++) {
              try {
                const rules = styles[i].cssRules;
                for (let j = 0; j < rules.length; j++) {
                  const rule = rules[j] as CSSStyleRule;
                  if (rule.selectorText && rule.selectorText.includes('.snapshot')) {
                    clonedDashboard.style.cssText += rule.style.cssText;
                    console.log('Applied rule:', rule.cssText);
                  }
                }
              } catch (e) {
                console.warn('Unable to access stylesheet:', e);
              }
            }
          }
        },
      });

      dashboardRef.current.classList.remove('snapshot');

      // Validate canvas
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas is empty or invalid:', { width: canvas?.width, height: canvas?.height });
        throw new Error(t('overview.errors.invalidCanvas'));
      }

      // Download PNG
      console.log('Downloading PNG...');
      const imgData = canvas.toDataURL('image/png', 1.0);
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated from canvas');
        throw new Error(t('overview.errors.invalidImageData'));
      }

      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${country}_agric_overview.png`;
      link.click();
      console.log('PNG downloaded successfully');
    } catch (err) {
      console.error('PNG generation error:', err);
      alert(t('overview.errors.pngFailed'));
    }
  };

  // PDF download (commented out unless needed)
  
  const handlePDFDownload = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found: dashboardRef.current is null');
      alert(t('overview.errors.pdfFailed'));
      return;
    }

    try {
      const rect = dashboardRef.current.getBoundingClientRect();
      console.log('Dashboard dimensions:', { width: rect.width, height: rect.height });
      if (rect.width === 0 || rect.height === 0) {
        console.error('Dashboard has zero dimensions:', rect);
        throw new Error(t('overview.errors.invalidDimensions'));
      }

      const computedStyle = window.getComputedStyle(dashboardRef.current);
      if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        console.error('Dashboard is not visible:', { display: computedStyle.display, visibility: computedStyle.visibility });
        throw new Error(t('overview.errors.notVisible'));
      }

      console.log('Applying snapshot styles for PDF...');
      dashboardRef.current.classList.add('snapshot');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      window.scrollTo(0, 0);
      dashboardRef.current.scrollTop = 0;

      console.log('Capturing dashboard with html2canvas for PDF...');
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
        width: dashboardRef.current.scrollWidth,
        height: dashboardRef.current.scrollHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      dashboardRef.current.classList.remove('snapshot');

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas is empty or invalid:', { width: canvas?.width, height: canvas?.height });
        throw new Error(t('overview.errors.invalidCanvas'));
      }

      console.log('Generating PDF...');
      const imgData = canvas.toDataURL('image/png', 1.0);
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated from canvas');
        throw new Error(t('overview.errors.invalidImageData'));
      }

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${country}_agric_overview.pdf`);
      console.log('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(t('overview.errors.pdfFailed'));
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
            className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('overview.downloadCSVLabel')}
          >
            <FaDownload /> {t('overview.downloadCSV')}
          </button>
          <button
            onClick={handlePNGDownload}
            className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base w-full sm:w-auto"
            aria-label={t('overview.downloadPNGLabel')}
          >
            <FaDownload /> {t('overview.downloadPNG')}
          </button>
          
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base w-full sm:w-auto"
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
            className="p-2 rounded text-sm sm:text-base w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-[var(--olive-green)]"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 max-w-full">
          <div
            className="card p-4 sm:p-6 min-w-0"
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
            className="card p-4 sm:p-6 min-w-0"
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
            className="card p-4 sm:p-6 min-w-0"
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
                className="card p-6 cursor-pointer"
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
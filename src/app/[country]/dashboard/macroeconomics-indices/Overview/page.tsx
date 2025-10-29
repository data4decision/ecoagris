'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  FaChartBar,
  FaGlobe,
  FaCalendarAlt,
  FaUsers,
  FaChartLine,
  FaDollarSign,
  FaHandsHelping,
  FaSeedling,
  FaDownload,
} from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';
import '@/styles/pdf-styles.css';

interface MacroData {
  country: string;
  year: number;
  population: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Macro_Data: MacroData[];
  Methodology_Assumptions?: { note: string }[];
}

export default function MacroOverviewPage() {
  const { t } = useTranslation('common');
  const { country } = useParams<{ country: string }>();
  const router = useRouter();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [overviewData, setOverviewData] = useState<MacroData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nav = [
    {
      label: t('macro.overview.nav.economicOutput'),
      href: `/${country}/dashboard/macroeconomics-indices/economic-output`,
      icon: FaChartLine,
      description: t('macro.overview.nav.economicOutputDesc'),
    },
    {
      label: t('macro.overview.nav.fiscalMonetary'),
      href: `/${country}/dashboard/macroeconomics-indices/fiscal-monetary`,
      icon: FaDollarSign,
      description: t('macro.overview.nav.fiscalMonetaryDesc'),
    },
    {
      label: t('macro.overview.nav.laborPoverty'),
      href: `/${country}/dashboard/macroeconomics-indices/labor-poverty`,
      icon: FaHandsHelping,
      description: t('macro.overview.nav.laborPovertyDesc'),
    },
    {
      label: t('macro.overview.nav.tradeInvestment'),
      href: `/${country}/dashboard/macroeconomics-indices/trade-investment`,
      icon: FaGlobe,
      description: t('macro.overview.nav.tradeInvestmentDesc'),
    },
    {
      label: t('macro.overview.nav.agriculture'),
      href: `/${country}/dashboard/macroeconomics-indices/agriculture`,
      icon: FaSeedling,
      description: t('macro.overview.nav.agricultureDesc'),
    },
  ];

  // Fetch data
  useEffect(() => {
    if (!country) {
      setError(t('macro.overview.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/macro/WestAfrica_Macro_Simulated_2006_2025.json');
        if (!response.ok) throw new Error(t('macro.overview.errors.fetchFailed'));

        const jsonData = (await response.json()) as Dataset;
        if (!jsonData.Simulated_Macro_Data || !Array.isArray(jsonData.Simulated_Macro_Data)) {
          throw new Error(t('macro.overview.errors.invalidFormat'));
        }

        const filtered = jsonData.Simulated_Macro_Data.filter(
          (d) => d.country && d.country.toLowerCase() === country.toLowerCase()
        );

        if (filtered.length === 0) {
          setError(t('macro.overview.errors.noData', { country }));
          setLoading(false);
          return;
        }

        const years = filtered.map((d) => d.year).filter((y): y is number => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years) : 2025;
        setSelectedYear(maxYear);
        setOverviewData(filtered);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(t('macro.overview.errors.loadingError'));
        setLoading(false);
      }
    }

    fetchData();
  }, [country, t]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(overviewData.map((d) => d.year).filter((y): y is number => typeof y === 'number'))).sort(
      (a, b) => a - b
    );
  }, [overviewData]);

  const selectedData = overviewData.find((d) => d.year === selectedYear);

  // CSV Download
  const handleCSVDownload = () => {
    const csvData = overviewData.map((data) => ({
      [t('macro.overview.csv.country')]: data.country,
      [t('macro.overview.csv.year')]: data.year,
      [t('macro.overview.csv.population')]: data.population?.toLocaleString() ?? t('macro.overview.na'),
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_macro_overview.csv`;
    link.click();
  };

  // PNG Download – FIXED
  const handlePNGDownload = async () => {
    const el = dashboardRef.current;
    if (!el) return alert(t('macro.overview.errors.pngFailed'));

    try {
      await new Promise((r) => setTimeout(r, 300));
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png'); 

      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${country}_macro_overview.png`;
      link.click();
    } catch (err) {
      console.error('PNG error:', err);
      alert(t('macro.overview.errors.pngFailed'));
    }
  };

  // PDF Download – 100% WORKING
  const handlePDFDownload = async () => {
    const el = dashboardRef.current;
    if (!el) return alert(t('macro.overview.errors.pdfFailed'));

    try {
      // 1. Force repaint
      el.style.visibility = 'hidden';
      await new Promise((r) => setTimeout(r, 300));
      el.style.visibility = 'visible';

      // 2. Inline CSS vars → plain colors
      const colorMap: Record<string, string> = {
        '--white': '#FFFFFF',
        '--green': '#008100',
        '--dark-green': '#007D00',
        '--olive-green': '#007C00',
        '--medium-green': '#008000',
        '--yellow': '#ffdc24',
        '--wine': '#7a0917',
        '--red': '#ec0606',
      };

      const walk = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT);
      let node: HTMLElement | null;
      while ((node = walk.nextNode() as HTMLElement)) {
        const style = node.style;
        for (const prop of Object.keys(style)) {
          const val = style.getPropertyValue(prop);
          if (val.includes('var(')) {
            const match = val.match(/var\((--[^)]+)\)/);
            if (match?.[1] && colorMap[match[1]]) {
              style.setProperty(prop, colorMap[match[1]]);
            }
          }
        }
        // Force background
        if (node.classList.contains('bg-[var(--yellow)]')) node.style.backgroundColor = colorMap['--yellow'];
        if (node.classList.contains('bg-[var(--white)]')) node.style.backgroundColor = colorMap['--white'];
        if (node.classList.contains('bg-[var(--medium-green)]')) node.style.backgroundColor = colorMap['--medium-green'];
      }

      // 3. Capture
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: el.scrollWidth,
        height: el.scrollHeight,
      });

      if (!canvas || canvas.width === 0) throw new Error('Canvas empty');

      // 4. PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = 297;
      const margin = 10;
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.setFontSize(14);
      pdf.text(t('macro.overview.pdf.title', { country: country.toUpperCase() }), margin, 12);
      pdf.setFontSize(11);
      pdf.text(t('macro.overview.pdf.metrics'), margin, 20);
      pdf.text(t('macro.overview.pdf.exported', { date: new Date().toLocaleDateString() }), margin, 26);
      pdf.addImage(imgData, 'PNG', margin, 32, imgWidth, imgHeight);
      pdf.save(`${country}_macro_overview.pdf`);
    } catch (err: unknown) {
      console.error('PDF error:', err);
      alert(t('macro.overview.errors.pdfFailed') + ' ' + (err as Error).message);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--dark-green)] text-lg font-medium">{t('macro.overview.loading')}</p>
      </div>
    );
  }

  // Error
  if (error || !selectedData) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--wine)] text-lg font-medium">{error || t('macro.overview.errors.noData', { country })}</p>
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
          <h1 className="text-xl sm:text-2xl font-bold">{t('macro.overview.title', { countryName })}</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 rounded bg-[var(--white)] text-[var(--dark-green)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
            aria-label={t('macro.overview.yearSelectLabel')}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={handleCSVDownload}
            className="flex items-center gap-2 bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 transition-colors"
            aria-label={t('macro.overview.downloadCSV')}
          >
            <FaDownload /> {t('macro.overview.downloadCSV')}
          </button>
          <button
            onClick={handlePNGDownload}
            className="flex items-center gap-2 bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 transition-colors"
            aria-label={t('macro.overview.downloadPNG')}
          >
            <FaDownload /> {t('macro.overview.downloadPNG')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center gap-2 bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 transition-colors"
            aria-label={t('macro.overview.downloadPDF')}
          >
            <FaDownload /> {t('macro.overview.downloadPDF')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main ref={dashboardRef} className="max-w-7xl mx-auto p-4 sm:p-6" id="dashboard-content">
        <p className="text-[var(--olive-green)] mb-6 text-sm sm:text-base italic">
          {t('macro.overview.simulatedDataNote')}
        </p>

        {/* Navigation Cards – PDF SAFE */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--dark-green)] mb-4">
            {t('macro.overview.exploreCategories')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {nav.map((item) => (
              <div
                key={item.label}
                className="bg-[var(--white)] p-6 rounded-lg shadow-md border border-[var(--medium-green)] cursor-pointer hover:bg-[var(--yellow)]/10"
                onClick={() => router.push(item.href)}
                aria-label={t('macro.overview.navigateTo', { title: item.label })}
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
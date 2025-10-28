'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { FaHorse, FaLeaf, FaDrumstickBite, FaChartLine, FaCalendarAlt, FaDownload } from 'react-icons/fa';
import { format } from 'date-fns';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';

// Full dataset interface
interface LivestockData {
  country: string;
  year: number;
  cattle_head: number;
  small_ruminants_head: number;
  pigs_head: number;
  poultry_head: number;
  milk_production_tons: number;
  meat_production_tons: number;
  livestock_price_index_2006_base: number;
  vaccination_coverage_pct: number;
  fmd_incidents_count: number;
  grazing_area_ha: number;
  transhumance_events: number;
  veterinary_facilities_count: number;
  feed_imports_tons: number;
  local_feed_production_tons: number;
  livestock_exports_tons: number;
  offtake_rate_pct: number;
}

interface Dataset {
  Simulated_Livestock_Data: LivestockData[];
}

export default function LiveStockOverview() {
  const { t } = useTranslation('common');
  const { country } = useParams<{ country: string }>();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<LivestockData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    if (!country) return;

    const fetchData = async () => {
      try {
        const res = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!res.ok) throw new Error(t('livestockOverview.errors.fetchFailed'));

        const json: Dataset = await res.json();

        const filtered = json.Simulated_Livestock_Data.filter(
          (d) => d.country?.toLowerCase() === country.toLowerCase()
        );

        if (filtered.length === 0) {
          throw new Error(t('livestockOverview.errors.noData', { country }));
        }

        const years = filtered.map(d => d.year).sort((a, b) => b - a);
        setSelectedYear(years[0]);
        setData(filtered);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('livestockOverview.errors.loadingError'));
        setLoading(false);
      }
    };

    fetchData();
  }, [country, t]);

  // Current year data — safe fallback
  const current = useMemo(() => {
    return data.find(d => d.year === selectedYear) ?? data[0] ?? null;
  }, [data, selectedYear]);

  const years = useMemo(() => {
    return Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a);
  }, [data]);

  // Formatters
  const formatNum = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const formatTons = (t: number): string => `${formatNum(t)} t`;

  // === EARLY RETURN: Loading / Error / No Data ===
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex items-center justify-center">
        <p className="text-lg font-medium text-[var(--dark-green)]">
          {t('livestockOverview.loading')}
        </p>
      </div>
    );
  }

  if (error || !current) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex items-center justify-center p-4">
        <p className="text-lg font-medium text-[var(--red)] text-center">
          {error || t('livestockOverview.errors.noData', { country })}
        </p>
      </div>
    );
  }

  // === SAFE TO USE `current` NOW ===
  const totalAnimals =
    current.cattle_head +
    current.small_ruminants_head +
    current.pigs_head +
    current.poultry_head;

  // === DOWNLOAD FUNCTIONS ===
  const handleCSVDownload = () => {
    const csvData = data.map(d => ({
      [t('livestockOverview.country')]: d.country,
      [t('livestockOverview.year')]: d.year,
      [t('livestockOverview.cattle')]: d.cattle_head,
      [t('livestockOverview.smallRuminants')]: d.small_ruminants_head,
      [t('livestockOverview.poultry')]: d.poultry_head,
      [t('livestockOverview.milk')]: d.milk_production_tons,
      [t('livestockOverview.meat')]: d.meat_production_tons,
      [t('livestockOverview.priceIndex')]: d.livestock_price_index_2006_base.toFixed(3),
      [t('livestockOverview.vaccination')]: d.vaccination_coverage_pct.toFixed(1),
      [t('livestockOverview.fmdIncidents')]: d.fmd_incidents_count,
      [t('livestockOverview.grazingArea')]: d.grazing_area_ha,
      [t('livestockOverview.vetFacilities')]: d.veterinary_facilities_count,
      [t('livestockOverview.offtakeRate')]: d.offtake_rate_pct.toFixed(1),
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${country}_livestock_data_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePNGDownload = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${country}_livestock_overview_${selectedYear}.png`;
      link.click();
    } catch (err) {
      console.error('PNG export failed:', err);
      alert(t('livestockOverview.errors.pngFailed'));
    }
  };

  const handlePDFDownload = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape');
      const imgWidth = pdf.internal.pageSize.getWidth() - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.setFontSize(16);
      pdf.text(t('livestockOverview.title', { countryName: country.toUpperCase() }), 14, 15);
      pdf.setFontSize(10);
      pdf.text(t('livestockOverview.report_exported', { date: format(new Date(), 'PPP') }), 14, 22);
      pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
      pdf.save(`${country}_livestock_overview_${selectedYear}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert(t('livestockOverview.errors.pdfFailed'));
    }
  };

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[var(--medium-green)] text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <FaHorse className="text-3xl text-[var(--yellow)]" />
            <h1 className="text-2xl font-bold">
              {t('livestockOverview.title', { countryName })}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-[var(--yellow)]" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white text-[var(--dark-green)] px-3 py-1.5 rounded text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
                aria-label={t('livestockOverview.yearSelectLabel')}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Download Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCSVDownload}
                className="flex items-center gap-1.5 bg-[var(--yellow)] text-[var(--dark-green)] px-3 py-1.5 rounded text-sm font-medium hover:bg-[var(--yellow)]/90 transition"
                title={t('livestockOverview.downloadCSV')}
              >
                <FaDownload /> {t('livestockOverview.downloadCSV')}
              </button>
              <button
                onClick={handlePNGDownload}
                className="flex items-center gap-1.5 bg-[var(--yellow)] text-[var(--dark-green)] px-3 py-1.5 rounded text-sm font-medium hover:bg-[var(--yellow)]/90 transition"
                title={t('livestockOverview.downloadPNG')}
              >
                <FaDownload /> {t('livestockOverview.downloadPNG')}
              </button>
              <button
                onClick={handlePDFDownload}
                className="flex items-center gap-1.5 bg-[var(--yellow)] text-[var(--dark-green)] px-3 py-1.5 rounded text-sm font-medium hover:bg-[var(--yellow)]/90 transition"
                title={t('livestockOverview.downloadPDF')}
              >
                <FaDownload /> {t('livestockOverview.downloadPDF')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main ref={dashboardRef} className="max-w-7xl mx-auto px-4 py-8 bg-white">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {/* Total Animals */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-600">{t('livestockOverview.totalAnimals')}</h3>
              <FaLeaf className="text-2xl text-[var(--olive-green)]" />
            </div>
            <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(totalAnimals)}</p>
            <p className="text-xs text-gray-500">{t('livestockOverview.heads')}</p>
          </div>

          {/* Cattle */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-600">{t('livestockOverview.cattle')}</h3>
              <FaHorse className="text-2xl text-[var(--green)]" />
            </div>
            <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(current.cattle_head)}</p>
            <p className="text-xs text-gray-500">{t('livestockOverview.heads')}</p>
          </div>

          {/* Small Ruminants */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-600">{t('livestockOverview.smallRuminants')}</h3>
              <FaLeaf className="text-2xl text-[var(--olive-green)]" />
            </div>
            <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(current.small_ruminants_head)}</p>
            <p className="text-xs text-gray-500">{t('livestockOverview.heads')}</p>
          </div>

          {/* Poultry */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-600">{t('livestockOverview.poultry')}</h3>
              <FaDrumstickBite className="text-2xl text-[var(--yellow)]" />
            </div>
            <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(current.poultry_head)}</p>
            <p className="text-xs text-gray-500">{t('livestockOverview.heads')}</p>
          </div>

          {/* Milk */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-600">{t('livestockOverview.milk')}</h3>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">M</div>
            </div>
            <p className="text-3xl font-bold text-[var(--dark-green)]">{formatTons(current.milk_production_tons)}</p>
            <p className="text-xs text-gray-500">{t('livestockOverview.tons')}</p>
          </div>

          {/* Meat */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-600">{t('livestockOverview.meat')}</h3>
              <FaDrumstickBite className="text-2xl text-[var(--wine)]" />
            </div>
            <p className="text-3xl font-bold text-[var(--dark-green)]">{formatTons(current.meat_production_tons)}</p>
            <p className="text-xs text-gray-500">{t('livestockOverview.tons')}</p>
          </div>

          {/* Vaccination */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-600">{t('livestockOverview.vaccination')}</h3>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">V</div>
            </div>
            <p className="text-3xl font-bold text-[var(--dark-green)]">{current.vaccination_coverage_pct.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">{t('livestockOverview.coverage')}</p>
          </div>

          {/* Price Index */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-600">{t('livestockOverview.priceIndex')}</h3>
              <FaChartLine className="text-2xl text-[var(--yellow)]" />
            </div>
            <p className="text-3xl font-bold text-[var(--dark-green)]">{current.livestock_price_index_2006_base.toFixed(3)}</p>
            <p className="text-xs text-gray-500">2006 = 1.0</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-[var(--dark-green)] text-white p-4 rounded-lg">
            <p className="text-xs opacity-80">{t('livestockOverview.fmdIncidents')}</p>
            <p className="text-2xl font-bold">{current.fmd_incidents_count}</p>
          </div>
          <div className="bg-[var(--olive-green)] text-white p-4 rounded-lg">
            <p className="text-xs opacity-80">{t('livestockOverview.vetFacilities')}</p>
            <p className="text-2xl font-bold">{current.veterinary_facilities_count}</p>
          </div>
          <div className="bg-[var(--yellow)] text-[var(--dark-green)] p-4 rounded-lg">
            <p className="text-xs font-medium">{t('livestockOverview.grazingArea')}</p>
            <p className="text-2xl font-bold">{formatNum(current.grazing_area_ha)} ha</p>
          </div>
          <div className="bg-[var(--wine)] text-white p-4 rounded-lg">
            <p className="text-xs opacity-80">{t('livestockOverview.offtakeRate')}</p>
            <p className="text-2xl font-bold">{current.offtake_rate_pct.toFixed(1)}%</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            {t('livestockOverview.simulatedDataNote')} • {t('livestockOverview.lastUpdated', { date: format(new Date(), 'MMMM d, yyyy') })}
          </p>
        </div>
      </main>
    </div>
  );
}
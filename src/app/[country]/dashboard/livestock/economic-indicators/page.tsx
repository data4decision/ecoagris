'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { FaDollarSign, FaChartLine, FaDownload, FaTruck, FaLeaf, FaPercentage } from 'react-icons/fa';
import { format } from 'date-fns';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '@/styles/pdf-styles.css';

interface EconomicData {
  country: string;
  year: number;
  livestock_price_index_2006_base: number;
  livestock_exports_tons: number;
  offtake_rate_pct: number;
  feed_imports_tons: number;
  local_feed_production_tons: number;
}

interface Dataset {
  Simulated_Livestock_Data: EconomicData[];
}

export default function Economic() {
  const { t } = useTranslation('common');
  const { country } = useParams<{ country: string }>();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<EconomicData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === FETCH REAL DATA FROM BACKEND ===
  useEffect(() => {
    if (!country) return;

    const fetchData = async () => {
      try {
        const res = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!res.ok) throw new Error(t('economic.errors.fetchFailed'));

        const json: Dataset = await res.json();
        const filtered = json.Simulated_Livestock_Data.filter(
          (d) => d.country?.toLowerCase() === country.toLowerCase()
        );

        if (filtered.length === 0) {
          throw new Error(t('economic.errors.noData', { country }));
        }

        const years = filtered.map(d => d.year).sort((a, b) => b - a);
        setSelectedYear(years[0]);
        setData(filtered);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('economic.errors.loadingError'));
        setLoading(false);
      }
    };

    fetchData();
  }, [country, t]);

  const current = useMemo(() => data.find(d => d.year === selectedYear) ?? data[0] ?? null, [data, selectedYear]);
  const years = useMemo(() => Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a), [data]);
  const chartData = useMemo(() => data.map(d => ({
    year: d.year,
    priceIndex: d.livestock_price_index_2006_base,
    exports: d.livestock_exports_tons,
    offtake: d.offtake_rate_pct,
    feedImports: d.feed_imports_tons,
    localFeed: d.local_feed_production_tons,
  })), [data]);

  const formatNum = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
      <p className="text-[var(--dark-green)] text-lg">{t('economic.loading')}</p>
    </div>
  );

  if (error || !current) return (
    <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
      <p className="text-[var(--wine)] text-lg">{error || t('economic.errors.noData', { country })}</p>
    </div>
  );

  // === CSV DOWNLOAD ===
  const handleCSVDownload = () => {
    const csv = stringify(data.map(d => ({
      [t('economic.country')]: d.country,
      [t('economic.year')]: d.year,
      [t('economic.priceIndex')]: d.livestock_price_index_2006_base,
      [t('economic.exports')]: d.livestock_exports_tons,
      [t('economic.offtake')]: d.offtake_rate_pct,
      [t('economic.feedImports')]: d.feed_imports_tons,
      [t('economic.localFeed')]: d.local_feed_production_tons,
    })), { header: true });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_economic_${selectedYear}.csv`;
    link.click();
  };

  // === PNG & PDF (FULL PAGE – 100% WORKING) ===
  const capture = async (type: 'png' | 'pdf') => {
    if (!dashboardRef.current) return alert(t(`economic.errors.${type}Failed`));

    try {
      await new Promise(r => setTimeout(r, 600)); // Wait for Recharts

      const el = dashboardRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
        foreignObjectRendering: true,
        width: el.scrollWidth,
        height: el.scrollHeight,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/png');
      if (!imgData || imgData === 'data:,') throw new Error('Invalid image');

      if (type === 'png') {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${country}_economic_${selectedYear}.png`;
        link.click();
      } else {
        const pdf = new jsPDF('landscape');
        const imgWidth = 270;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.setFontSize(16);
        pdf.text(t('economic.title', { countryName: country.toUpperCase() }), 15, 15);
        pdf.setFontSize(10);
        pdf.text(t('economic.report_exported', { date: new Date().toLocaleDateString() }), 15, 22);
        pdf.addImage(imgData, 'PNG', 15, 30, imgWidth, imgHeight);
        pdf.save(`${country}_economic_${selectedYear}.pdf`);
      }
    } catch (err) {
      console.error(`${type} error:`, err);
      alert(t(`economic.errors.${type}Failed`));
    }
  };

  const handlePNGDownload = () => capture('png');
  const handlePDFDownload = () => capture('pdf');

  return (
    <div className="min-h-screen bg-[var(--white)] font-sans">
      <div ref={dashboardRef} className="w-full">

        {/* Header */}
        <header className="bg-[var(--medium-green)] text-white p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-2">
            <FaDollarSign className="text-2xl sm:text-3xl text-[var(--yellow)]" />
            <h1 className="text-xl sm:text-2xl font-bold">
              {t('economic.title', { countryName: country.charAt(0).toUpperCase() + country.slice(1) })}
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="p-2 rounded bg-white text-[var(--dark-green)] text-sm sm:text-base cursor-pointer"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleCSVDownload} className="flex items-center gap-2 bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 cursor-pointer">
              <FaDownload /> {t('economic.downloadCSV')}
            </button>
            <button onClick={handlePNGDownload} className="flex items-center gap-2 bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 cursor-pointer">
              <FaDownload /> {t('economic.downloadPNG')}
            </button>
            <button onClick={handlePDFDownload} className="flex items-center gap-2 bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90 cursor-pointer">
              <FaDownload /> {t('economic.downloadPDF')}
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 sm:p-6">
          <p className="text-[var(--olive-green)] mb-6 italic">{t('economic.simulatedDataNote')}</p>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-600">{t('economic.priceIndex')}</h3>
                <FaChartLine className="text-2xl text-[var(--olive-green)]" />
              </div>
              <p className="text-3xl font-bold text-[var(--dark-green)]">{current.livestock_price_index_2006_base}</p>
              <p className="text-xs text-gray-500">2006=100</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-600">{t('economic.exports')}</h3>
                <FaTruck className="text-2xl text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(current.livestock_exports_tons)}</p>
              <p className="text-xs text-gray-500">{t('economic.tons')}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-600">{t('economic.offtake')}</h3>
                <FaPercentage className="text-2xl text-red-600" />
              </div>
              <p className="text-3xl font-bold text-[var(--dark-green)]">{current.offtake_rate_pct}%</p>
              <p className="text-xs text-gray-500">{t('economic.pct')}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-600">{t('economic.feedImports')}</h3>
                <FaTruck className="text-2xl text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(current.feed_imports_tons)}</p>
              <p className="text-xs text-gray-500">{t('economic.tons')}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-600">{t('economic.localFeed')}</h3>
                <FaLeaf className="text-2xl text-[var(--green)]" />
              </div>
              <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(current.local_feed_production_tons)}</p>
              <p className="text-xs text-gray-500">{t('economic.tons')}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow mb-8">
            <h2 className="text-lg font-semibold text-[var(--dark-green)] mb-4">{t('economic.trendTitle')}</h2>
            <div style={{ width: '100%', height: 420 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={formatNum} />
                  <Tooltip formatter={(v: number) => formatNum(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="priceIndex" stroke="#1d4ed8" strokeWidth={2} name={t('economic.priceIndex')} />
                  <Line type="monotone" dataKey="exports" stroke="#dc2626" strokeWidth={2} name={t('economic.exports')} />
                  <Line type="monotone" dataKey="offtake" stroke="#f59e0b" strokeWidth={2} name={t('economic.offtake')} />
                  <Line type="monotone" dataKey="feedImports" stroke="#7c3aed" strokeWidth={2} name={t('economic.feedImports')} />
                  <Line type="monotone" dataKey="localFeed" stroke="#16a34a" strokeWidth={2} name={t('economic.localFeed')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-12 text-center text-sm text-gray-500">
            <p>{t('economic.simulatedDataNote')} • {t('economic.lastUpdated', { date: format(new Date(), 'MMMM d, yyyy') })}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
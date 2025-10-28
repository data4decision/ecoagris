'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { FaHorse, FaLeaf, FaDrumstickBite, FaChartLine, FaDownload } from 'react-icons/fa';
import { format } from 'date-fns';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '@/styles/pdf-styles.css';

interface LivestockData {
  country: string;
  year: number;
  cattle_head: number;
  small_ruminants_head: number;
  pigs_head: number;
  poultry_head: number;
}

interface Dataset {
  Simulated_Livestock_Data: LivestockData[];
}

export default function Population() {
  const { t } = useTranslation('common');
  const { country } = useParams<{ country: string }>();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<LivestockData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === FETCH DATA ===
  useEffect(() => {
    if (!country) return;

    const fetchData = async () => {
      try {
        const res = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!res.ok) throw new Error(t('population.errors.fetchFailed'));

        const json: Dataset = await res.json();
        const filtered = json.Simulated_Livestock_Data.filter(
          (d) => d.country?.toLowerCase() === country.toLowerCase()
        );

        if (filtered.length === 0) throw new Error(t('population.errors.noData', { country }));

        const years = filtered.map(d => d.year).sort((a, b) => b - a);
        setSelectedYear(years[0]);
        setData(filtered);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('population.errors.loadingError'));
        setLoading(false);
      }
    };

    fetchData();
  }, [country, t]);

  const current = useMemo(() => data.find(d => d.year === selectedYear) ?? data[0] ?? null, [data, selectedYear]);
  const years = useMemo(() => Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a), [data]);
  const chartData = useMemo(() => data.map(d => ({
    year: d.year,
    cattle: d.cattle_head,
    smallRuminants: d.small_ruminants_head,
    pigs: d.pigs_head,
    poultry: d.poultry_head,
    total: d.cattle_head + d.small_ruminants_head + d.pigs_head + d.poultry_head,
  })), [data]);

  const formatNum = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  if (loading) return <div className="min-h-screen bg-[var(--white)] flex justify-center items-center"><p className="text-[var(--dark-green)] text-lg">{t('population.loading')}</p></div>;
  if (error || !current) return <div className="min-h-screen bg-[var(--white)] flex justify-center items-center"><p className="text-[var(--wine)] text-lg">{error || t('population.errors.noData', { country })}</p></div>;

  const totalPopulation = current.cattle_head + current.small_ruminants_head + current.pigs_head + current.poultry_head;

  // === CSV ===
  const handleCSVDownload = () => {
    const csv = stringify(data.map(d => ({
      [t('population.country')]: d.country,
      [t('population.year')]: d.year,
      [t('population.cattle')]: d.cattle_head,
      [t('population.smallRuminants')]: d.small_ruminants_head,
      [t('population.pigs')]: d.pigs_head,
      [t('population.poultry')]: d.poultry_head,
      [t('population.total')]: d.cattle_head + d.small_ruminants_head + d.pigs_head + d.poultry_head,
    })), { header: true });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_population_${selectedYear}.csv`;
    link.click();
  };

  // === PNG DOWNLOAD – FULL PAGE (WORKING LOGIC) ===
  const handlePNGDownload = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found for PNG generation');
      alert(t('population.errors.pngFailed'));
      return;
    }

    try {
      // Wait for full render (Recharts needs time)
      await new Promise(resolve => setTimeout(resolve, 600));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
        foreignObjectRendering: true,
        width: dashboardRef.current.scrollWidth,
        height: dashboardRef.current.scrollHeight,
        windowWidth: dashboardRef.current.scrollWidth,
        windowHeight: dashboardRef.current.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/png');
      if (!imgData || imgData === 'data:,') throw new Error('Invalid image data');

      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${country}_population_${selectedYear}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('PNG downloaded successfully');
    } catch (err) {
      console.error('PNG generation error:', err);
      alert(t('population.errors.pngFailed'));
    }
  };

  // === PDF DOWNLOAD – FULL PAGE (WORKING LOGIC) ===
  const handlePDFDownload = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found for PDF generation');
      alert(t('population.errors.pdfFailed'));
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 600));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
        foreignObjectRendering: true,
        width: dashboardRef.current.scrollWidth,
        height: dashboardRef.current.scrollHeight,
        windowWidth: dashboardRef.current.scrollWidth,
        windowHeight: dashboardRef.current.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/png');
      if (!imgData || imgData === 'data:,') throw new Error('Invalid image data');

      const pdf = new jsPDF('landscape');
      const imgWidth = 270;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.setFontSize(16);
      pdf.text(t('population.title', { countryName: country.toUpperCase() }), 15, 15);
      pdf.setFontSize(10);
      pdf.text(t('population.report_exported', { date: new Date().toLocaleDateString() }), 15, 22);
      pdf.addImage(imgData, 'PNG', 15, 30, imgWidth, imgHeight);

      pdf.save(`${country}_population_${selectedYear}.pdf`);
      console.log('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(t('population.errors.pdfFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--white)] font-sans">
      <div ref={dashboardRef} className="w-full">

        {/* Header */}
        <header className="bg-[var(--medium-green)] text-white p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-2">
            <FaLeaf className="text-2xl sm:text-3xl text-[var(--yellow)]" />
            <h1 className="text-xl sm:text-2xl font-bold">
              {t('population.title', { countryName: country.charAt(0).toUpperCase() + country.slice(1) })}
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="p-2 rounded bg-white text-[var(--dark-green)] text-sm sm:text-base"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleCSVDownload} className="flex items-center gap-2 bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90">
              <FaDownload /> {t('population.downloadCSV')}
            </button>
            <button onClick={handlePNGDownload} className="flex items-center gap-2 bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90">
              <FaDownload /> {t('population.downloadPNG')}
            </button>
            <button onClick={handlePDFDownload} className="flex items-center gap-2 bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90">
              <FaDownload /> {t('population.downloadPDF')}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto p-4 sm:p-6">
          <p className="text-[var(--olive-green)] mb-6 italic">{t('population.simulatedDataNote')}</p>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-600">{t('population.total')}</h3>
                <FaChartLine className="text-2xl text-[var(--olive-green)]" />
              </div>
              <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(totalPopulation)}</p>
              <p className="text-xs text-gray-500">{t('population.heads')}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-600">{t('population.cattle')}</h3>
                <FaHorse className="text-2xl text-[var(--green)]" />
              </div>
              <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(current.cattle_head)}</p>
              <p className="text-xs text-gray-500">{t('population.heads')}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-600">{t('population.smallRuminants')}</h3>
                <FaLeaf className="text-2xl text-[var(--olive-green)]" />
              </div>
              <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(current.small_ruminants_head)}</p>
              <p className="text-xs text-gray-500">{t('population.heads')}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-600">{t('population.pigs')}</h3>
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 text-sm font-bold">P</div>
              </div>
              <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(current.pigs_head)}</p>
              <p className="text-xs text-gray-500">{t('population.heads')}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-600">{t('population.poultry')}</h3>
                <FaDrumstickBite className="text-2xl text-[var(--yellow)]" />
              </div>
              <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(current.poultry_head)}</p>
              <p className="text-xs text-gray-500">{t('population.heads')}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow mb-8">
            <h2 className="text-lg font-semibold text-[var(--dark-green)] mb-4">{t('population.trendTitle')}</h2>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={formatNum} />
                  <Tooltip formatter={(v: number) => formatNum(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="cattle" stroke="#2d6a4f" strokeWidth={2} name={t('population.cattle')} />
                  <Line type="monotone" dataKey="smallRuminants" stroke="#40916c" strokeWidth={2} name={t('population.smallRuminants')} />
                  <Line type="monotone" dataKey="pigs" stroke="#74c69d" strokeWidth={2} name={t('population.pigs')} />
                  <Line type="monotone" dataKey="poultry" stroke="#95d5b2" strokeWidth={2} name={t('population.poultry')} />
                  <Line type="monotone" dataKey="total" stroke="#1b4332" strokeWidth={3} name={t('population.total')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-gray-500">
            <p>{t('population.simulatedDataNote')} • {t('population.lastUpdated', { date: format(new Date(), 'MMMM d, yyyy') })}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
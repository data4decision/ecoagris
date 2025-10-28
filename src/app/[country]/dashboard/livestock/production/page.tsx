'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { FaCheese, FaDrumstickBite, FaChartLine, FaDownload } from 'react-icons/fa';
import { format } from 'date-fns';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '@/styles/pdf-styles.css';

interface PopulationData {
  country: string;
  year: number;
  cattle_head: number;
  small_ruminants_head: number;
  pigs_head: number;
  poultry_head: number;
}

interface ProductionData {
  country: string;
  year: number;
  milk_production_tons: number;
  meat_production_tons: number;
}

interface Dataset {
  Simulated_Livestock_Data: PopulationData[];
}

export default function Production() {
  const { t } = useTranslation('common');
  const { country } = useParams<{ country: string }>();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<ProductionData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === FETCH & GENERATE PRODUCTION DATA ===
  useEffect(() => {
    if (!country) return;

    const fetchAndGenerate = async () => {
      try {
        const res = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!res.ok) throw new Error(t('production.errors.fetchFailed'));

        const json: Dataset = await res.json();
        const population = json.Simulated_Livestock_Data?.filter(
          (d) => d.country?.toLowerCase() === country.toLowerCase()
        ) || [];

        if (population.length === 0) throw new Error(t('production.errors.noData', { country }));

        // === GENERATE PRODUCTION FROM POPULATION ===
        const generated: ProductionData[] = population.map(d => {
          const milk = 
            d.cattle_head * 0.8 +           // 0.8 tons per cattle
            d.small_ruminants_head * 0.05;  // 0.05 tons per small ruminant

          const meat =
            d.cattle_head * 0.2 +           // 0.2 tons per cattle
            d.small_ruminants_head * 0.03 + // 0.03 tons per small ruminant
            d.pigs_head * 0.15 +            // 0.15 tons per pig
            d.poultry_head * 0.002;         // 0.002 tons per bird

          return {
            country: d.country,
            year: d.year,
            milk_production_tons: Math.round(milk),
            meat_production_tons: Math.round(meat),
          };
        });

        const years = generated.map(d => d.year).sort((a, b) => b - a);
        setSelectedYear(years[0]);
        setData(generated);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('production.errors.loadingError'));
        setLoading(false);
      }
    };

    fetchAndGenerate();
  }, [country, t]);

  const current = useMemo(() => data.find(d => d.year === selectedYear) ?? data[0] ?? null, [data, selectedYear]);
  const years = useMemo(() => Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a), [data]);
  const chartData = useMemo(() => data.map(d => ({
    year: d.year,
    milk: d.milk_production_tons,
    meat: d.meat_production_tons,
    total: d.milk_production_tons + d.meat_production_tons,
  })), [data]);

  const formatNum = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  if (loading) return <div className="min-h-screen bg-[var(--white)] flex justify-center items-center"><p className="text-[var(--dark-green)] text-lg">{t('production.loading')}</p></div>;
  if (error || !current) return <div className="min-h-screen bg-[var(--white)] flex justify-center items-center"><p className="text-[var(--wine)] text-lg">{error || t('production.errors.noData', { country })}</p></div>;

  const totalProduction = current.milk_production_tons + current.meat_production_tons;

  // === CSV ===
  const handleCSVDownload = () => {
    const csv = stringify(data.map(d => ({
      [t('production.country')]: d.country,
      [t('production.year')]: d.year,
      [t('production.milk')]: d.milk_production_tons,
      [t('production.meat')]: d.meat_production_tons,
      [t('production.total')]: d.milk_production_tons + d.meat_production_tons,
    })), { header: true });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_production_${selectedYear}.csv`;
    link.click();
  };

  // === PNG & PDF (Full Page) ===
  const capture = async (type: 'png' | 'pdf') => {
    if (!dashboardRef.current) return alert(t(`production.errors.${type}Failed`));

    try {
      await new Promise(r => setTimeout(r, 600));

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
      if (!imgData || imgData === 'data:,') throw new Error('Invalid image');

      if (type === 'png') {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${country}_production_${selectedYear}.png`;
        link.click();
      } else {
        const pdf = new jsPDF('landscape');
        const imgWidth = 270;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.setFontSize(16);
        pdf.text(t('production.title', { countryName: country.toUpperCase() }), 15, 15);
        pdf.setFontSize(10);
        pdf.text(t('production.report_exported', { date: new Date().toLocaleDateString() }), 15, 22);
        pdf.addImage(imgData, 'PNG', 15, 30, imgWidth, imgHeight);
        pdf.save(`${country}_production_${selectedYear}.pdf`);
      }
    } catch (err) {
      console.error(`${type} error:`, err);
      alert(t(`production.errors.${type}Failed`));
    }
  };

  const handlePNGDownload = () => capture('png');
  const handlePDFDownload = () => capture('pdf');

  return (
    <div className="min-h-screen bg-[var(--white)] font-sans">
      <div ref={dashboardRef} className="w-full">

        <header className="bg-[var(--medium-green)] text-white p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-2">
            <FaCheese className="text-2xl sm:text-3xl text-[var(--yellow)]" />
            <h1 className="text-xl sm:text-2xl font-bold">
              {t('production.title', { countryName: country.charAt(0).toUpperCase() + country.slice(1) })}
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              className="p-2 rounded bg-white text-[var(--dark-green)] text-sm sm:text-base">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleCSVDownload} className="flex items-center gap-2 bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90">
              <FaDownload /> {t('production.downloadCSV')}
            </button>
            <button onClick={handlePNGDownload} className="flex items-center gap-2 bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90">
              <FaDownload /> {t('production.downloadPNG')}
            </button>
            <button onClick={handlePDFDownload} className="flex items-center gap-2 bg-[var(--yellow)] text-[var(--dark-green)] px-4 py-2 rounded hover:bg-[var(--yellow)]/90">
              <FaDownload /> {t('production.downloadPDF')}
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 sm:p-6">
          <p className="text-[var(--olive-green)] mb-6 italic">{t('production.simulatedDataNote')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-600">{t('production.total')}</h3>
                <FaChartLine className="text-2xl text-[var(--olive-green)]" />
              </div>
              <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(totalProduction)}</p>
              <p className="text-xs text-gray-500">{t('production.tons')}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-600">{t('production.milk')}</h3>
                <FaCheese className="text-2xl text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(current.milk_production_tons)}</p>
              <p className="text-xs text-gray-500">{t('production.tons')}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-gray-600">{t('production.meat')}</h3>
                <FaDrumstickBite className="text-2xl text-red-600" />
              </div>
              <p className="text-3xl font-bold text-[var(--dark-green)]">{formatNum(current.meat_production_tons)}</p>
              <p className="text-xs text-gray-500">{t('production.tons')}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow mb-8">
            <h2 className="text-lg font-semibold text-[var(--dark-green)] mb-4">{t('production.trendTitle')}</h2>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={formatNum} />
                  <Tooltip formatter={(v: number) => formatNum(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="milk" stroke="#2563eb" strokeWidth={2} name={t('production.milk')} />
                  <Line type="monotone" dataKey="meat" stroke="#dc2626" strokeWidth={2} name={t('production.meat')} />
                  <Line type="monotone" dataKey="total" stroke="#166534" strokeWidth={3} name={t('production.total')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-12 text-center text-sm text-gray-500">
            <p>{t('production.simulatedDataNote')} • {t('production.lastUpdated', { date: format(new Date(), 'MMMM d, yyyy') })}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
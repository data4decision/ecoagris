'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  FaChartBar,
  FaHeartbeat,
  FaUtensils,
  FaCapsules,
  FaChild,
  FaHandsHelping,
  FaMoneyBillWave,
  FaShieldAlt,
  FaDatabase,
  FaUsers,
  FaCalendarAlt,
  FaDownload
} from 'react-icons/fa';
import { format } from 'date-fns';
import { stringify } from 'csv-stringify/sync';
import { useTranslation } from 'react-i18next';

interface NutritionData {
  country: string;
  year: number;
  population: number;
  [key: string]: unknown;
}

interface Dataset {
  Nutrition_Data: NutritionData[];
}

export default function NutritionOverview() {
  const { t } = useTranslation('common');
  const { country } = useParams<{ country: string }>();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<NutritionData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    if (!country) return;

    const fetchData = async () => {
      try {
        const res = await fetch('/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json');
        if (!res.ok) throw new Error(t('nutritionOverview.errors.fetchFailed'));

        const json: Dataset = await res.json();
        const filtered = json.Nutrition_Data.filter(
          d => d.country?.toLowerCase() === country.toLowerCase()
        );

        if (filtered.length === 0) {
          throw new Error(t('nutritionOverview.errors.noData', { country }));
        }

        const years = filtered.map(d => d.year).sort((a, b) => b - a);
        setSelectedYear(years[0]);
        setData(filtered);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('nutritionOverview.errors.loadingError'));
        setLoading(false);
      }
    };

    fetchData();
  }, [country, t]);

  const current = useMemo(() => {
    return data.find(d => d.year === selectedYear) ?? data[0] ?? null;
  }, [data, selectedYear]);

  const years = useMemo(() => {
    return Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a);
  }, [data]);

  const formatNum = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  // CSV Download
  const handleCSVDownload = () => {
    const csvData = data.map(d => ({
      [t('nutritionOverview.country')]: d.country,
      [t('nutritionOverview.year')]: d.year,
      [t('nutritionOverview.population')]: d.population,
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${country}_nutrition_overview_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg font-medium text-[var(--dark-green)]">
          {t('nutritionOverview.loading')}
        </p>
      </div>
    );
  }

  if (error || !current) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-lg font-medium text-red-600 text-center">
          {error || t('nutritionOverview.errors.noData', { country })}
        </p>
      </div>
    );
  }

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[var(--medium-green)] text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <FaChartBar className="text-3xl text-[var(--yellow)]" />
            <h1 className="text-2xl font-bold">
              {t('nutritionOverview.title', { countryName })}
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
                aria-label={t('nutritionOverview.yearSelectLabel')}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* CSV Download Only */}
            <button
              onClick={handleCSVDownload}
              className="flex items-center gap-1.5 bg-[var(--yellow)] text-[var(--dark-green)] px-3 py-1.5 rounded text-sm font-medium hover:bg-[var(--yellow)]/90 transition"
              title={t('nutritionOverview.downloadCSV')}
            >
              <FaDownload /> {t('nutritionOverview.downloadCSV')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main ref={dashboardRef} className="max-w-7xl mx-auto px-4 py-8 bg-white">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {/* Population */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-600">{t('nutritionOverview.population')}</h3>
              <FaUsers className="text-2xl text-[var(--olive-green)]" />
            </div>
            <p className="text-3xl font-bold text-[var(--dark-green)]">
              {formatNum(current.population)}
            </p>
            <p className="text-xs text-gray-500">{t('nutritionOverview.people')}</p>
          </div>

          {/* Country */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-600">{t('nutritionOverview.country')}</h3>
              <div className="w-8 h-8 bg-[var(--light-green)] rounded-full flex items-center justify-center text-[var(--dark-green)] text-sm font-bold">
                C
              </div>
            </div>
            <p className="text-3xl font-bold text-[var(--dark-green)]">{current.country}</p>
            <p className="text-xs text-gray-500">{t('nutritionOverview.current')}: {selectedYear}</p>
          </div>

          {/* Year */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-600">{t('nutritionOverview.year')}</h3>
              <FaCalendarAlt className="text-2xl text-[var(--yellow)]" />
            </div>
            <p className="text-3xl font-bold text-[var(--dark-green)]">{selectedYear}</p>
            <p className="text-xs text-gray-500">{t('nutritionOverview.selected')}</p>
          </div>

          {/* Placeholder for future metric */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-600">{t('nutritionOverview.comingSoon')}</h3>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-sm font-bold">
                ?
              </div>
            </div>
            <p className="text-3xl font-bold text-[var(--dark-green)]">—</p>
            <p className="text-xs text-gray-500">{t('nutritionOverview.moreSoon')}</p>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-[var(--dark-green)] mb-6">
            {t('nutritionOverview.exploreCategories')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FaHeartbeat, title: t('nutritionOverview.malnutrition'), path: 'malnutrition' },
              { icon: FaUtensils, title: t('nutritionOverview.dietary'), path: 'dietary-nutrient-intake' },
              { icon: FaCapsules, title: t('nutritionOverview.micronutrient'), path: 'micronutrient-deficiencies' },
              { icon: FaChild, title: t('nutritionOverview.healthOutcomes'), path: 'health-outcomes' },
              { icon: FaHandsHelping, title: t('nutritionOverview.interventions'), path: 'interventions' },
              { icon: FaMoneyBillWave, title: t('nutritionOverview.policyFunding'), path: 'policy-funding' },
              { icon: FaShieldAlt, title: t('nutritionOverview.coverage'), path: 'program-coverage-surveillance' },
              { icon: FaDatabase, title: t('nutritionOverview.dataMethodology'), path: 'data-quality-and-methodology' },
            ].map((item) => (
              <a
                key={item.path}
                href={`/${country}/dashboard/nutrition/${item.path}`}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow hover:shadow-xl transition-all hover:scale-105 cursor-pointer flex items-center gap-4"
              >
                <item.icon className="text-2xl text-[var(--dark-green)]" />
                <div>
                  <h3 className="font-semibold text-[var(--dark-green)]">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{t('nutritionOverview.viewDetails')}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            {t('nutritionOverview.simulatedDataNote')} • {t('nutritionOverview.lastUpdated', { date: format(new Date(), 'MMMM d, yyyy') })}
          </p>
        </div>
      </main>
    </div>
  );
}
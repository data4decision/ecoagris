'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FaChartLine, FaDownload, FaInfoCircle } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import '@/styles/dashboard-styles.css';

// ---------------------------------------------------------------------
// 1. Types (Matches Real JSON Structure)
// ---------------------------------------------------------------------
interface ForecastData {
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
  [key: string]: unknown;
}

// CORRECT KEY IN JSON FILE
interface Dataset {
  Simulated_Livestock_Data: ForecastData[];
}

type ForecastMetric = keyof Pick<
  ForecastData,
  | 'cattle_head'
  | 'small_ruminants_head'
  | 'pigs_head'
  | 'poultry_head'
  | 'milk_production_tons'
  | 'meat_production_tons'
  | 'livestock_price_index_2006_base'
  | 'vaccination_coverage_pct'
  | 'fmd_incidents_count'
  | 'grazing_area_ha'
  | 'transhumance_events'
  | 'veterinary_facilities_count'
  | 'feed_imports_tons'
  | 'local_feed_production_tons'
  | 'livestock_exports_tons'
  | 'offtake_rate_pct'
>;

// ---------------------------------------------------------------------
// 2. Forecast Engine (Simple Linear + Seasonal)
// ---------------------------------------------------------------------
function generateForecast(
  historical: ForecastData[],
  metric: ForecastMetric,
  forecastYears: number = 5
): Array<{ year: number; value: number; type: 'historical' | 'forecast' }> {
  if (historical.length < 2) return [];

  const values = historical.map((d) => ({
    year: d.year,
    value: Number(d[metric]) || 0,
  }));

  const n = values.length;
  const sumX = values.reduce((a, b) => a + b.year, 0);
  const sumY = values.reduce((a, b) => a + b.value, 0);
  const sumXY = values.reduce((a, b) => a + b.year * b.value, 0);
  const sumX2 = values.reduce((a, b) => a + b.year * b.year, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const lastYear = Math.max(...values.map((v) => v.year));
  const forecast = [];

  for (let i = 1; i <= forecastYears; i++) {
    const year = lastYear + i;
    const base = slope * year + intercept;
    const seasonal = 0.05 * base * Math.sin((2 * Math.PI * (year % 10)) / 10);
    forecast.push({ year, value: Math.max(0, base + seasonal), type: 'forecast' as const });
  }

  return [
    ...values.map((v) => ({ ...v, type: 'historical' as const })),
    ...forecast,
  ];
}

// ---------------------------------------------------------------------
// 3. Main Component
// ---------------------------------------------------------------------
export default function ForecastDashboard() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [historicalData, setHistoricalData] = useState<ForecastData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<ForecastMetric>('cattle_head');
  const [forecastYears, setForecastYears] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------------------
  // 4. Metric Metadata
  // -----------------------------------------------------------------
  const forecastFields = [
    { key: 'cattle_head', label: t('forecast.cattle'), format: (v: number) => v.toLocaleString() },
    { key: 'small_ruminants_head', label: t('forecast.smallRuminants'), format: (v: number) => v.toLocaleString() },
    { key: 'pigs_head', label: t('forecast.pigs'), format: (v: number) => v.toLocaleString() },
    { key: 'poultry_head', label: t('forecast.poultry'), format: (v: number) => v.toLocaleString() },
    { key: 'milk_production_tons', label: t('forecast.milk'), format: (v: number) => `${v.toLocaleString()} t` },
    { key: 'meat_production_tons', label: t('forecast.meat'), format: (v: number) => `${v.toLocaleString()} t` },
    { key: 'livestock_price_index_2006_base', label: t('forecast.priceIndex'), format: (v: number) => v.toFixed(2) },
    { key: 'vaccination_coverage_pct', label: t('forecast.vaccination'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'fmd_incidents_count', label: t('forecast.fmd'), format: (v: number) => v.toLocaleString() },
    { key: 'grazing_area_ha', label: t('forecast.grazingArea'), format: (v: number) => `${v.toLocaleString()} ha` },
    { key: 'transhumance_events', label: t('forecast.transhumance'), format: (v: number) => v.toLocaleString() },
    { key: 'veterinary_facilities_count', label: t('forecast.vetFacilities'), format: (v: number) => v.toLocaleString() },
    { key: 'feed_imports_tons', label: t('forecast.feedImports'), format: (v: number) => `${v.toLocaleString()} t` },
    { key: 'local_feed_production_tons', label: t('forecast.localFeed'), format: (v: number) => `${v.toLocaleString()} t` },
    { key: 'livestock_exports_tons', label: t('forecast.exports'), format: (v: number) => `${v.toLocaleString()} t` },
    { key: 'offtake_rate_pct', label: t('forecast.offtake'), format: (v: number) => `${v.toFixed(1)}%` },
  ];

  
  // -----------------------------------------------------------------
// 5. Fetch Data (CORRECT PATH + KEY + NO TYPO)
// -----------------------------------------------------------------
useEffect(() => {
  if (!country) return;

  async function fetchData() {
    try {
      // CORRECT FILE PATH
      const res = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
      if (!res.ok) {
        console.error('Fetch failed:', res.status, res.statusText);
        throw new Error(t('forecast.errors.fetchFailed'));
      }

      const json = (await res.json()) as Dataset;

      // CORRECT KEY
      const rawData = json.Simulated_Livestock_Data;

      if (!Array.isArray(rawData)) {
        throw new Error('Invalid JSON: Simulated_Livestock_Data missing or not an array');
      }

      console.log('Forecast data loaded:', rawData); 

      const filtered = rawData
        .filter((d) => d.country?.toLowerCase() === country.toLowerCase())
        .map((d) => ({
          country: d.country,
          year: d.year,
          cattle_head: Number(d.cattle_head) || 0,
          small_ruminants_head: Number(d.small_ruminants_head) || 0,
          pigs_head: Number(d.pigs_head) || 0,
          poultry_head: Number(d.poultry_head) || 0,
          milk_production_tons: Number(d.milk_production_tons) || 0,  
          meat_production_tons: Number(d.meat_production_tons) || 0,
          livestock_price_index_2006_base: Number(d.livestock_price_index_2006_base) || 0,
          vaccination_coverage_pct: Number(d.vaccination_coverage_pct) || 0,
          fmd_incidents_count: Number(d.fmd_incidents_count) || 0,
          grazing_area_ha: Number(d.grazing_area_ha) || 0,
          transhumance_events: Number(d.transhumance_events) || 0,
          veterinary_facilities_count: Number(d.veterinary_facilities_count) || 0,
          feed_imports_tons: Number(d.feed_imports_tons) || 0,
          local_feed_production_tons: Number(d.local_feed_production_tons) || 0,
          livestock_exports_tons: Number(d.livestock_exports_tons) || 0,
          offtake_rate_pct: Number(d.offtake_rate_pct) || 0,
        }));

      if (filtered.length === 0) {
        throw new Error(t('forecast.errors.noData', { country }));
      }

      setHistoricalData(filtered);
      setLoading(false);
    } catch (err) {
      console.error('Forecast load error:', err);
      setError(err instanceof Error ? err.message : t('forecast.errors.fetchFailed'));
      setLoading(false);
    }
  }

  fetchData();
}, [country, t]);

  // -----------------------------------------------------------------
  // 6. Forecast Data
  // -----------------------------------------------------------------
  const chartData = useMemo(() => {
    return generateForecast(historicalData, selectedMetric, forecastYears);
  }, [historicalData, selectedMetric, forecastYears]);

  const latestValue = historicalData[historicalData.length - 1]?.[selectedMetric] ?? 0;
  const forecastEnd = chartData[chartData.length - 1]?.value ?? 0;
  const growthPct = latestValue > 0 ? ((forecastEnd - latestValue) / latestValue) * 100 : 0;

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  // -----------------------------------------------------------------
  // 7. CSV Download
  // -----------------------------------------------------------------
  const handleCSVDownload = () => {
    const csvData = chartData.map((d) => ({
      Year: d.year,
      Value: forecastFields.find(f => f.key === selectedMetric)?.format(d.value) || d.value,
      Type: t(`forecast.${d.type}`),
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_forecast_${selectedMetric}.csv`;
    link.click();
  };

  // -----------------------------------------------------------------
  // 8. PNG / PDF Export
  // -----------------------------------------------------------------
  const exportImage = async (type: 'png' | 'pdf') => {
    if (!dashboardRef.current) return;

    try {
      await new Promise(r => setTimeout(r, 1000));
      dashboardRef.current.classList.add('snapshot');
      await new Promise(r => setTimeout(r, 500));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      dashboardRef.current.classList.remove('snapshot');

      const imgData = canvas.toDataURL('image/png');
      if (type === 'png') {
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `${country}_forecast_dashboard.png`;
        link.click();
      } else {
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.setFontSize(12);
        pdf.text(t('forecast.title', { countryName: country.toUpperCase() }), 10, 10);
        pdf.text(t('forecast.reportExported', { date: new Date().toLocaleDateString() }), 10, 18);
        pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
        pdf.save(`${country}_forecast_dashboard.pdf`);
      }
    } catch (err) {
      alert(t(`forecast.errors.${type}Failed`));
    }
  };

  // -----------------------------------------------------------------
  // 9. Early Returns
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] items-center justify-center p-6">
        <p className="text-[var(--dark-green)] text-lg">{t('forecast.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] items-center justify-center p-6">
        <p className="text-[var(--wine)] text-lg">{error}</p>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // 10. Render
  // -----------------------------------------------------------------
  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" ref={dashboardRef}>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2">
          <FaChartLine /> {t('forecast.title', { countryName })}
        </h1>
        <p className="text-[var(--olive-green)] mb-6 text-sm sm:text-base">
          {t('forecast.simulatedDataNote')}
        </p>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as ForecastMetric)}
            className="p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base"
          >
            {forecastFields.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>

          <input
            type="range"
            min="1"
            max="10"
            value={forecastYears}
            onChange={(e) => setForecastYears(Number(e.target.value))}
            className="w-full sm:w-48 bg-[var(--wine)] text-[var(--yellow)]"
          />
          <span className="text-sm text-[var(--dark-green)] self-center">
            {t('forecast.yearsAhead', { count: forecastYears })}
          </span>

          <div className="flex gap-2 ml-auto">
            <button onClick={handleCSVDownload} className="btn-download">
              <FaDownload /> {t('forecast.downloadCSV')}
            </button>
            <button onClick={() => exportImage('png')} className="btn-download">
              <FaDownload /> {t('forecast.downloadPNG')}
            </button>
            <button onClick={() => exportImage('pdf')} className="btn-download">
              <FaDownload /> {t('forecast.downloadPDF')}
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-[var(--yellow)] p-4 rounded shadow mb-6">
          <h3 className="font-semibold text-[var(--dark-green)]">
            {forecastFields.find(f => f.key === selectedMetric)?.label}
          </h3>
          <p className="text-2xl font-bold text-[var(--wine)]">
            {forecastFields.find(f => f.key === selectedMetric)?.format(latestValue)}
          </p>
          <p className="text-sm text-[var(--olive-green)]">
            {t('forecast.projected', {
              year: chartData[chartData.length - 1].year,
              value: forecastFields.find(f => f.key === selectedMetric)?.format(forecastEnd),
              growth: growthPct.toFixed(1),
            })}
          </p>
        </div>

        {/* Forecast Chart */}
        <div className="bg-[var(--white)] p-4 rounded shadow chart-section">
          <h2 className="text-lg font-semibold text-[var(--dark-green)] mb-4">
            {t('forecast.trendsTitle')}
          </h2>
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip
                formatter={(v: number) => forecastFields.find(f => f.key === selectedMetric)?.format(v) || v}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--olive-green)"
                strokeWidth={2}
                dot={{ fill: 'var(--olive-green)' }}
                name={t('forecast.historical')}
                data={chartData.filter(d => d.type === 'historical')}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--wine)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name={t('forecast.forecast')}
                data={chartData.filter(d => d.type === 'forecast')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-2 flex items-center gap-2">
  <FaChartLine /> {t('forecast.title', { countryName })}
</h1>

{/* NEW EXPLANATION */}
<div className="bg-[var(--light-yellow)] p-3 rounded-md mb-6 text-sm text-[var(--dark-green)] border border-[var(--medium-green)]">

  <p className="font-semibold mb-1 flex items-center gap-1">
  {t('forecast.howItWorksTitle')}
  <FaInfoCircle className="text-[var(--wine)] cursor-help" title={t('forecast.howItWorks.note')} />
</p>
  <ul className="list-disc list-inside space-y-1">
    <li>{t('forecast.howItWorks.1')}</li>
    <li>{t('forecast.howItWorks.2')}</li>
    <li>{t('forecast.howItWorks.3')}</li>
    <li>{t('forecast.howItWorks.4')}</li>
  </ul>
  <p className="mt-2 italic">{t('forecast.howItWorks.note')}</p>
</div>

<p className="text-[var(--olive-green)] mb-6 text-sm sm:text-base">
  {t('forecast.simulatedDataNote')}
</p>
      </div>
    </div>
  );
}
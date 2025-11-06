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
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts';
import { FaTractor, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import '@/styles/dashboard-styles.css';

interface InputData {
  country: string;
  year: number;
  cereal_seeds_tons: number;
  fertilizer_tons: number;
  pesticide_liters: number;
  input_subsidy_budget_usd: number;
  credit_access_pct: number;
  stockouts_days_per_year: number;
  fertilizer_kg_per_ha: number;
  improved_seed_use_pct: number;
  mechanization_units_per_1000_farms: number;
  [key: string]: unknown;
}

export default function AdoptionMechanizationPage() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<
    'improved_seed_use_pct' | 'fertilizer_kg_per_ha' | 'mechanization_units_per_1000_farms'
  >('improved_seed_use_pct');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const EXCEL_FILE_URL =
    'https://res.cloudinary.com/dmuvs05yp/raw/upload/v1738770665/APMD_ECOWAS_Input_Simulated_2006_2025.xlsx';

  // FIXED: Removed space in key
  const adoptionMechanizationFields = [
    { key: 'improved_seed_use_pct', label: t('adoptionMechanization.improvedSeed'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'fertilizer_kg_per_ha', label: t('adoptionMechanization.fertilizerIntensity'), format: (v: number) => `${v.toFixed(1)} kg/ha` },
    { key: 'mechanization_units_per_1000_farms', label: t('adoptionMechanization.mechanization'), format: (v: number) => `${v.toFixed(1)} units/1,000 farms` },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('adoptionMechanization.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchExcelData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(EXCEL_FILE_URL);
        if (!response.ok) throw new Error('Failed to download file');

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: InputData[] = XLSX.utils.sheet_to_json(worksheet);

        const filtered = jsonData.filter(
          (row) => row.country?.toString().toLowerCase() === country.toLowerCase()
        );

        if (filtered.length === 0) {
          setError(t('adoptionMechanization.errors.noData', { country }));
          setLoading(false);
          return;
        }

        const maxYear = Math.max(...filtered.map(d => d.year), 2025);
        setSelectedYear(maxYear);
        setCountryData(filtered);
        setLoading(false);
      } catch (err) {
        console.error('Excel fetch error:', err);
        setError(t('adoptionMechanization.errors.fetchFailed'));
        setLoading(false);
      }
    }

    fetchExcelData();
  }, [country, t]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map((d) => d.year))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find((d) => d.year === selectedYear);

  // Safe formatting with fallback
  const safeFormat = (value: unknown, formatter: (v: number) => string) => {
    if (typeof value === 'number' && !isNaN(value)) {
      return formatter(value);
    }
    return 'N/A';
  };

  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => {
      const row: { [key: string]: string | number } = { Year: data.year };
      adoptionMechanizationFields.forEach((field) => {
        row[field.label] = safeFormat(data[field.key], field.format);
      });
      row[t('adoptionMechanization.cerealSeeds')] = data.cereal_seeds_tons?.toLocaleString() || 'N/A';
      row[t('adoptionMechanization.fertilizer')] = data.fertilizer_tons?.toLocaleString() || 'N/A';
      row[t('adoptionMechanization.pesticides')] = data.pesticide_liters?.toLocaleString() || 'N/A';
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_adoption_mechanization_data.csv`;
    link.click();
  };

  const handlePNGDownload = async () => {
    if (!dashboardRef.current) return;
    try {
      await new Promise(r => setTimeout(r, 800));
      dashboardRef.current.classList.add('snapshot');
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
      dashboardRef.current.classList.remove('snapshot');
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${country}_dashboard.png`;
          a.click();
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePDFDownload = async () => {
    if (!dashboardRef.current) return;
    try {
      await new Promise(r => setTimeout(r, 800));
      dashboardRef.current.classList.add('snapshot');
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
      dashboardRef.current.classList.remove('snapshot');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const width = pdf.internal.pageSize.getWidth() - 20;
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 30, width, height);
      pdf.setFontSize(16);
      pdf.text(`${country.toUpperCase()} - Adoption & Mechanization Report`, 10, 15);
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 10, 22);
      pdf.save(`${country}_report.pdf`);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] p-8">
        <p className="text-[var(--dark-green)] text-lg">{t('adoptionMechanization.loading')}</p>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] p-8">
        <p className="text-[var(--wine)] text-lg">{error || t('adoptionMechanization.errors.noData', { country })}</p>
      </div>
    );
  }

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" ref={dashboardRef}>
        <h1 className="text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2">
          <FaTractor /> {t('adoptionMechanization.title', { countryName })}
        </h1>
        <p className="text-[var(--olive-green)] mb-6 text-sm">
          Source: APMD_ECOWAS_Input_Simulated_2006_2025.xlsx 
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={handleCSVDownload} className="bg-[var(--dark-green)] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[var(--olive-green)]">
            <FaDownload /> CSV
          </button>
          <button onClick={handlePNGDownload} className="bg-[var(--dark-green)] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[var(--olive-green)]">
            <FaDownload /> PNG
          </button>
          <button onClick={handlePDFDownload} className="bg-[var(--dark-green)] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[var(--olive-green)]">
            <FaDownload /> PDF
          </button>
        </div>

        <div className="mb-6">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 border rounded text-[var(--dark-green)]"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {adoptionMechanizationFields.map(field => (
            <div key={field.key} className="bg-[var(--yellow)] p-3 sm:p-4 rounded shadow min-w-0">
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{field.label} ({selectedYear})</h3>
              <p className="text-[var(--wine)] text-base sm:text-lg">
                {safeFormat(selectedData[field.key], field.format)}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-10">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-[var(--dark-green)]">Trends (2006–2025)</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="improved_seed_use_pct" stroke="var(--dark-green)" name="Improved Seed %" strokeWidth={2} />
                <Line type="monotone" dataKey="fertilizer_kg_per_ha" stroke="var(--red)" name="Fertilizer kg/ha" strokeWidth={2} />
                <Line type="monotone" dataKey="mechanization_units_per_1000_farms" stroke="var(--yellow)" name="Mechanization" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-[var(--dark-green)]">Yearly Comparison</h2>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as unknown)}
              className="mb-4 p-3 border rounded text-[var(--dark-green)]"
            >
              {adoptionMechanizationFields.map(f => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Bar dataKey={selectedMetric} fill="var(--olive-green)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
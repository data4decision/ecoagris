'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { FaDownload, FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { GiWheat } from 'react-icons/gi';
import { stringify } from 'csv-stringify/sync';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
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

interface Methodology {
  data_source?: string;
  simulation_method?: string;
  assumptions?: string[];
}

export default function DataAndMethodologyPage() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [methodology, setMethodology] = useState<Methodology | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDataSection, setShowDataSection] = useState(true);
  const [showMethodologySection, setShowMethodologySection] = useState(true);

  const EXCEL_FILE_URL =
    'https://res.cloudinary.com/dmuvs05yp/raw/upload/v1738770665/APMD_ECOWAS_Input_Simulated_2006_2025.xlsx';

  const columnMap: Record<string, string[]> = {
    cereal_seeds_tons: ['cereal_seeds_tons', 'Cereal Seeds (tons)'],
    fertilizer_tons: ['fertilizer_tons', 'Fertilizer (tons)'],
    pesticide_liters: ['pesticide_liters', 'Pesticide (liters)'],
    input_subsidy_budget_usd: ['input_subsidy_budget_usd', 'Input Subsidy Budget (USD)'],
    credit_access_pct: ['credit_access_pct', 'Credit Access (%)'],
    stockouts_days_per_year: ['stockouts_days_per_year', 'Stockouts (days/year)'],
    fertilizer_kg_per_ha: ['fertilizer_kg_per_ha', 'Fertilizer (kg/ha)'],
    improved_seed_use_pct: ['improved_seed_use_pct', 'Improved Seed Use (%)'],
    mechanization_units_per_1000_farms: ['mechanization_units_per_1000_farms', 'Mechanization Units per 1000 Farms'],
    distribution_timeliness_pct: ['distribution_timeliness_pct', 'Distribution Timeliness (%)'],
    input_price_index_2006_base: ['input_price_index_2006_base', 'Input Price Index (2006=100)'],
    agro_dealer_count: ['agro_dealer_count', 'Agro-dealer Count'],
    input_import_value_usd: ['input_import_value_usd', 'Input Import Value (USD)'],
    local_production_inputs_tons: ['local_production_inputs_tons', 'Local Production (tons)'],
  };

  const dataFields = [
    { key: 'cereal_seeds_tons', label: t('dataAndMethodology.cerealSeeds'), description: t('dataAndMethodology.cerealSeedsDesc'), format: (v: number) => v.toLocaleString() },
    { key: 'fertilizer_tons', label: t('dataAndMethodology.fertilizer'), description: t('dataAndMethodology.fertilizerDesc'), format: (v: number) => v.toLocaleString() },
    { key: 'pesticide_liters', label: t('dataAndMethodology.pesticides'), description: t('dataAndMethodology.pesticidesDesc'), format: (v: number) => v.toLocaleString() },
    { key: 'input_subsidy_budget_usd', label: t('dataAndMethodology.inputSubsidy'), description: t('dataAndMethodology.inputSubsidyDesc'), format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'credit_access_pct', label: t('dataAndMethodology.creditAccess'), description: t('dataAndMethodology.creditAccessDesc'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'stockouts_days_per_year', label: t('dataAndMethodology.stockouts'), description: t('dataAndMethodology.stockoutsDesc'), format: (v: number) => v.toLocaleString() },
    { key: 'fertilizer_kg_per_ha', label: t('dataAndMethodology.fertilizerIntensity'), description: t('dataAndMethodology.fertilizerIntensityDesc'), format: (v: number) => v.toFixed(1) },
    { key: 'improved_seed_use_pct', label: t('dataAndMethodology.improvedSeedAdoption'), description: t('dataAndMethodology.improvedSeedAdoptionDesc'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'mechanization_units_per_1000_farms', label: t('dataAndMethodology.mechanization'), description: t('dataAndMethodology.mechanizationDesc'), format: (v: number) => v.toFixed(1) },
    { key: 'distribution_timeliness_pct', label: t('dataAndMethodology.distributionTimeliness'), description: t('dataAndMethodology.distributionTimelinessDesc'), format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'input_price_index_2006_base', label: t('dataAndMethodology.inputPriceIndex'), description: t('dataAndMethodology.inputPriceIndexDesc'), format: (v: number) => v.toFixed(2) },
    { key: 'agro_dealer_count', label: t('dataAndMethodology.agroDealerCount'), description: t('dataAndMethodology.agroDealerCountDesc'), format: (v: number) => v.toLocaleString() },
    { key: 'input_import_value_usd', label: t('dataAndMethodology.inputImportValue'), description: t('dataAndMethodology.inputImportValueDesc'), format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'local_production_inputs_tons', label: t('dataAndMethodology.localProductionInputs'), description: t('dataAndMethodology.localProductionInputsDesc'), format: (v: number) => v.toLocaleString() },
  ] as const;

  const getValue = (row: InputData, key: string): number | undefined => {
    const possibles = columnMap[key] || [key];
    for (const col of possibles) {
      const val = row[col];
      if (typeof val === 'number') return val;
    }
    return undefined;
  };

  const safeFormat = (value: unknown, formatter: (v: number) => string): string => {
    return typeof value === 'number' && !isNaN(value) ? formatter(value) : 'N/A';
  };

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('dataAndMethodology.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    const fetchExcelData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(EXCEL_FILE_URL);
        if (!response.ok) throw new Error('Download failed');

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet);

        const normalizedData = rawData.map(row => {
          const normalized: Record<string, unknown> = { ...row };
          Object.keys(row).forEach(k => {
            normalized[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = row[k];
          });
          return normalized as InputData;
        });

        const filtered = normalizedData.filter(
          row => row.country?.toString().toLowerCase() === country.toLowerCase()
        );

        if (filtered.length === 0) {
          setError(t('dataAndMethodology.errors.noData', { country }));
          setLoading(false);
          return;
        }

        const maxYear = Math.max(...filtered.map(d => d.year as number), 2025);
        setSelectedYear(maxYear);
        setCountryData(filtered as InputData[]);

        // Try to extract methodology from Excel (optional)
        const metaSheet = workbook.SheetNames[1];
        if (metaSheet && workbook.Sheets[metaSheet]) {
          const meta = XLSX.utils.sheet_to_json(workbook.Sheets[metaSheet]);
          if (meta.length > 0) {
            setMethodology(meta[0] as Methodology);
          }
        }
      } catch (err) {
        console.error('Excel fetch error:', err);
        setError(t('dataAndMethodology.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchExcelData();
  }, [country, t]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map(d => d.year as number))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find(d => d.year === selectedYear);

  const handleCSVDownload = () => {
    const csvData = countryData.map(data => {
      const row: Record<string, string | number> = { Year: data.year as number };
      dataFields.forEach(field => {
        row[field.label] = safeFormat(getValue(data, field.key), field.format);
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${country}_data_and_methodology.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (format: 'png' | 'pdf') => {
    if (!dashboardRef.current) return;

    try {
      setShowDataSection(true);
      setShowMethodologySection(true);
      await new Promise(r => setTimeout(r, 1000));
      dashboardRef.current.classList.add('snapshot');

      const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
      dashboardRef.current.classList.remove('snapshot');

      const imgData = canvas.toDataURL('image/png');

      if (format === 'png') {
        const a = document.createElement('a');
        a.href = imgData;
        a.download = `${country}_data_and_methodology.png`;
        a.click();
      } else {
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        const width = pdf.internal.pageSize.getWidth() - 20;
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(imgData, 'PNG', 10, 30, width, height);
        pdf.setFontSize(16);
        pdf.text(t('dataAndMethodology.title', { countryName: country.toUpperCase() }), 10, 15);
        pdf.setFontSize(10);
        pdf.text(t('dataAndMethodology.report_exported', { date: new Date().toLocaleDateString() }), 10, 22);
        pdf.save(`${country}_data_and_methodology.pdf`);
      }
    } catch {
      alert(t(`dataAndMethodology.errors.${format}Failed`));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--dark-green)] text-lg font-medium">{t('dataAndMethodology.loading')}</p>
      </div>
    );
  }

  if (error || !selectedData) {
    return (
      <div className="min-h-screen bg-[var(--white)] flex justify-center items-center">
        <p className="text-[var(--wine)] text-lg font-medium">{error || t('dataAndMethodology.errors.noData', { country })}</p>
      </div>
    );
  }

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  return (
    <div className="min-h-screen bg-[var(--white)]">
      <header className="bg-[var(--medium-green)] text-[var(--white)] p-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <GiWheat className="text-2xl" /> {t('dataAndMethodology.title', { countryName })}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 rounded bg-[var(--white)] text-[var(--dark-green)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button onClick={handleCSVDownload} className="bg-[var(--medium-green)] text-[var(--white)] px-3 py-2 rounded flex items-center gap-2 hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-colors">
            <FaDownload /> {t('dataAndMethodology.downloadCSV')}
          </button>
          <button onClick={() => handleDownload('png')} className="bg-[var(--medium-green)] text-[var(--white)] px-3 py-2 rounded flex items-center gap-2 hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-colors">
            <FaDownload /> {t('dataAndMethodology.downloadPNG')}
          </button>
          <button onClick={() => handleDownload('pdf')} className="bg-[var(--medium-green)] text-[var(--white)] px-3 py-2 rounded flex items-center gap-2 hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-colors">
            <FaDownload /> {t('dataAndMethodology.downloadPDF')}
          </button>
        </div>
      </header>

      <main ref={dashboardRef} className="p-4 sm:p-6 max-w-4xl mx-auto">
        <p className="text-[var(--olive-green)] mb-6 text-sm sm:text-base italic">
          {t('dataAndMethodology.simulatedDataNote')}
        </p>

        {/* Data Description Section */}
        <section className="bg-[var(--white)] p-4 rounded-lg mb-6 border-l-4 border-[var(--medium-green)]">
          <button
            onClick={() => setShowDataSection(!showDataSection)}
            className="w-full text-left text-[var(--dark-green)] font-semibold text-lg sm:text-xl flex items-center justify-between mb-2 hover:text-[var(--yellow)]"
          >
            {t('dataAndMethodology.dataSectionTitle')}
            {showDataSection ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showDataSection && (
            <div>
              {methodology?.data_source && (
                <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                  <strong>{t('dataAndMethodology.source')}</strong> {methodology.data_source}
                </p>
              )}
              <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                {t('dataAndMethodology.datasetDescription', { country: countryName })}
              </p>
              <ul className="list-disc pl-5 text-[var(--wine)] text-sm sm:text-base mb-4 space-y-1">
                {dataFields.map((field) => (
                  <li key={field.key}>
                    <strong>{field.label}:</strong> {field.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Methodology Section */}
        <section className="bg-[var(--white)] p-4 rounded-lg mb-6 border-l-4 border-[var(--medium-green)]">
          <button
            onClick={() => setShowMethodologySection(!showMethodologySection)}
            className="w-full text-left text-[var(--dark-green)] font-semibold text-lg sm:text-xl flex items-center justify-between mb-2 hover:text-[var(--yellow)]"
          >
            {t('dataAndMethodology.methodologySectionTitle')}
            {showMethodologySection ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showMethodologySection && (
            <div>
              {methodology?.simulation_method && (
                <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                  <strong>{t('dataAndMethodology.simulationMethod')}</strong> {methodology.simulation_method}
                </p>
              )}
              {methodology?.assumptions && methodology.assumptions.length > 0 ? (
                <>
                  <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                    {t('dataAndMethodology.assumptionsDescription')}
                  </p>
                  <ul className="list-disc pl-5 text-[var(--wine)] text-sm sm:text-base mb-4 space-y-1">
                    {methodology.assumptions.map((assumption, index) => (
                      <li key={index}>{assumption}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                  {t('dataAndMethodology.noMethodology')}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Data Summary Table */}
        <section className="bg-[var(--white)] p-4 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--dark-green)] mb-4 flex items-center gap-2">
            {t('dataAndMethodology.summaryTitle', { year: selectedYear })}
            <FaInfoCircle className="text-[var(--olive-green)] text-sm" />
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base text-[var(--wine)] border-collapse border border-[var(--yellow)]">
              <thead>
                <tr className="bg-[var(--medium-green)] text-[var(--white)]">
                  <th className="border border-[var(--yellow)] p-2 text-left">{t('dataAndMethodology.metric')}</th>
                  <th className="border border-[var(--yellow)] p-2 text-left">{t('dataAndMethodology.value')}</th>
                </tr>
              </thead>
              <tbody>
                {dataFields.map((field) => {
                  const value = getValue(selectedData, field.key);
                  return (
                    <tr key={field.key}>
                      <td className="border border-[var(--yellow)] p-2">{field.label}</td>
                      <td className="border border-[var(--yellow)] p-2">
                        {safeFormat(value, field.format)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
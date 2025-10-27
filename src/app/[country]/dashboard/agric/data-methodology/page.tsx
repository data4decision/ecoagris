'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { FaDownload, FaInfoCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { GiWheat } from 'react-icons/gi';
import { stringify } from 'csv-stringify/sync';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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

export default function DataAndMethodologyPage() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [countryData, setCountryData] = useState<InputData[]>([]);
  const [methodology, setMethodology] = useState<Dataset['Methodology_Assumptions'] | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDataSection, setShowDataSection] = useState(true);
  const [showMethodologySection, setShowMethodologySection] = useState(true);

  // Define all known fields for display and CSV
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
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError(t('dataAndMethodology.errors.invalidCountry'));
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/agric/APMD_ECOWAS_Input_Simulated_2006_2025.json');
        if (!response.ok) throw new Error(t('dataAndMethodology.errors.fetchFailed'));
        const jsonData = (await response.json()) as Dataset;

        const years = jsonData.Simulated_Input_Data.map((d) => d.year);
        const maxYear = Math.max(...years, 2025);
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Simulated_Input_Data.filter(
          (d) => d.country.toLowerCase() === country.toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setError(t('dataAndMethodology.errors.noData', { country }));
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setMethodology(jsonData.Methodology_Assumptions || null);
        setLoading(false);
      } catch (error) {
        setError(t('dataAndMethodology.errors.fetchFailed'));
        setLoading(false);
      }
    }

    fetchData();
  }, [country, t]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map((d) => d.year))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find((d) => d.year === selectedYear);

  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => {
      const row: { [key: string]: string | number } = { Year: data.year };
      dataFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : t('dataAndMethodology.na');
      });
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_data_and_methodology.csv`;
    link.click();
    console.log('CSV downloaded successfully');
  };

  const handlePNGDownload = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found for PNG generation');
      alert(t('dataAndMethodology.errors.pngFailed'));
      return;
    }

    try {
      console.log('Starting PNG download...');
      setShowDataSection(true);
      setShowMethodologySection(true);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1000ms delay
      dashboardRef.current.classList.add('snapshot');
      console.log('Applied snapshot styles');
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
      });

      console.log('PNG Canvas dimensions:', { width: canvas.width, height: canvas.height });
      dashboardRef.current.classList.remove('snapshot');
      console.log('Removed snapshot styles');

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas is empty or invalid:', { width: canvas?.width, height: canvas?.height });
        throw new Error(t('dataAndMethodology.errors.invalidCanvas'));
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated');
        throw new Error(t('dataAndMethodology.errors.invalidImageData'));
      }

      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${country}_data_and_methodology.png`;
      link.click();
      console.log('PNG downloaded successfully');
    } catch (err) {
      console.error('PNG generation error:', err);
      alert(t('dataAndMethodology.errors.pngFailed'));
    }
  };

  const handlePDFDownload = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found for PDF generation');
      alert(t('dataAndMethodology.errors.pdfFailed'));
      return;
    }

    try {
      console.log('Starting PDF download...');
      setShowDataSection(true);
      setShowMethodologySection(true);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1000ms delay
      dashboardRef.current.classList.add('snapshot');
      console.log('Applied snapshot styles');
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: true,
      });

      console.log('PDF Canvas dimensions:', { width: canvas.width, height: canvas.height });
      dashboardRef.current.classList.remove('snapshot');
      console.log('Removed snapshot styles');

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('Canvas is empty or invalid:', { width: canvas?.width, height: canvas?.height });
        throw new Error(t('dataAndMethodology.errors.invalidCanvas'));
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      if (!imgData || imgData === 'data:,') {
        console.error('Invalid image data generated');
        throw new Error(t('dataAndMethodology.errors.invalidImageData'));
      }

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.setFontSize(12);
      pdf.text(t('dataAndMethodology.title', { countryName: country.toUpperCase() }), 10, 10);
      pdf.text(t('dataAndMethodology.metrics'), 10, 18);
      pdf.text(t('dataAndMethodology.report_exported', { date: new Date().toLocaleDateString() }), 10, 26);
      pdf.addImage(imgData, 'PNG', 10, 35, imgWidth, imgHeight);
      pdf.save(`${country}_data_and_methodology.pdf`);
      console.log('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(t('dataAndMethodology.errors.pdfFailed'));
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
      {/* Header Bar */}
      <header className="bg-[var(--medium-green)] text-[var(--white)] p-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-10">
        <h1
          className="text-xl sm:text-2xl font-bold flex items-center gap-2"
          aria-label={t('dataAndMethodology.ariaTitle', { country: countryName })}
        >
          <GiWheat className="text-2xl" /> {t('dataAndMethodology.title', { countryName })}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 rounded bg-[var(--white)] text-[var(--dark-green)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
            aria-label={t('dataAndMethodology.yearSelectLabel')}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            onClick={handleCSVDownload}
            className="bg-[var(--medium-green)] text-[var(--white)] px-3 py-2 rounded flex items-center gap-2 hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-colors cursor-pointer"
            aria-label={t('dataAndMethodology.downloadCSVLabel')}
          >
            <FaDownload /> {t('dataAndMethodology.downloadCSV')}
          </button>
          <button
            onClick={handlePNGDownload}
            className="bg-[var(--medium-green)] text-[var(--white)] px-3 py-2 rounded flex items-center gap-2 hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-colors cursor-pointer"
            aria-label={t('dataAndMethodology.downloadPNGLabel')}
          >
            <FaDownload /> {t('dataAndMethodology.downloadPNG')}
          </button>
          <button
            onClick={handlePDFDownload}
            className="bg-[var(--medium-green)] text-[var(--white)] px-3 py-2 rounded flex items-center gap-2 hover:bg-[var(--yellow)] hover:text-[var(--dark-green)] transition-colors cursor-pointer"
            aria-label={t('dataAndMethodology.downloadPDFLabel')}
          >
            <FaDownload /> {t('dataAndMethodology.downloadPDF')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main ref={dashboardRef} className="p-4 sm:p-6 max-w-4xl mx-auto" id="data-and-methodology-content">
        <p className="text-[var(--olive-green)] mb-6 text-sm sm:text-base italic">
          {t('dataAndMethodology.simulatedDataNote')}
        </p>

        {/* Data Description Section */}
        <section className="bg-[var(--white)] p-4 rounded-lg mb-6 border-l-4 border-[var(--medium-green)]">
          <button
            onClick={() => setShowDataSection(!showDataSection)}
            className="w-full text-left text-[var(--dark-green)] font-semibold text-lg sm:text-xl flex items-center justify-between mb-2 hover:text-[var(--yellow)]"
            aria-expanded={showDataSection}
            aria-controls="data-description"
          >
            {t('dataAndMethodology.dataSectionTitle')}
            {showDataSection ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showDataSection && (
            <div id="data-description">
              {methodology?.data_source && (
                <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                  <strong>{t('dataAndMethodology.source')}</strong> {methodology.data_source}
                </p>
              )}
              <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                {t('dataAndMethodology.datasetDescription', { country: countryName })}
              </p>
              <ul className="list-disc pl-5 text-[var(--wine)] text-sm sm:text-base mb-4">
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
        {/* <section className="bg-[var(--white)] p-4 rounded-lg mb-6 border-l-4 border-[var(--medium-green)]">
          <button
            onClick={() => setShowMethodologySection(!showMethodologySection)}
            className="w-full text-left text-[var(--dark-green)] font-semibold text-lg sm:text-xl flex items-center justify-between mb-2 hover:text-[var(--yellow)]"
            aria-expanded={showMethodologySection}
            aria-controls="methodology-description"
          >
            {t('dataAndMethodology.methodologySectionTitle')}
            {showMethodologySection ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {showMethodologySection && (
            <div id="methodology-description">
              {methodology?.simulation_method && (
                <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                  <strong>{t('dataAndMethodology.simulationMethod')}</strong> {methodology.simulation_method}
                </p>
              )}
              {methodology?.assumptions && Array.isArray(methodology.assumptions) && methodology.assumptions.length > 0 ? (
                <>
                  <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                    {t('dataAndMethodology.assumptionsDescription')}
                  </p>
                  <ul className="list-disc pl-5 text-[var(--wine)] text-sm sm:text-base mb-4">
                    {methodology.assumptions.map((assumption, index) => (
                      <li key={index}>{assumption}</li>
                    ))}
                  </ul>
                </>
              ) : (
                !methodology?.simulation_method && (
                  <p className="text-[var(--wine)] text-sm sm:text-base mb-4">
                    {t('dataAndMethodology.noMethodology')}
                  </p>
                )
              )}
            </div>
          )}
        </section> */}

        {/* Data Summary Table */}
        <section className="bg-[var(--white)] p-4 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--dark-green)] mb-4 flex items-center gap-2">
            {t('dataAndMethodology.summaryTitle', { year: selectedYear })}
            <FaInfoCircle className="text-[var(--olive-green)] text-sm" title={t('dataAndMethodology.summaryTooltip', { country: countryName, year: selectedYear })} />
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
                {dataFields.map((field) => (
                  <tr key={field.key}>
                    <td className="border border-[var(--yellow)] p-2">{field.label}</td>
                    <td className="border border-[var(--yellow)] p-2">
                      {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : t('dataAndMethodology.na')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
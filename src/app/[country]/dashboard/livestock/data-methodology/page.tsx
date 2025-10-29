'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { FaBook, FaDownload, FaChevronDown, FaChevronUp, FaExclamationTriangle } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import '@/styles/dashboard-styles.css';

// ---------------------------------------------------------------------
// 1. Types
// ---------------------------------------------------------------------
interface MethodologyData {
  country: string;
  Methodology_Assumptions?: string | string[]; // Optional + flexible type
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Livestock_Data: MethodologyData[];
}

// ---------------------------------------------------------------------
// 2. Main Component
// ---------------------------------------------------------------------
export default function MethodologyDashboard() {
  const { country } = useParams<{ country: string }>();
  const { t } = useTranslation('common');
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [methodology, setMethodology] = useState<string | string[]>([]);
  const [expanded, setExpanded] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const countryName = country.charAt(0).toUpperCase() + country.slice(1);

  // -----------------------------------------------------------------
  // 3. Fetch Data (Improved Error Handling)
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!country) return;

    async function fetchData() {
      try {
        const res = await fetch('/data/livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json');
        if (!res.ok) throw new Error(t('methodology.errors.fetchFailed'));

        const json = (await res.json()) as Dataset;
        const rawData = json.Simulated_Livestock_Data;

        if (!Array.isArray(rawData)) {
          throw new Error('Invalid data structure');
        }

        // Find ANY entry for the country (year doesn't matter)
        const record = rawData.find((d) => d.country?.toLowerCase() === country.toLowerCase());
        if (!record) {
          throw new Error(t('methodology.errors.noData', { country }));
        }

        // Handle missing field gracefully
        if (!record.Methodology_Assumptions) {
          setMethodology(t('methodology.defaultAssumptions'));
          setLoading(false);
          return;
        }

        let parsed: string | string[] = record.Methodology_Assumptions;

        // Try to parse JSON array
        try {
          const jsonArr = JSON.parse(parsed as string);
          if (Array.isArray(jsonArr)) {
            parsed = jsonArr;
          }
        } catch {
          // Plain text
          parsed = (parsed as string).trim();
        }

        setMethodology(parsed);
        setLoading(false);
      } catch (err) {
        console.error('Methodology load error:', err);
        setError(err instanceof Error ? err.message : t('methodology.errors.fetchFailed'));
        setLoading(false);
      }
    }

    fetchData();
  }, [country, t]);

  // -----------------------------------------------------------------
  // 4. PDF Export
  // -----------------------------------------------------------------
  const exportPDF = async () => {
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
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.setFontSize(16);
      pdf.text(t('methodology.title', { countryName: country.toUpperCase() }), 10, 15);
      pdf.setFontSize(10);
      pdf.text(t('methodology.reportExported', { date: new Date().toLocaleDateString() }), 10, 22);
      pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
      pdf.save(`${country}_methodology.pdf`);
    } catch (err) {
      alert(t('methodology.errors.pdfFailed'));
    }
  };

  // -----------------------------------------------------------------
  // 5. Early Returns
  // -----------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] items-center justify-center p-6">
        <p className="text-[var(--dark-green)] text-lg">{t('methodology.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] items-center justify-center p-6">
        <div className="text-center">
          <FaExclamationTriangle className="text-[var(--wine)] text-4xl mx-auto mb-2" />
          <p className="text-[var(--wine)] text-lg">{error}</p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // 6. Render
  // -----------------------------------------------------------------
  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" ref={dashboardRef}>
        {/* Header */}
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2">
          <FaBook /> {t('methodology.title', { countryName })}
        </h1>

        {/* Export Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-4 py-2 rounded hover:bg-[var(--olive-green)] text-sm"
          >
            <FaDownload /> {t('methodology.downloadPDF')}
          </button>
        </div>

        {/* Methodology Card */}
        <div className="bg-[var(--light-yellow)] p-5 rounded-lg shadow border border-[var(--medium-green)]">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <h2 className="text-lg font-semibold text-[var(--dark-green)]">
              {t('methodology.assumptionsTitle')}
            </h2>
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </div>

          {expanded && (
            <div className="mt-4 text-[var(--olive-green)] text-sm leading-relaxed space-y-3">
              {Array.isArray(methodology) && methodology.length > 0 ? (
                <ol className="list-decimal list-inside space-y-2">
                  {methodology.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              ) : (
                <p className="italic">{typeof methodology === 'string' ? methodology : t('methodology.noDetails')}</p>
              )}
            </div>
          )}
        </div>

        {/* Data Source Note */}
        <p className="mt-6 text-xs text-[var(--medium-green)] italic">
          {t('methodology.dataSource')}
        </p>
      </div>
    </div>
  );
}
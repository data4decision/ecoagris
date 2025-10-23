'use client';

// Import required dependencies
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { FaChartLine, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define interfaces
interface TradeData {
  country: string;
  year: number;
  exports_usd: number;
  imports_usd: number;
  trade_balance_usd: number;
  fdi_net_inflows_usd_million: number;
  remittances_usd: number;
  current_account_usd: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Macro_Data: TradeData[];
}

export default function TradeInvestmentPage() {
  const { country } = useParams();
  const router = useRouter();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [tradeData, setTradeData] = useState<TradeData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);

  // Fetch data from JSON file only
  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/macro/WestAfrica_Macro_Simulated_2006_2025.json');
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        const jsonData = (await response.json()) as Dataset;

        console.log('Sample dataset record:', jsonData.Simulated_Macro_Data[0]);

        if (!jsonData.Simulated_Macro_Data || !Array.isArray(jsonData.Simulated_Macro_Data)) {
          throw new Error('Invalid dataset format: Simulated_Macro_Data is missing or not an array');
        }

        const filteredData = jsonData.Simulated_Macro_Data.filter(
          (d) => d.country && d.country.toLowerCase() === (country as string).toLowerCase()
        );

        if (filteredData.length === 0) {
          setLoading(false);
          return;
        }

        console.log(`Filtered data for ${country}:`, filteredData);

        setTradeData(filteredData);
        setSelectedYear(Math.max(...filteredData.map((d) => d.year), 2025));
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setLoading(false);
      }
    }
    fetchData();
  }, [country]);

  // Get unique years for dropdown
  const availableYears = useMemo(() => {
    return Array.from(new Set(tradeData.map((d) => d.year).filter((y) => typeof y === 'number'))).sort((a, b) => a - b);
  }, [tradeData]);

  // Get data for the selected year
  const selectedData = tradeData.find((d) => d.year === selectedYear);

  // CSV download
  const handleCSVDownload = () => {
    const csvData = tradeData.map((data) => ({
      Country: data.country,
      Year: data.year,
      Exports: data.exports_usd,
      Imports: data.imports_usd,
      TradeBalance: data.trade_balance_usd,
      FDI: data.fdi_net_inflows_usd_million,
      Remittances: data.remittances_usd,
      CurrentAccount: data.current_account_usd,
    }));
    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_trade_investment.csv`;
    link.click();
  };

  // PDF download (adapted from exportPDF)
  const handlePDFDownload = async () => {
    if (!dashboardRef.current) {
      console.error('Dashboard element not found for PDF generation');
      alert('PDF download failed. Please try again.');
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape');
      pdf.setFontSize(12);
      pdf.text(`Trade and Investment Report - ${(country as string).toUpperCase()}`, 10, 10);
      pdf.text(`Metrics: Exports, Imports, Trade Balance, FDI, Remittances, Current Account`, 10, 18);
      pdf.text(`Exported on: ${new Date().toLocaleDateString()}`, 10, 26);
      pdf.addImage(imgData, 'PNG', 10, 35, 270, 120);
      pdf.save(`${country}_trade_investment.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF download failed. Please check console for details.');
    }
  };

  // Render
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">Loading Trade and Investment Data...</p>
        </div>
      </div>
    );
  }

  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">No data available for this country</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div ref={dashboardRef} className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content">
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={`Trade and Investment for ${country}`}
        >
          <FaChartLine /> Trade and Investment - {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          Simulated data for planning purposes. Explore trends below.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download trade and investment data as CSV"
          >
            <FaDownload /> Download CSV
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download trade and investment dashboard as PDF"
          >
            <FaDownload /> Download PDF
          </button>
        </div>
        {/* Year Selection */}
        <div className="mb-6 max-w-full">
          <label htmlFor="year-select" className="sr-only">
            Select Year for Metrics
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-[var(--olive-green)]"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        {/* Add your charts, cards, or other content here */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 max-w-full">
          {/* Example Metric Cards (adjust based on your actual content) */}
          <div
            className="bg-gradient-to-br from-[var(--white)] to-[var(--yellow)]/30 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 min-w-0"
            aria-label={`Exports for ${selectedYear}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <FaChartLine className="text-[var(--dark-green)] text-lg" />
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base leading-tight">Exports</h3>
            </div>
            <p className="text-[var(--wine)] text-lg sm:text-2xl font-bold">
              {selectedData.exports_usd?.toLocaleString() || 'N/A'} USD
            </p>
            <p className="text-[var(--olive-green)] text-xs sm:text-sm mt-1">Year: {selectedYear}</p>
          </div>
          {/* Add more cards for Imports, Trade Balance, FDI, etc., as needed */}
        </div>
      </div>
    </div>
  );
}
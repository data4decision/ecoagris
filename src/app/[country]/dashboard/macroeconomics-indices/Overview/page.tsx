'use client';

// Import required dependencies
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { FaChartBar, FaGlobe, FaCalendarAlt, FaUsers, FaChartLine, FaDollarSign, FaHandsHelping, FaSeedling, FaDownload } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define TypeScript interfaces
interface MacroData {
  country: string;
  year: number;
  population: number;
  [key: string]: unknown;
}

interface Dataset {
  Simulated_Macro_Data: MacroData[];
  Methodology_Assumptions: { note: string }[];
}

export default function MacroOverviewPage() {
  // Get dynamic country parameter from URL
  const { country } = useParams();
  const router = useRouter();
  const dashboardRef = useRef<HTMLDivElement>(null);
  // State for overview data, selected year, loading
  const [overviewData, setOverviewData] = useState<MacroData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);

  // Page preview data (title, icon, path, description)
  const pagePreviews = [
    {
      title: 'Economic Output',
      icon: FaChartLine,
      path: `/${country}/dashboard/macroeconomics-indices/economic-output`,
      description: 'GDP, GDP per capita, and economic growth trends.',
    },
    {
      title: 'Fiscal and Monetary Policy',
      icon: FaDollarSign,
      path: `/${country}/dashboard/macroeconomics-indices/fiscal-monetary`,
      description: 'Inflation, public debt, and monetary policy metrics.',
    },
    {
      title: 'Labor and Poverty',
      icon: FaHandsHelping,
      path: `/${country}/dashboard/macroeconomics-indices/labor-poverty`,
      description: 'Unemployment, poverty rates, and labor force participation.',
    },
    {
      title: 'Trade and Investment',
      icon: FaGlobe,
      path: `/${country}/dashboard/macroeconomics-indices/trade-investment`,
      description: 'Exports, imports, trade balance, FDI, and remittances.',
    },
    {
      title: 'Agriculture',
      icon: FaSeedling,
      path: `/${country}/dashboard/macroeconomics-indices/agriculture`,
      description: 'Agricultural value added and rice production trends.',
    },
  ];

  // Fetch data from JSON file only
  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/macro/WestAfrica_Macro_Simulated_2006_2025.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch macro data: ${response.status} ${response.statusText}`);
        }
        const jsonData = (await response.json()) as Dataset;

        console.log('Sample dataset record:', jsonData.Simulated_Macro_Data[0]);

        if (!jsonData.Simulated_Macro_Data || !Array.isArray(jsonData.Simulated_Macro_Data)) {
          throw new Error('Invalid dataset format: Simulated_Macro_Data is missing or not an array');
        }

        const filteredCountryData = jsonData.Simulated_Macro_Data.filter(
          (d) => d.country && d.country.toLowerCase() === (country as string).toLowerCase()
        );

        if (filteredCountryData.length === 0) {
          setLoading(false);
          return;
        }

        console.log(`Filtered data for ${country}:`, filteredCountryData);

        const years = filteredCountryData.map((d) => d.year).filter((y) => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years, 2025) : 2025;
        setSelectedYear(maxYear);

        setOverviewData(filteredCountryData);
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
    return Array.from(new Set(overviewData.map((d) => d.year).filter((y) => typeof y === 'number'))).sort((a, b) => a - b);
  }, [overviewData]);

  // Get data for the selected year
  const selectedData = overviewData.find((d) => d.year === selectedYear);

  // Function to handle CSV download
  const handleCSVDownload = () => {
    const csvData = overviewData.map((data) => ({
      Country: data.country,
      Year: data.year,
      Population: data.population,
    }));

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_macro_overview.csv`;
    link.click();
  };

  // Function to handle PDF download (adapted from exportPDF)
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
      pdf.text(`Macroeconomic Report - ${(country as string).toUpperCase()}`, 10, 10);
      pdf.text(`Metrics: Country, Year, Population`, 10, 18);
      pdf.text(`Exported on: ${new Date().toLocaleDateString()}`, 10, 26);
      pdf.addImage(imgData, 'PNG', 10, 35, 270, 120);
      pdf.save(`${country}_macro_overview.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('PDF download failed. Please check console for details.');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">Loading Macroeconomic Indices Overview...</p>
        </div>
      </div>
    );
  }

  // Render error state
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
        {/* Page Header */}
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={`Macroeconomic Indices Overview for ${country}`}
        >
          <FaChartBar aria-hidden="true" className="text-lg sm:text-xl" />
          Macroeconomic Indices Overview - {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          Simulated data for planning purposes. Explore categories for detailed trends.
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download macroeconomic indices overview data as CSV"
          >
            <FaDownload /> Download CSV
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download macroeconomic indices overview dashboard as PDF"
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

        {/* Overview Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 max-w-full">
          {/* Country Card */}
          <div
            className="bg-gradient-to-br from-[var(--white)] to-[var(--yellow)]/30 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 min-w-0"
            aria-label={`Country Card for ${selectedYear}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <FaGlobe className="text-[var(--dark-green)] text-lg" />
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base leading-tight">Country</h3>
            </div>
            <p className="text-[var(--wine)] text-lg sm:text-2xl font-bold">
              {selectedData.country}
            </p>
            <p className="text-[var(--olive-green)] text-xs sm:text-sm mt-1">Current: {selectedYear}</p>
          </div>

          {/* Year Card */}
          <div
            className="bg-gradient-to-br from-[var(--white)] to-[var(--green)]/30 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 min-w-0"
            aria-label={`Year Card for ${selectedYear}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <FaCalendarAlt className="text-[var(--dark-green)] text-lg" />
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base leading-tight">Year</h3>
            </div>
            <p className="text-[var(--wine)] text-lg sm:text-2xl font-bold">
              {selectedYear}
            </p>
            <p className="text-[var(--olive-green)] text-xs sm:text-sm mt-1">Selected</p>
          </div>

          {/* Population Card */}
          <div
            className="bg-gradient-to-br from-[var(--white)] to-[var(--wine)]/30 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 min-w-0"
            aria-label={`Population Card for ${selectedYear}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <FaUsers className="text-[var(--dark-green)] text-lg" />
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base leading-tight">Population</h3>
            </div>
            <p className="text-[var(--wine)] text-lg sm:text-2xl font-bold">
              {selectedData.population?.toLocaleString() || 'N/A'}
            </p>
            <p className="text-[var(--olive-green)] text-xs sm:text-sm mt-1">Year: {selectedYear}</p>
          </div>
        </div>

        {/* Page Previews Grid */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--dark-green)] mb-4">Explore Macroeconomic Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pagePreviews.map((preview) => (
              <div
                key={preview.title}
                className="bg-gradient-to-br from-[var(--white)] to-[var(--green)]/20 p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 cursor-pointer"
                onClick={() => router.push(preview.path)}
                aria-label={`Navigate to ${preview.title}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <preview.icon className="text-[var(--dark-green)] text-2xl" />
                  <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base">{preview.title}</h3>
                </div>
                <p className="text-[var(--olive-green)] text-xs sm:text-sm">{preview.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
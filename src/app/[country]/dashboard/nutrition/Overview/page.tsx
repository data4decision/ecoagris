// src/app/[country]/dashboard/nutrition/overview/page.tsx
'use client';

// Import required dependencies
import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { FaChartBar, FaHeartbeat, FaUtensils, FaCapsules, FaChild, FaHandsHelping, FaMoneyBillWave, FaDownload, FaShieldAlt, FaDatabase, FaGlobe, FaCalendarAlt, FaUsers } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {useRouter} from 'next/navigation'

// Define TypeScript interfaces directly in the file
interface OverviewData {
  country: string;
  year: number;
  population: number;
  [key: string]: unknown; // Allow for other fields in the dataset
}

interface Dataset {
  Nutrition_Data: OverviewData[];
}

export default function OverviewPage() {
  // Get dynamic country parameter from URL
  const { country } = useParams();
  // State for overview data, selected year, loading, and error
  const [overviewData, setOverviewData] = useState<OverviewData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Page preview data (title, icon, path, description)
  const pagePreviews = [
    { title: 'Malnutrition Indicators', icon: FaHeartbeat, path: `/${country}/dashboard/nutrition/malnutrition`, description: 'Prevalence of undernourishment, stunting, and obesity trends.' },
    { title: 'Dietary & Nutrient Intake', icon: FaUtensils, path: `/${country}/dashboard/nutrition/dietary-nutrient-intake`, description: 'Caloric intake, protein, and food consumption patterns.' },
    { title: 'Micronutrient Deficiencies', icon: FaCapsules, path:  `/${country}/dashboard/nutrition/micronutrient-deficiencies`, description: 'Vitamin A, iron, and anemia rates in women and children.' },
    { title: 'Health Outcomes', icon: FaChild, path:  `/${country}/dashboard/nutrition/health-outcomes`, description: 'Child mortality, maternal mortality, and birth weight metrics.' },
    { title: 'Nutrition Interventions', icon: FaHandsHelping, path:  `/${country}/dashboard/nutrition/interventions`, description: 'Breastfeeding, dietary diversity, and school meals coverage.' },
    { title: 'Policy & Funding', icon: FaMoneyBillWave, path:  `/${country}/dashboard/nutrition/policy-funding`, description: 'Budget spending, policy scores, and donor funding.' },
    { title: 'Program Coverage & Surveillance', icon: FaShieldAlt, path: `/${country}/dashboard/nutrition/program-coverage-surveillance`, description: 'Program coverage, surveillance, deworming, and immunization rates.' },
    { title: 'Data Quality & Methodology', icon: FaDatabase, path: `/${country}/dashboard/nutrition/data-methodology`, description: 'Data quality index and methodology notes.' },
  ];

  // Fetch data from JSON file
  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError('Invalid country parameter');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Data Fetch Location: Load the overview dataset
        // Path: /public/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json
        const response = await fetch('/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch overview data: ${response.status} ${response.statusText}`);
        }
        const jsonData = (await response.json()) as Dataset;

        // Log sample data to verify fields
        console.log('Sample dataset record:', jsonData.Nutrition_Data[0]);

        // Validate dataset structure
        if (!jsonData.Nutrition_Data || !Array.isArray(jsonData.Nutrition_Data)) {
          throw new Error('Invalid dataset format: Nutrition_Data is missing or not an array');
        }

        // Calculate the latest year dynamically
        const years = jsonData.Nutrition_Data.map((d) => d.year).filter((y) => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years, 2025) : 2025;
        setSelectedYear(maxYear);

        // Filter data for the selected country
        const filteredCountryData = jsonData.Nutrition_Data.filter(
          (d) => d.country && d.country.toLowerCase() === (country as string).toLowerCase()
        );

        // Log filtered data to check values
        console.log(`Filtered overview data for ${country}:`, filteredCountryData);

        if (filteredCountryData.length === 0) {
          setError(`No data available for ${country}`);
          setLoading(false);
          return;
        }

        setOverviewData(filteredCountryData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Error loading overview data: ${(err as Error).message}`);
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
    link.download = `${country}_overview_data.csv`;
    link.click();
  };

  // Function to handle PDF download
  const handlePDFDownload = async () => {
    const dashboard = document.getElementById('dashboard-content');
    if (!dashboard) {
      console.error('Dashboard content not found for PDF generation');
      return;
    }

    try {
      const canvas = await html2canvas(dashboard, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`${country}_overview_dashboard.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">Loading Overview Data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || 'No data available for this country'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content">
        {/* Page Header */}
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={`Overview for ${country}`}
        >
          <FaChartBar aria-hidden="true" className="text-lg sm:text-xl" /> Overview -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          Simulated data for planning purposes. Validate before operational use.
        </p>

        {/* Download Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download overview data as CSV"
          >
            <FaDownload /> Download CSV
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download overview dashboard as PDF"
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
          <div className="bg-gradient-to-br from-[var(--white)] to-[var(--yellow)]/30 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 min-w-0">
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
          <div className="bg-gradient-to-br from-[var(--white)] to-[var(--green)]/30 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 min-w-0">
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
          <div className="bg-gradient-to-br from-[var(--white)] to-[var(--wine)]/30 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 min-w-0">
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
          <h2 className="text-lg sm:text-xl font-bold text-[var(--dark-green)] mb-4">Explore Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pagePreviews.map((preview) => (
              <div
                key={preview.title}
                className="bg-gradient-to-br from-[var(--white)] to-[var(--green)]/20 p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 cursor-pointer"
                onClick={() => router.push(preview.path)}
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
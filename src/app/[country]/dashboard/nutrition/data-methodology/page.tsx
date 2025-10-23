'use client';

// Import required dependencies
import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
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
import { FaChartLine, FaDownload, FaDatabase, FaFileAlt } from 'react-icons/fa';
import { stringify } from 'csv-stringify/sync';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define TypeScript interfaces
interface MethodologyNotes {
  methodology?: string; // Adjust based on actual object structure
  [key: string]: unknown;
}

interface DataQualityAndMethodologyData {
  country: string;
  year: number;
  nutrition_data_quality_index?: number;
  Methodology_Notes?: string | MethodologyNotes; // Allow string or object
  [key: string]: unknown;
}

interface Dataset {
  Nutrition_Data: DataQualityAndMethodologyData[];
  Methodology_Notes?: string | MethodologyNotes; // Allow string or object
}

export default function DataQualityAndMethodologyPage() {
  const { country } = useParams();
  const [countryData, setCountryData] = useState<DataQualityAndMethodologyData[]>([]);
  const [methodologyNotes, setMethodologyNotes] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dataQualityFields = [
    {
      key: 'nutrition_data_quality_index',
      label: 'Nutrition Data Quality Index',
      format: (v: number) => v.toFixed(1),
      icon: <FaDatabase className="text-[var(--dark-green)] text-lg" />,
    },
  ];

  useEffect(() => {
    if (!country || typeof country !== 'string') {
      setError('Invalid country parameter');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch('/data/nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        const jsonData = (await response.json()) as Dataset;

        console.log('Sample dataset record:', jsonData.Nutrition_Data[0]);
        console.log('Dataset-wide Methodology_Notes:', jsonData.Methodology_Notes);

        if (!jsonData.Nutrition_Data || !Array.isArray(jsonData.Nutrition_Data)) {
          throw new Error('Invalid dataset format: Nutrition_Data is missing or not an array');
        }

        // Handle methodology notes (string or object)
        let notes: string | null = null;
        if (typeof jsonData.Methodology_Notes === 'string') {
          notes = jsonData.Methodology_Notes;
        } else if (jsonData.Methodology_Notes && typeof jsonData.Methodology_Notes === 'object') {
          notes = jsonData.Methodology_Notes.methodology || JSON.stringify(jsonData.Methodology_Notes);
        } else if (jsonData.Nutrition_Data[0]?.Methodology_Notes) {
          const firstNote = jsonData.Nutrition_Data[0].Methodology_Notes;
          notes = typeof firstNote === 'string' ? firstNote : firstNote?.methodology || JSON.stringify(firstNote);
        } else {
          notes = 'No methodology notes available.';
        }
        setMethodologyNotes(notes);

        const years = jsonData.Nutrition_Data.map((d) => d.year).filter((y) => typeof y === 'number');
        const maxYear = years.length > 0 ? Math.max(...years, 2025) : 2025;
        setSelectedYear(maxYear);

        const filteredCountryData = jsonData.Nutrition_Data.filter(
          (d) => d.country && d.country.toLowerCase() === (country as string).toLowerCase()
        );

        console.log(`Filtered data for ${country}:`, filteredCountryData);

        if (filteredCountryData.length === 0) {
          setError(`No data available for ${country}`);
          setLoading(false);
          return;
        }

        setCountryData(filteredCountryData);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Error loading data: ${(err as Error).message}`);
        setLoading(false);
      }
    }

    fetchData();
  }, [country]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(countryData.map((d) => d.year).filter((y) => typeof y === 'number'))).sort((a, b) => a - b);
  }, [countryData]);

  const selectedData = countryData.find((d) => d.year === selectedYear);

  const handleCSVDownload = () => {
    const csvData = countryData.map((data) => {
      const row: { [key: string]: string | number } = { Year: data.year };
      dataQualityFields.forEach((field) => {
        row[field.label] = data[field.key] != null ? field.format(data[field.key] as number) : 'N/A';
      });
      if (data.Methodology_Notes) {
        row['Methodology Notes'] =
          typeof data.Methodology_Notes === 'string'
            ? data.Methodology_Notes
            : data.Methodology_Notes?.methodology || JSON.stringify(data.Methodology_Notes);
      }
      return row;
    });

    const csv = stringify(csvData, { header: true });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${country}_data_quality_methodology_data.csv`;
    link.click();
  };

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
      pdf.save(`${country}_data_quality_methodology_dashboard.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--dark-green)] text-base sm:text-lg">Loading Data Quality and Methodology Data...</p>
        </div>
      </div>
    );
  }

  if (!selectedData) {
    return (
      <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <p className="text-[var(--wine)] text-base sm:text-lg">{error || 'No data available for this country'}</p>
        </div>
      </div>
    );
  }

  // Function to render methodology notes
  const renderMethodologyNotes = () => {
    const notes = selectedData.Methodology_Notes || methodologyNotes;
    if (typeof notes === 'string') {
      return notes;
    } else if (notes && typeof notes === 'object') {
      return notes.methodology || JSON.stringify(notes);
    }
    return 'No methodology notes available.';
  };

  return (
    <div className="flex min-h-screen bg-[var(--white)] max-w-full overflow-x-hidden">
      <div className="flex-1 p-4 sm:p-6 min-w-0" id="dashboard-content">
        <h1
          className="text-xl sm:text-2xl font-bold text-[var(--dark-green)] mb-4 flex items-center gap-2"
          aria-label={`Data Quality and Methodology Overview for ${country}`}
        >
          <FaChartLine aria-hidden="true" className="text-lg sm:text-xl" /> Data Quality and Methodology -{' '}
          {(country as string).charAt(0).toUpperCase() + (country as string).slice(1)}
        </h1>
        <p className="text-[var(--olive-green)] mb-4 text-sm sm:text-base">
          Simulated data for planning purposes. Validate before operational use.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 max-w-full">
          <button
            onClick={handleCSVDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download data quality and methodology data as CSV"
          >
            <FaDownload /> Download CSV
          </button>
          <button
            onClick={handlePDFDownload}
            className="flex items-center justify-center gap-2 bg-[var(--dark-green)] text-[var(--white)] px-3 py-2 sm:px-4 sm:py-2 rounded hover:bg-[var(--olive-green)] text-sm sm:text-base w-full sm:w-auto transition-colors duration-200"
            aria-label="Download data quality and methodology dashboard as PDF"
          >
            <FaDownload /> Download PDF
          </button>
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 max-w-full">
          {dataQualityFields.map((field) => (
            <div
              key={field.key}
              className="bg-gradient-to-br from-[var(--white)] to-[var(--yellow)]/90 p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 min-w-0"
              aria-label={`${field.label} Card for ${selectedYear}`}
            >
              <div className="flex items-center gap-3 mb-2">
                {field.icon}
                <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base leading-tight">{field.label}</h3>
              </div>
              <p className="text-[var(--wine)] text-lg sm:text-2xl font-bold">
                {selectedData[field.key] != null ? field.format(selectedData[field.key] as number) : 'N/A'}
              </p>
              <p className="text-[var(--olive-green)] text-xs sm:text-sm mt-1">Year: {selectedYear}</p>
            </div>
          ))}
          <div
            className="bg-gradient-to-br from-[var(--white)] to-[var(--green)]/50 p-4 sm:p-6 rounded-lg shadow-md border border-[var(--medium-green)]/20 hover:shadow-lg hover:scale-105 transform transition-all duration-300 border border-[var(--medium-green)]/20 min-w-0"
            aria-label="Methodology Notes"
          >
            <div className="flex items-center gap-3 mb-2">
              <FaFileAlt className="text-[var(--olive-green)] text-lg" />
              <h3 className="text-[var(--dark-green)] font-semibold text-sm sm:text-base leading-tight">Methodology Notes</h3>
            </div>
            <p className="text-[var(--dark-green)] text-sm sm:text-base max-h-48 overflow-y-auto">
              {renderMethodologyNotes()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-full">
          <div className="bg-[var(--white)] p-3 sm:p-4 rounded-lg shadow min-w-0 overflow-x-hidden" aria-label="Data Quality Trends Chart">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              Data Quality Trends (2006–{selectedYear})
            </h2>
            <ResponsiveContainer width="100%" height={400} className="sm:h-[250px]">
              <LineChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  interval="preserveStartEnd"
                  height={50}
                  className="sm:text-[12px] sm:angle-0 sm:text-anchor-middle"
                />
                <YAxis fontSize={10} className="sm:text-[12px]" />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                  className="hidden sm:block"
                />
                <Line
                  type="monotone"
                  dataKey="nutrition_data_quality_index"
                  stroke="var(--olive-green)"
                  name="Nutrition Data Quality Index"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[var(--white)] p-3 sm:p-4 rounded-lg shadow min-w-0 overflow-x-hidden" aria-label="Year Comparison Chart">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--dark-green)] mb-2">
              Year Comparison ({(country as string).charAt(0).toUpperCase() + (country as string).slice(1)})
            </h2>
            <label htmlFor="metric-select" className="sr-only">
              Select Metric for Year Comparison
            </label>
            <select
              id="metric-select"
              value="nutrition_data_quality_index"
              disabled
              className="mb-2 p-2 border border-[var(--medium-green)] text-[var(--medium-green)] rounded text-sm sm:text-base w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-[var(--olive-green)] opacity-50 cursor-not-allowed"
            >
              <option value="nutrition_data_quality_index">Nutrition Data Quality Index</option>
            </select>
            <ResponsiveContainer width="100%" height={400} className="sm:h-[250px]">
              <BarChart data={countryData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }} barGap={2} barCategoryGap="10%">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  interval="preserveStartEnd"
                  height={50}
                  className="sm:text-[12px] sm:angle-0 sm:text-anchor-middle"
                />
                <YAxis fontSize={10} className="sm:text-[12px]" />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="nutrition_data_quality_index" fill="var(--olive-green)" minPointSize={5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
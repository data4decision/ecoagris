'use client';

// ADD THIS LINE — prevents prerendering
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { read, utils } from 'xlsx';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
} from 'lucide-react';

interface ParsedRow {
  [key: string]: unknown;
}
interface SheetData {
  name: string;
  data: ParsedRow[];
  valid: boolean;
  errors: string[];
  allowed: boolean;
}

// Expected response from /api/admin/upload-data
interface UploadResult {
  sheet: string;
  status: 'success' | 'skipped';
  rows?: number;
  file?: string;
  reason?: string;
}

// Allowed sheets
const ALLOWED_SHEETS = new Set([
  'Agric input',
  'Rice',
  'Nutrition',
  'Macroeconomics indices',
  'Livestock',
]);

export default function DataUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Protect route
  useEffect(() => {
    const auth = localStorage.getItem('admin-auth');
    if (!auth) router.push('/admin/login');
  }, [router]);

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setFile(f);
      parseExcel(f);
    } else {
      toast.error('Please upload a valid .xlsx file');
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      parseExcel(f);
    }
  };

  // Parse Excel
  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = read(data, { type: 'array' });
      const parsedSheets: SheetData[] = [];

      workbook.SheetNames.forEach((sheetName) => {
        const ws = workbook.Sheets[sheetName];
        const rows: ParsedRow[] = utils.sheet_to_json(ws, { defval: '' });

        const allowed = ALLOWED_SHEETS.has(sheetName);

        if (!allowed) {
          parsedSheets.push({
            name: sheetName,
            data: [],
            valid: false,
            errors: ['Not an allowed dataset (will be skipped)'],
            allowed: false,
          });
          return;
        }

        if (rows.length === 0) {
          parsedSheets.push({
            name: sheetName,
            data: [],
            valid: false,
            errors: ['Empty sheet'],
            allowed: true,
          });
          return;
        }

        const { validRows, errors } = validateSheet(sheetName, rows);
        parsedSheets.push({
          name: sheetName,
          data: validRows,
          valid: errors.length === 0,
          errors,
          allowed: true,
        });
      });

      setSheets(parsedSheets);
    };
    reader.readAsArrayBuffer(file);
  };

  // Validation
  const validateSheet = (sheetName: string, rows: ParsedRow[]) => {
    const errors: string[] = [];
    const validRows: ParsedRow[] = [];

    const required = ['state', 'lga', 'year'];
    if (sheetName === 'Rice' || sheetName === 'Agric input') {
      required.push('yield_kg', 'area_ha');
    }

    rows.forEach((row, idx) => {
      const rowErr: string[] = [];

      required.forEach((f) => {
        if (!row[f] || row[f] === '') {
          rowErr.push(`Row ${idx + 2}: Missing ${f}`);
        }
      });

      ['yield_kg', 'area_ha', 'price_per_kg', 'gdp', 'inflation'].forEach((f) => {
        if (row[f] && isNaN(Number(row[f]))) {
          rowErr.push(`Row ${idx + 2}: ${f} must be a number`);
        }
      });

      if (rowErr.length === 0) {
        validRows.push({
          ...row,
          yield_kg: Number(row['yield_kg']) || 0,
          area_ha: Number(row['area_ha']) || 0,
          price_per_kg: Number(row['price_per_kg']) || 0,
          uploadedAt: new Date().toISOString(),
          uploadedBy: JSON.parse(localStorage.getItem('admin-auth') || '{}').email,
        });
      } else {
        errors.push(...rowErr);
      }
    });

    return { validRows, errors };
  };

  // Upload
  const uploadData = async () => {
    if (!file) return;

    const validSheets = sheets.filter((s) => s.allowed && s.valid && s.data.length > 0);
    if (validSheets.length === 0) {
      toast.error('No valid data to upload');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    const form = new FormData();
    form.append('sheets', JSON.stringify(validSheets));

    try {
      const res = await fetch('/api/admin/upload-data', {
        method: 'POST',
        body: form,
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Upload failed');

      const total = validSheets.reduce((a, s) => a + s.data.length, 0);
      let uploaded = 0;

      (json.results as UploadResult[]).forEach((r) => {
        if (r.status === 'success' && r.rows !== undefined) {
          uploaded += r.rows;
          setProgress((uploaded / total) * 100);
          toast.success(`${r.sheet} → ${r.rows} rows`);
        } else if (r.status === 'skipped') {
          toast(`${r.sheet}: ${r.reason}`, { icon: 'Warning' });
        }
      });

      toast.success('Upload complete! Redirecting...');
      setTimeout(() => {
        window.location.href = '/admin';
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Upload</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="w-4 h-4" />
            Only 5 datasets allowed
          </div>
        </div>

        {/* Drag Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <FileSpreadsheet className="w-8 h-8" />
              <span className="text-lg font-medium">{file.name}</span>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg text-gray-600 mb-2">Drop Excel file here</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Browse Files
              </button>
            </>
          )}
        </div>

        {/* Sheets */}
        {file && sheets.length > 0 && (
          <div className="mt-8 space-y-6">
            {sheets.map((s) => (
              <div
                key={s.name}
                className={`border rounded-lg p-4 ${
                  !s.allowed
                    ? 'border-yellow-200 bg-yellow-50'
                    : s.valid
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {!s.allowed ? (
                      <Info className="w-5 h-5 text-yellow-600" />
                    ) : s.valid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    {s.name} ({s.data.length} rows)
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      !s.allowed
                        ? 'bg-yellow-200 text-yellow-800'
                        : s.valid
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                    }`}
                  >
                    {!s.allowed ? 'Skipped' : s.valid ? 'Valid' : 'Invalid'}
                  </span>
                </div>

                {s.errors.length > 0 && (
                  <div className="text-sm text-red-700 mb-3">
                    <ul className="list-disc list-inside mt-1 max-h-32 overflow-y-auto">
                      {s.errors.slice(0, 5).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                      {s.errors.length > 5 && <li>... {s.errors.length - 5} more</li>}
                    </ul>
                  </div>
                )}

                {s.allowed && s.valid && s.data.length > 0 && (
                  <div className="overflow-x-auto text-xs">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-100">
                          {Object.keys(s.data[0]).map((k) => (
                            <th key={k} className="px-3 py-2 text-left font-medium">
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.data.slice(0, 3).map((r, i) => (
                          <tr key={i} className="border-t">
                            {Object.values(r).map((v, j) => (
                              <td key={j} className="px-3 py-2">
                                {String(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {s.data.length > 3 && (
                          <tr>
                            <td
                              colSpan={Object.keys(s.data[0]).length}
                              className="text-center py-2 text-gray-500"
                            >
                              ... and {s.data.length - 3} more
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            {/* Upload Button */}
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                {isUploading && (
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
              <button
                onClick={uploadData}
                disabled={isUploading || sheets.filter(s => s.allowed).every(s => !s.valid)}
                className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition ${
                  isUploading || sheets.filter(s => s.allowed).every(s => !s.valid)
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {Math.round(progress)}%
                  </>
                ) : (
                  'Upload Data'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
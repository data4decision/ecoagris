import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

// Function to read and parse both Excel files from the server-side
export const loadExcelData = () => {
  const inputFilePath = path.resolve('data', 'APMD_ECOWAS_Input_Simulated_2006_2025.xlsx');
  const livestockFilePath = path.resolve('data', 'APMD_ECOWAS_Livestock_Simulated_2006_2025.xlsx');

  // Read the files
  const inputFile = fs.readFileSync(inputFilePath);
  const livestockFile = fs.readFileSync(livestockFilePath);

  // Parse the files into workbooks
  const inputWorkbook = XLSX.read(inputFile, { type: 'buffer' });
  const livestockWorkbook = XLSX.read(livestockFile, { type: 'buffer' });

  // Get the sheet names and parse the data from both files
  const inputSheetName = inputWorkbook.SheetNames[0]; // Assume first sheet
  const livestockSheetName = livestockWorkbook.SheetNames[0]; // Assume first sheet

  const inputSheet = inputWorkbook.Sheets[inputSheetName];
  const livestockSheet = livestockWorkbook.Sheets[livestockSheetName];

  // Parse the sheets into JSON
  const inputData = XLSX.utils.sheet_to_json(inputSheet);
  const livestockData = XLSX.utils.sheet_to_json(livestockSheet);

  // Log data to inspect
  console.log('Input Data:', inputData);
  console.log('Livestock Data:', livestockData);

  return { inputData, livestockData };
};

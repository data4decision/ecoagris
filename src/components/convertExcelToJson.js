const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// Path to your Excel file
const inputFilePath = path.resolve(__dirname, "../data/APMD_ECOWAS_Input_Simulated_2006_2025.xlsx");
const livestockFilePath = path.resolve(__dirname, "../data/APMD_ECOWAS_Livestock_Simulated_2006_2025.xlsx");

// Function to convert Excel file to JSON
const convertExcelToJson = (filePath) => {
  // Read the Excel file
  const workbook = XLSX.readFile(filePath);
  
  // Assuming the first sheet contains the data
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert the sheet data to JSON
  const jsonData = XLSX.utils.sheet_to_json(sheet);
  
  return jsonData;
};

// Convert both Excel files to JSON
const inputData = convertExcelToJson(inputFilePath);
const livestockData = convertExcelToJson(livestockFilePath);

// Write the data to JSON files
fs.writeFileSync(path.resolve(__dirname, "../data/inputData.json"), JSON.stringify(inputData, null, 2));
fs.writeFileSync(path.resolve(__dirname, "../data/livestockData.json"), JSON.stringify(livestockData, null, 2));

console.log("Excel files have been successfully converted to JSON!");

// app/api/admin/upload-data/route.ts
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

// Exact mapping: Sheet name → relative path (no leading /)
const SHEET_TO_FILE: Record<string, string> = {
  'Agric input': 'agric/APMD_ECOWAS_Input_Simulated_2006_2025.json',
  Rice: 'rice/ecowas_rice_production_2005_2024_simulated.json',
  Nutrition: 'nutrition/WestAfrica_Nutrition_Simulated_Expanded_2006_2025.json',
  'Macroeconomics indices': 'macro/WestAfrica_Macro_Simulated_2006_2025.json',
  Livestock: 'livestock/APMD_ECOWAS_Livestock_Simulated_2006_2025.json',
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const sheets = JSON.parse(formData.get('sheets') as string) as Array<{
      name: string;
      data: unknown[];
    }>;

    await mkdir(DATA_DIR, { recursive: true });

    const results = [];

    for (const sheet of sheets) {
      const filePath = SHEET_TO_FILE[sheet.name];
      if (!filePath) {
        results.push({
          sheet: sheet.name,
          status: 'skipped',
          reason: 'Not in allowed datasets',
        });
        continue;
      }

      const fullPath = path.join(DATA_DIR, filePath);
      await mkdir(path.dirname(fullPath), { recursive: true });

      await writeFile(fullPath, JSON.stringify(sheet.data, null, 2), 'utf-8');
      results.push({
        sheet: sheet.name,
        status: 'success',
        rows: sheet.data.length,
        file: filePath,
      });
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    console.error(err);
    // FIX: Cast 'err' to Error to access .message safely
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
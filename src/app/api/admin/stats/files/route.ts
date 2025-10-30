import { readdir, stat } from 'fs/promises';
import path from 'path';

export async function GET() {
  const dataDir = path.join(process.cwd(), 'public', 'data');
  try {
    const files = await readdir(dataDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const stats = await Promise.all(
      jsonFiles.map(async (f) => {
        const s = await stat(path.join(dataDir, f));
        return { name: f, mtime: s.mtime };
      })
    );

    const lastModified = stats.length > 0 
      ? stats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0].mtime.toISOString()
      : null;

    return Response.json({ count: jsonFiles.length, lastModified });
  } catch (error) {
    return Response.json({ count: 0, lastModified: null });
  }
}
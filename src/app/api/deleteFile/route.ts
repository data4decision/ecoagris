// src/app/api/deleteFile/route.ts
import { NextResponse } from 'next/server';
import { adminFirestore } from '@/app/lib/firebaseAdmin';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config (safe in server context)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const db = adminFirestore;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    // Type-safe public_id extraction
    if (
      typeof body !== 'object' ||
      body === null ||
      !('public_id' in body) ||
      typeof (body as any).public_id !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Invalid or missing public_id' },
        { status: 400 }
      );
    }

    const public_id = (body as { public_id: string }).public_id;

    // Delete from Firestore
    await db.collection('uploads').doc(public_id).delete();

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);

    if (!['ok', 'not found'].includes(result.result)) {
      throw new Error(`Cloudinary error: ${result.result}`);
    }

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Delete file error:', error);

    return NextResponse.json(
      { error: 'Failed to delete file', details: message },
      { status: 500 }
    );
  }
}
// app/api/deleteFile/route.ts
import { NextResponse } from 'next/server';
import { adminFirestore } from '@/app/lib/firebaseAdmin';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const db = adminFirestore;

interface DeleteRequestBody {
  public_id: string;
  doc_id: string; // ← We now require the real Firestore doc ID
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    if (
      typeof body !== 'object' ||
      body === null ||
      !('public_id' in body) ||
      !('doc_id' in body) ||
      typeof body.public_id !== 'string' ||
      typeof body.doc_id !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Invalid request: public_id and doc_id are required' },
        { status: 400 }
      );
    }

    const { public_id, doc_id } = body as DeleteRequestBody;

    // 1. Delete from Cloudinary
    const cloudinaryResult = await cloudinary.uploader.destroy(public_id);

    if (!['ok', 'not found'].includes(cloudinaryResult.result)) {
      throw new Error(`Cloudinary delete failed: ${cloudinaryResult.result}`);
    }

    // 2. Delete from Firestore using the REAL doc ID
    await db.collection('uploads').doc(doc_id).delete();

    return NextResponse.json({ 
      message: 'File deleted permanently from Cloudinary and database' 
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file', details: message },
      { status: 500 }
    );
  }
}
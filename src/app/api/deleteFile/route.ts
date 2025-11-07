import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { v2 as cloudinary } from 'cloudinary';

// Initialize Firebase Admin SDK if not already initialized
if (!getFirestore()) {
  initializeApp({
    credential: applicationDefault(), // or use your service account key
  });
}

const db = getFirestore();

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const { public_id } = await request.json();  // Get the public_id from the request body

    if (!public_id) {
      return NextResponse.json({ error: 'No public_id provided' }, { status: 400 });
    }

    // Delete the file from Firestore
    const fileRef = db.collection('uploads').doc(public_id);
    await fileRef.delete();

    // Delete the file from Cloudinary
    await cloudinary.uploader.destroy(public_id);

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}

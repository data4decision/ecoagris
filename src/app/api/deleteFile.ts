import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { deleteFileFromCloudinary } from '../../lib/cloudinary';  // Make sure to implement Cloudinary delete logic

// Initialize Firebase Admin SDK if not already initialized
if (!getFirestore()) {
  initializeApp({
    credential: applicationDefault(),  // or provide your service account credentials
  });
}

const db = getFirestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ error: 'No public_id provided' });
    }

    try {
      // Delete from Firestore
      const fileRef = db.collection('uploads').doc(public_id);
      await fileRef.delete();

      // Delete from Cloudinary (implement this in your cloudinary utility)
      await deleteFileFromCloudinary(public_id);

      return res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file:', error);
      return res.status(500).json({ error: 'Failed to delete file' });
    }
  } else {
    // Only POST method is allowed
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}

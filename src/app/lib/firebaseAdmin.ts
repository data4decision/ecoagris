// src/app/lib/firebaseAdmin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app;

if (!getApps().length) {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!json) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT is missing. Add it to Vercel Environment Variables (and .env.local for local dev).'
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(json);
  } catch (error) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT is invalid JSON. Must be a one-line JSON string. Validate at https://jsonlint.com'
    );
  }

  try {
    app = initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw new Error('Firebase Admin initialization failed. Check service account JSON.');
  }
} else {
  app = getApps()[0];
}

// Export auth and firestore
export const adminAuth = getAuth(app);
export const adminFirestore = getFirestore(app);
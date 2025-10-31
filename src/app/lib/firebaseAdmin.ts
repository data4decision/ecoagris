// src/app/lib/firebaseAdmin.ts
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App | undefined;

// Reuse existing app if already initialized
if (!getApps().length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT is missing. Add it to Vercel Environment Variables (and .env.local for local dev).'
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
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

// Export typed Admin SDK instances
export const adminAuth: Auth = getAuth(app);
export const adminFirestore: Firestore = getFirestore(app);
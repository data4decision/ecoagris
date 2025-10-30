
// import { initializeApp, cert, getApps } from 'firebase-admin/app';
// import { getAuth } from 'firebase-admin/auth';
// import { getFirestore } from 'firebase-admin/firestore'; // ← Add this

// if (!getApps().length) {
//   const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
//     ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
//     : null;

//   if (!serviceAccount) {
//     throw new Error('FIREBASE_SERVICE_ACCOUNT is missing or invalid in .env.local');
//   }

//   initializeApp({
//     credential: cert(serviceAccount),
//   });
// }

// export const adminAuth = getAuth();
// export const adminFirestore = getFirestore(); // ← Export this



// src/app/lib/firebaseAdmin.ts
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App | undefined;

// Reuse existing app if already initialized
if (!getApps().length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is missing. Add it to your environment variables.'
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (error) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY is invalid JSON. Check your environment variable.'
    );
  }

  app = initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  app = getApps()[0];
}

// Export typed Admin SDK instances
export const adminAuth: Auth = getAuth(app);
export const adminFirestore: Firestore = getFirestore(app);
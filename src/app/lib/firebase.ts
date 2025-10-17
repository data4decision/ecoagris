// src/firebase/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// ✅ Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBH8bdxFjN1G1SquG2-_ZXwpQGEiRB11Fs",
  authDomain: "ecoagris.firebaseapp.com",
  projectId: "ecoagris",
  storageBucket: "ecoagris.firebasestorage.app",
  messagingSenderId: "696938204379",
  appId: "1:696938204379:web:0c91d5de9690d04a9690fe",
  measurementId: "G-760ND6PT9P",
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// ✅ Initialize Analytics (optional, only in browser)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics };

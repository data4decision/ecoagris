// src/app/admin/admin-dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { auth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminDashboard() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = '/admin/login';
        return;
      }

      try {
        const idToken = await user.getIdToken();
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        if (payload.email !== 'admin@ecoagris.org') {
          auth.signOut();
          window.location.href = '/admin/login';
        }
      } catch {
        window.location.href = '/admin/login';
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Welcome, Admin!</h1>
      <p className="mt-4">You are logged in.</p>
      <button
        onClick={() => auth.signOut().then(() => window.location.href = '/admin/login')}
        className="mt-6 px-4 py-2 bg-red-600 text-white rounded"
      >
        Logout
      </button>
    </div>
  );
}
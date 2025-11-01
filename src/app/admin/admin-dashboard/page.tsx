// src/app/admin/admin-dashboard/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import { auth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/admin/login');
        return;
      }

      try {
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims.email !== 'admin@ecoagris.org') {
          await auth.signOut();
          router.replace('/admin/login');
        }
      } catch {
        await auth.signOut();
        router.replace('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Welcome, Admin!</h1>
      <p className="mt-4">You are logged in via Firebase.</p>
      <button
        onClick={() => auth.signOut().then(() => router.push('/admin/login'))}
        className="mt-6 px-4 py-2 bg-red-600 text-white rounded"
      >
        Logout
      </button>
    </div>
  );
}
// src/components/AdminGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const isAdmin = localStorage.getItem('admin-auth') === 'true';
    if (!isAdmin) {
      router.replace('/admin/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin-auth');
    router.push('/admin/login');
  };

//   // Only show logout if user is logged in
//   if (localStorage.getItem('admin-auth') !== 'true') {
//     return null; // Redirecting...
//   }

  return (
    <>
      {/* Add Logout Button at Top-Right */}
      <div className="fixed top-4 right-4 z-50">
        {/* <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition"
        >
          Logout
        </button> */}
      </div>

      {/* Your real dashboard content */}
      {children}
    </>
  );
}
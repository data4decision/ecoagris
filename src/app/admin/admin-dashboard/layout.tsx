// src/app/admin/layout.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import Image from 'next/image';
import Link from 'next/link';
import { FaCaretDown, FaCog, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { auth } from '@/app/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface AdminUser {
  firstName?: string;
  email?: string;
  role?: string;
}

/* ------------------------------------------------------------------ */
/*  Admin Layout – client component                                   */
/* ------------------------------------------------------------------ */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  /* -------------------------------------------------------------- */
  /*  1. Fetch admin profile from Firestore                         */
  /* -------------------------------------------------------------- */
  const fetchAdmin = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'admins', uid));
      if (snap.exists()) {
        setAdminUser(snap.data() as AdminUser);
      } else {
        console.warn('Admin doc not found');
        setAdminUser(null);
      }
    } catch (err) {
      console.error('fetchAdmin error', err);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------- */
  /*  2. Firebase auth listener – redirect if not signed in       */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchAdmin(user.uid);
      } else {
        setAdminUser(null);
        setLoading(false);
        router.replace('/admin/login');
      }
    });
    return () => unsub();
  }, [router]);

  /* -------------------------------------------------------------- */
  /*  3. Mobile detection & auto-collapse                           */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    const onResize = () => {
      const isMobile = window.innerWidth < 1024;
      setMobile(isMobile);
      setCollapsed(isMobile);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* -------------------------------------------------------------- */
  /*  4. Close dropdown on outside click                           */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* -------------------------------------------------------------- */
  /*  5. Logout – clear Firebase + http-only cookie (client side) */
  /* -------------------------------------------------------------- */
  const logout = async () => {
    try {
      await auth.signOut();
      // Clear the http-only cookie by expiring it
      document.cookie = 'admin-token=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      router.replace('/admin/login');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  /* -------------------------------------------------------------- */
  /*  Render                                                       */
  /* -------------------------------------------------------------- */
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <AdminSidebar onCollapseChange={setCollapsed} />

      {/* Main panel */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 overflow-x-hidden ${
          collapsed ? 'lg:ml-13' : 'lg:ml-44'
        } text-[var(--dark-green)] min-w-0`}
      >
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--wine)] bg-[var(--dark-green)] shadow-sm">
          <h1 className="text-xl font-semibold text-[var(--white)]">
            {loading ? 'Loading…' : adminUser?.firstName ?? 'Admin'}
          </h1>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 hover:bg-[var(--wine)]/70 p-2 rounded-md transition-colors"
                aria-label="Admin profile"
              >
                <div className="h-9 w-9 rounded-full bg-[var(--yellow)] overflow-hidden border-2 border-white shadow">
                  <Image
                    src="/user.png"
                    width={36}
                    height={36}
                    alt="Admin avatar"
                    className="object-cover"
                  />
                </div>

                {!mobile && (
                  <span className="text-sm font-medium text-[var(--white)]">
                    {loading ? 'Loading…' : adminUser?.firstName ?? 'Admin'}
                  </span>
                )}

                <FaCaretDown
                  className={`transition-transform text-sm ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                  <div className="p-4 border-b">
                    <p className="font-semibold text-[var(--dark-green)]">
                      {loading ? 'Loading…' : adminUser?.firstName ?? 'Admin'}
                    </p>
                    <p className="text-sm text-[var(--olive-green)]">
                      {loading ? 'Loading…' : adminUser?.email ?? 'admin@ecoagris.org'}
                    </p>
                  </div>

                  <ul className="py-1">
                    <li>
                      <Link
                        href="/admin/profile"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--light-green)] transition-colors text-sm"
                      >
                        <FaUser className="text-[var(--olive-green)]" />
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--light-green)] transition-colors text-sm"
                      >
                        <FaCog className="text-[var(--olive-green)]" />
                        Settings
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 transition-colors text-sm text-left"
                      >
                        <FaSignOutAlt />
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
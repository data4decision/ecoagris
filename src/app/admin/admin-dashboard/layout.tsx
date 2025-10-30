'use client';

import React, { useState, useRef, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import Image from 'next/image';
import Link from 'next/link';
import { FaCaretDown, FaCog, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { auth } from '@/app/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase'; // or your firebase.ts
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface AdminUser {
  firstName?: string;
  email?: string;
  role?: string;
}

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSideBarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch admin user from Firestore (admins collection)
  const fetchAdminData = async () => {
    try {
      if (!auth.currentUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const adminDoc = doc(db, 'admins', auth.currentUser.uid);
      const snapshot = await getDoc(adminDoc);

      if (snapshot.exists()) {
        setUser(snapshot.data() as AdminUser);
      } else {
        console.log('Admin not found');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching admin:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        fetchAdminData();
      } else {
        setUser(null);
        setIsLoading(false);
        router.push('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Mobile detection + auto-collapse
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarCollapsed(mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Logout: clear Firebase + cookie
  const handleLogout = async () => {
    try {
      await auth.signOut();
      document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar onCollapseChange={setIsSidebarCollapsed} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 overflow-x-hidden ${
          isSideBarCollapsed ? 'lg:ml-13' : 'lg:ml-44'
        } text-[var(--white)] min-w-0`}
      >
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--yellow)] bg-[var(--medium-green)] text-[var(--white)] shadow-sm w-full">
          <h1 className="text-lg font-semibold sm:ml-0 ml-10">
            {isLoading ? 'Loading...' : user?.firstName || 'Admin'}
          </h1>

          <LanguageSwitcher />

          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 hover:bg-[var(--wine)]/90 p-2 rounded-md transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Admin Profile"
            >
              <div className="h-8 w-8 rounded-full bg-[var(--white)] overflow-hidden">
                <Image src="/user.png" width={32} height={32} alt="Admin avatar" />
              </div>
              {!isMobile && (
                <span className="text-sm font-medium">
                  {isLoading ? 'Loading...' : user?.firstName || 'Admin'}
                </span>
              )}
              <FaCaretDown
                className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--white)] text-[var(--medium-green)] rounded-md shadow-lg z-50">
                <div className="p-3 border-b">
                  <p className="font-semibold">
                    {isLoading ? 'Loading...' : user?.firstName || 'Admin'}
                  </p>
                  <p className="text-sm text-[var(--green)]">
                    {isLoading ? 'Loading...' : user?.email || 'admin@ecoagris.org'}
                  </p>
                </div>
                <ul className="py-1">
                  <li>
                    <Link
                      href="/admin/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/90"
                    >
                      <FaUser />
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/dashboard/settings"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/90"
                    >
                      <FaCog />
                      Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/90 text-left"
                    >
                      <FaSignOutAlt />
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 ml-10 sm:ml-0 p-6 w-full overflow-x-hidden bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
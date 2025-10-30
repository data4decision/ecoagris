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

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSideBarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch admin user from Firestore
  const fetchAdminData = async () => {
    try {
      if (!auth.currentUser) {
        setUser(null);
        return;
      }

      const adminDoc = doc(db, 'admins', auth.currentUser.uid);
      const snapshot = await getDoc(adminDoc);

      if (snapshot.exists()) {
        setUser(snapshot.data() as AdminUser);
      } else {
        console.log('Admin not found in Firestore');
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

  // Logout: clear Firebase + session cookie
  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Clear session cookie
      document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar onCollapseChange={setIsSidebarCollapsed} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 overflow-x-hidden ${
          isSideBarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        } text-[var(--dark-green)] min-w-0`}
      >
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--yellow)] bg-white shadow-sm w-full">
          <h1 className="text-xl font-semibold">
            {isLoading ? 'Loading...' : user?.firstName || 'Admin'}
          </h1>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label="Admin Profile"
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
                {!isMobile && (
                  <span className="text-sm font-medium">
                    {isLoading ? 'Loading...' : user?.firstName || 'Admin'}
                  </span>
                )}
                <FaCaretDown
                  className={`transition-transform text-sm ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                  <div className="p-4 border-b">
                    <p className="font-semibold text-[var(--dark-green)]">
                      {isLoading ? 'Loading...' : user?.firstName || 'Admin'}
                    </p>
                    <p className="text-sm text-[var(--olive-green)]">
                      {isLoading ? 'Loading...' : user?.email || 'admin@ecoagris.org'}
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
                        onClick={handleLogout}
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

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-x-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
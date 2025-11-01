'use client';

import React, { useState, useRef, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import Image from 'next/image';
import Link from 'next/link';
import { FaCaretDown, FaCog, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { auth, db } from '@/app/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
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

  // Fetch admin data from Firestore
  const fetchAdminData = async (uid: string) => {
    try {
      const adminDoc = doc(db, 'admins', uid);
      const snapshot = await getDoc(adminDoc);

      if (snapshot.exists()) {
        const data = snapshot.data() as AdminUser;
        setUser(data);
      } else {
        console.log('Admin document not found');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const idTokenResult = await currentUser.getIdTokenResult();
          const email = idTokenResult.claims.email as string;

          if (email === 'admin@ecoagris.org') {
            // Valid admin → fetch Firestore data
            await fetchAdminData(currentUser.uid);
          } else {
            // Not admin → force logout
            await auth.signOut();
            router.replace('/admin/login');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          await auth.signOut();
          router.replace('/admin/login');
        }
      } else {
        // No user → redirect to login
        setUser(null);
        setIsLoading(false);
        router.replace('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Mobile detection
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

  // Logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Clear any session cookie
      document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      router.replace('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar onCollapseChange={setIsSidebarCollapsed} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 overflow-x-hidden ${
          isSideBarCollapsed ? 'lg:ml-13' : 'lg:ml-44'
        } min-w-0`}
      >
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--yellow)] bg-[var(--medium-green)] text-white shadow-sm">
          <h1 className="text-lg font-semibold">
            {isLoading ? 'Loading...' : user?.firstName || 'Admin'}
          </h1>

          <LanguageSwitcher />

          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 hover:bg-[var(--wine)]/90 p-2 rounded-md transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Admin Profile"
            >
              <div className="h-8 w-8 rounded-full bg-white overflow-hidden border-2 border-white">
                <Image
                  src="/user.png"
                  width={32}
                  height={32}
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
                className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-[var(--medium-green)] rounded-md shadow-lg z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-200">
                  <p className="font-semibold text-sm">
                    {isLoading ? 'Loading...' : user?.firstName || 'Admin'}
                  </p>
                  <p className="text-xs text-[var(--green)] truncate">
                    {isLoading ? 'Loading...' : user?.email || 'admin@ecoagris.org'}
                  </p>
                </div>
                <ul className="py-1">
                  <li>
                    <Link
                      href="/admin/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/10 text-sm"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FaUser />
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/dashboard/settings"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/10 text-sm"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FaCog />
                      Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/10 text-left text-sm text-red-600"
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
        <main className="flex-1 p-6 bg-slate-50 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--medium-green)]"></div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
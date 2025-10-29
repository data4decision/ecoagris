'use client';

import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './NutritionSidebar';
import Image from 'next/image';
import Link from 'next/link';
import { FaCaretDown, FaCog, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { db, auth } from '@/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

interface User {
  firstName?: string;
  email?: string;
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isSideBarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useTranslation('common'); // Only common.json

  // -----------------------------------------------------------------
  // Fetch user data from Firebase
  // -----------------------------------------------------------------
  const fetchUserData = async () => {
    try {
      if (!auth.currentUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        setUser(userSnapshot.data() as User);
      } else {
        console.log('No such document!');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------------------
  // Auth state listener
  // -----------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        fetchUserData();
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // -----------------------------------------------------------------
  // Mobile detection & sidebar collapse
  // -----------------------------------------------------------------
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

  // -----------------------------------------------------------------
  // Close dropdown on outside click
  // -----------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // -----------------------------------------------------------------
  // Logout
  // -----------------------------------------------------------------
  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <div className="flex min-h-screen">
      <Sidebar onCollapseChange={setIsSidebarCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 overflow-x-hidden ${
          isSideBarCollapsed ? 'lg:ml-13' : 'lg:ml-44'
        } text-[var(--white)] min-w-0`}
      >
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--yellow)] bg-[var(--medium-green)] text-[var(--white)] shadow-sm w-full">
          <h1 className="text-lg font-semibold sm:ml-0 ml-10">
            {isLoading ? t('layout.loading') : user?.firstName || t('layout.user')}
          </h1>

          <LanguageSwitcher />

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 hover:bg-[var(--wine)]/90 p-2 rounded-md transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label={t('layout.aria.profile')}
            >
              <div className="h-8 w-8 rounded-full bg-[var(--white)] overflow-hidden">
                <Image src="/user.png" width={32} height={32} alt={t('layout.avatar.alt')} />
              </div>
              {!isMobile && (
                <span className="text-sm font-medium">
                  {isLoading ? t('layout.loading') : user?.firstName || t('layout.username')}
                </span>
              )}
              <FaCaretDown className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--white)] text-[var(--medium-green)] rounded-md shadow-lg z-50">
                <div className="p-3 border-b">
                  <p className="font-semibold">
                    {isLoading ? t('layout.loading') : user?.firstName || t('layout.user')}
                  </p>
                  <p className="text-sm text-[var(--green)]">
                    {isLoading ? t('layout.loading') : user?.email || t('layout.noEmail')}
                  </p>
                </div>
                <ul className="py-1">
                  <li>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/90"
                    >
                      <FaUser />
                      {t('layout.profile')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/90"
                    >
                      <FaCog />
                      {t('layout.settings')}
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/90 text-left"
                    >
                      <FaSignOutAlt />
                      {t('layout.logout')}
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 ml-10 sm:ml-0 p-6 w-full overflow-x-hidden bg-[var(--white)] text-[var(--dark-green)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
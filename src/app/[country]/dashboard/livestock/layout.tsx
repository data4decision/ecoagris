'use client';

import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import Image from 'next/image';
import Link from 'next/link';
import { FaCaretDown, FaCog, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { db, auth } from '@/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from 'next-i18next';

interface User {
  firstName?: string;
  email?: string;
}

const LivestockLayout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation('common'); // Only common.json
  const [isSideBarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchUserData = async () => {
    try {
      if (!auth.currentUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      const userSnapshot = await getDoc(userDoc);
      setUser(userSnapshot.exists() ? (userSnapshot.data() as User) : null);
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar onCollapseChange={setIsSidebarCollapsed} />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSideBarCollapsed ? 'lg:ml-13' : 'lg:ml-44'} text-[var(--white)] min-w-0`}>
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--yellow)] bg-[var(--medium-green)] text-[var(--white)] shadow-sm w-full">
          <h1 className="text-lg font-semibold sm:ml-0 ml-10">
            {isLoading ? t('layout.loading') : user?.firstName ? t('layout.greeting', { name: user.firstName }) : t('layout.user')}
          </h1>

          <LanguageSwitcher />

          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 hover:bg-[var(--wine)]/90 p-2 rounded-md transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label={t('layout.profile')}
            >
              <div className="h-8 w-8 rounded-full bg-[var(--white)] overflow-hidden">
                <Image src="/user.png" width={32} height={32} alt={t('layout.user')} />
              </div>
              {!isMobile && (
                <span className="text-sm font-medium">
                  {isLoading ? t('layout.loading') : user?.firstName || t('layout.username')}
                </span>
              )}
              <FaCaretDown className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--white)] text-[var(--medium-green)] rounded-md shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <p className="font-semibold">{isLoading ? t('layout.loading') : user?.firstName || t('layout.user')}</p>
                  <p className="text-sm text-[var(--green)]">{isLoading ? t('layout.loading') : user?.email || t('layout.noEmail')}</p>
                </div>
                <ul className="py-1">
                  <li>
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/90 text-[var(--medium-green)]">
                      <FaUser />
                      {t('layout.profile')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/90 text-[var(--medium-green)]">
                      <FaCog />
                      {t('layout.settings')}
                    </Link>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/90 text-left text-[var(--medium-green)]">
                      <FaSignOutAlt />
                      {t('layout.logout')}
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 ml-10 sm:ml-0 p-6 w-full bg-[var(--light-gray)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default LivestockLayout;
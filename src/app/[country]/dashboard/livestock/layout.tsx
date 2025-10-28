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

  // Fetch user data from Firebase
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

  // Monitor auth state and fetch user data
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

  // Handle screen resize for mobile view
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar onCollapseChange={setIsSidebarCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSideBarCollapsed ? 'lg:ml-13' : 'lg:ml-44'
        }  text-[var(--white)] min-w-0`}
      >
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--yellow)] bg-[var(--medium-green)] text-[var(--white)] shadow-sm w-full">
          <h1 className="text-lg font-semibold sm:ml-0 ml-10 sticky">
            {isLoading ? 'Loading...' : user?.firstName || 'User'}
           
          </h1>
           <LanguageSwitcher/>
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 hover:bg-[var(--wine)]/90 p-2 rounded-md transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="User Profile"
            >
              <div className="h-8 w-8 rounded-full bg-[var(--white)] overflow-hidden">
                <Image src="/user.png" width={32} height={32} alt="User avatar" />
              </div>
              {!isMobile && (
                <span className="text-sm font-medium">
                  {isLoading ? 'Loading...' : user?.firstName || 'Username'}
                </span>
              )}
              <FaCaretDown className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--white)] text-[var(--medium-green)] rounded-md shadow-lg z-50">
                <div className="p-3 border-b">
                  <p className="font-semibold">{isLoading ? 'Loading...' : user?.firstName || 'User'}</p>
                  <p className="text-sm text-[var(--green)]">{isLoading ? 'Loading...' : user?.email || 'No email'}</p>
                </div>
                <ul className="py-1">
                  <li>
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/90">
                      <FaUser />
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--wine)]/90">
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
        <main className="flex-1 ml-10 sm:ml-0 p-6 w-full">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
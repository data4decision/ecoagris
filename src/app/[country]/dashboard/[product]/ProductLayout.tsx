'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { FaCaretDown, FaCog, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';

const ProductLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSideBarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<{ displayName: string | null; email: string | null } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const pathname = usePathname();
  const country = params.country as string;
  const product = params.product as string;
  const router = useRouter();

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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          displayName: currentUser.displayName || 'User',
          email: currentUser.email || 'No email',
        });
      } else {
        setUser(null);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('Signed out, redirecting to /login');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getHeaderTitle = () => {
    if (product) {
      return `${country.charAt(0).toUpperCase() + country.slice(1)} ${product.charAt(0).toUpperCase() + product.slice(1).replace(/-/g, ' ')} Dashboard`;
    }
    return `${country.charAt(0).toUpperCase() + country.slice(1)} Dashboard`;
  };

  return (
    <div className="flex min-h-screen bg-[var(--yellow)]">
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSideBarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        } bg-[var(--dark-green)] text-[var(--white)] min-w-0`}
      >
        <header
          className="h-16 flex items-center justify-between px-6 border-b border-[var(--yellow)] bg-[var(--dark-green)] text-[var(--white)] shadow-sm w-full"
        >
          <h1 className="text-lg font-semibold">{getHeaderTitle()}</h1>
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 hover:bg-[var(--wine)]/90 p-2 rounded-md transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="User Profile Menu"
            >
              <div className="h-8 w-8 rounded-full bg-[var(--white)] overflow-hidden">
                <Image src="/user.png" width={32} height={32} alt="user-avatar" />
              </div>
              {!isMobile && <span className="text-sm font-medium">{user?.displayName || 'User'}</span>}
              <FaCaretDown className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--white)] text-[var(--olive-green)] rounded-md shadow-lg z-50">
                <div className="p-3 border-b">
                  <p className="font-semibold">{user?.displayName || 'User'}</p>
                  <p className="text-sm text-[var(--green)]">{user?.email || 'No email'}</p>
                </div>
                <ul className="py-1">
                  <li>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--yellow)]"
                    >
                      <FaUser /> Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--yellow)]"
                    >
                      <FaCog /> Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[var(--yellow)] text-left"
                    >
                      <FaSignOutAlt /> Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-6 w-full">{children}</main>
      </div>
    </div>
  );
};

export default ProductLayout;
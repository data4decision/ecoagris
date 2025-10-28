'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname, useRouter } from 'next/navigation';
import {
  FaChartBar,
  FaLeaf,
  FaIndustry,
  FaMoneyBillWave,
  FaHeartbeat,
  FaMap,
  FaChartLine,
  FaDatabase,
  FaChevronCircleRight,
  FaChevronCircleLeft,
  FaSignOutAlt,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next'; // Correct import
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/firebase';

interface LivestockSidebarProps {
  onCollapseChange: (collapsed: boolean) => void;
}

const LivestockSidebar = ({ onCollapseChange }: LivestockSidebarProps) => {
  const { t } = useTranslation('common');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const { country } = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const nav = [
    { key: 'overview', href: `/${country}/dashboard/livestock`, icon: FaChartBar },
    { key: 'population', href: `/${country}/dashboard/livestock/population`, icon: FaLeaf },
    { key: 'production', href: `/${country}/dashboard/livestock/production`, icon: FaIndustry },
    { key: 'economic', href: `/${country}/dashboard/livestock/economic-indicators`, icon: FaMoneyBillWave },
    { key: 'health', href: `/${country}/dashboard/livestock/health-welfare`, icon: FaHeartbeat },
    { key: 'grazing', href: `/${country}/dashboard/livestock/grazing-tranhumance`, icon: FaMap },
    { key: 'forecast', href: `/${country}/dashboard/livestock/forecast-simulation`, icon: FaChartLine },
    { key: 'methodology', href: `/${country}/dashboard/livestock/data-methodology`, icon: FaDatabase },
  ];

  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      const collapsed = mobile;
      setIsCollapsed(collapsed);
      onCollapseChange(collapsed);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onCollapseChange]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      onCollapseChange(newState);
      return newState;
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[var(--dark-green)] text-[var(--white)] flex flex-col z-40 transition-all duration-300 ${
        isCollapsed ? 'w-13' : 'w-44'
      }`}
      aria-label={t('LivestockSidebar.overview')}
    >
      {/* Logo */}
      <div className="px-4 h-16 flex items-center gap-2 font-semibold border-b border-[var(--wine)]">
        <div className="h-9 w-9 grid place-items-center rounded-full font-bold bg-[var(--white)] overflow-hidden">
          <Image src="/logo.png" width={30} height={30} alt={t('layout.logoAlt') || 'ECOAGRIS LOGO'} />
        </div>
        {!isCollapsed && <span>ECOAGRIS</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="py-2">
          {nav.map(({ key, href, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm sm:text-[15px] rounded-2xl ${
                  isActive(href)
                    ? 'bg-[var(--wine)] text-[var(--white)] font-semibold shadow'
                    : 'hover:bg-[var(--yellow)]/90'
                }`}
                aria-current={isActive(href) ? 'page' : undefined}
                title={!isCollapsed ? undefined : t(`LivestockSidebar.${key}`)}
              >
                <Icon className="shrink-0 text-lg" />
                {!isCollapsed && <span>{t(`LivestockSidebar.${key}`)}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 text-left text-[var(--white)] hover:text-[var(--yellow)] hover:bg-[var(--wine)]/90 transition-colors"
        title={!isCollapsed ? undefined : t('layout.logout')}
      >
        <FaSignOutAlt className="text-lg" />
        {!isCollapsed && <span>{t('layout.logout')}</span>}
      </button>

      {/* Collapse Toggle */}
      <button
        className={`absolute top-20 ${isCollapsed ? 'left-13' : 'left-44'} -translate-x-1/2 text-[var(--white)] bg-[var(--wine)] p-2 rounded-full shadow-lg hover:bg-[var(--wine)]/80 transition-colors`}
        onClick={toggleCollapse}
        aria-label={isCollapsed ? t('layout.sidebar.expand') : t('layout.sidebar.collapse')}
        title={isCollapsed ? t('layout.sidebar.expand') : t('layout.sidebar.collapse')}
      >
        {isCollapsed ? <FaChevronCircleRight /> : <FaChevronCircleLeft />}
      </button>
    </aside>
  );
};

export default LivestockSidebar;
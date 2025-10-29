'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import {
  FaSeedling,
  FaChartLine,
  FaDollarSign,
  FaUsers,
  FaGlobe,
  FaChevronCircleRight,
  FaChevronCircleLeft,
  FaSignOutAlt,
  FaChartBar,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface MacroSidebarProps {
  onCollapseChange: (collapsed: boolean) => void;
}

const MacroSidebar = ({ onCollapseChange }: MacroSidebarProps) => {
  const { t } = useTranslation('common');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const { country } = useParams<{ country: string }>();
  const pathname = usePathname();

  const nav = [
    {
      label: t('macroSidebar.overview'),
      href: `/${country}/dashboard/macroeconomics-indices/Overview`,
      icon: FaChartBar,
    },
    {
      label: t('macroSidebar.economicOutput'),
      href: `/${country}/dashboard/macroeconomics-indices/economic-output`,
      icon: FaChartLine,
    },
    {
      label: t('macroSidebar.fiscalMonetary'),
      href: `/${country}/dashboard/macroeconomics-indices/fiscal-monetary`,
      icon: FaDollarSign,
    },
    {
      label: t('macroSidebar.laborPoverty'),
      href: `/${country}/dashboard/macroeconomics-indices/labor-poverty`,
      icon: FaUsers,
    },
    {
      label: t('macroSidebar.tradeInvestment'),
      href: `/${country}/dashboard/macroeconomics-indices/trade-investment`,
      icon: FaGlobe,
    },
    {
      label: t('macroSidebar.agriculture'),
      href: `/${country}/dashboard/macroeconomics-indices/agriculture`,
      icon: FaSeedling,
    },
  ];

  // Detect active path
  const isActive = (href: string) => pathname === href;

  // Handle screen size & auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      const shouldCollapse = mobile;
      setIsCollapsed(shouldCollapse);
      onCollapseChange(shouldCollapse);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onCollapseChange]);

  // Toggle collapse
  const toggleCollapse = () => {
    if (isMobile) return; // Prevent manual toggle on mobile
    setIsCollapsed((prev) => {
      const newState = !prev;
      onCollapseChange(newState);
      return newState;
    });
  };

  // Logout (replace with real auth later)
  const logout = () => {
    console.log('Logging out...');
    window.location.href = '/login';
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[var(--dark-green)] text-[var(--white)] flex flex-col z-40 transition-all duration-300 ${
        isCollapsed ? 'w-13' : 'w-44'
      }`}
      aria-label={t('macroSidebar.ariaLabel')}
    >
      {/* Logo & Brand */}
      <div className="px-4 h-16 flex items-center gap-2 font-semibold border-b border-[var(--wine)]">
        <div className="h-9 w-9 grid place-items-center rounded-full bg-[var(--white)] overflow-hidden">
          <Image
            src="/logo.png"
            width={30}
            height={30}
            alt={t('macroSidebar.logoAlt')}
            className="object-contain"
          />
        </div>
        {!isCollapsed && <span className="text-sm sm:text-base">{t('macroSidebar.brand')}</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2">
        <ul>
          {nav.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm sm:text-base ${
                  isActive(href)
                    ? 'bg-[var(--wine)] text-[var(--yellow)] font-semibold shadow-inner'
                    : 'hover:bg-[var(--yellow)]/20'
                }`}
                aria-current={isActive(href) ? 'page' : undefined}
              >
                <Icon className="shrink-0 text-lg" />
                {!isCollapsed && <span>{label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 text-left text-sm sm:text-base hover:bg-[var(--wine)]/20 transition-colors"
        aria-label={t('macroSidebar.logout')}
      >
        <FaSignOutAlt className="text-lg" />
        {!isCollapsed && <span>{t('macroSidebar.logout')}</span>}
      </button>

      {/* Collapse Toggle (Desktop Only) */}
      {!isMobile && (
        <button
          className={`absolute top-20 ${
            isCollapsed ? 'left-12' : 'left-44'
          } -translate-x-1/2 bg-[var(--wine)] text-[var(--white)] p-2 rounded-full hover:bg-[var(--wine)]/80 transition-colors`}
          onClick={toggleCollapse}
          aria-label={isCollapsed ? t('macroSidebar.expand') : t('macroSidebar.collapse')}
        >
          {isCollapsed ? <FaChevronCircleRight /> : <FaChevronCircleLeft />}
        </button>
      )}
    </aside>
  );
};

export default MacroSidebar;
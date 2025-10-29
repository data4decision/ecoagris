'use client';

import React, { useState, useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import {
  FaChartBar,
  FaHeartbeat,
  FaUtensils,
  FaCapsules,
  FaChild,
  FaHandsHelping,
  FaMoneyBill,
  FaShieldAlt,
  FaDatabase,
  FaChevronCircleRight,
  FaChevronCircleLeft,
  FaSignOutAlt
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------
const logout = () => {
  console.log('Logging out...');
  window.location.href = '/login';
};

interface NutritionSidebarProps {
  onCollapseChange: (collapsed: boolean) => void;
}

const NutritionSidebar = ({ onCollapseChange }: NutritionSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const { country } = useParams();
  const pathname = usePathname();
  const { t } = useTranslation('common');   // <-- only common.json

  // -----------------------------------------------------------------
  // Navigation items – keys live in common.json
  // -----------------------------------------------------------------
  const nav = [
    { label: t('sidebar.overview'),          href: `/${country}/dashboard/nutrition`,                     icon: FaChartBar },
    { label: t('sidebar.malnutrition'),      href: `/${country}/dashboard/nutrition/malnutrition`,        icon: FaHeartbeat },
    { label: t('sidebar.dietary'),           href: `/${country}/dashboard/nutrition/dietary-nutrient-intake`, icon: FaUtensils },
    { label: t('sidebar.micronutrient'),     href: `/${country}/dashboard/nutrition/micronutrient-deficiencies`, icon: FaCapsules },
    { label: t('sidebar.healthOutcomes'),    href: `/${country}/dashboard/nutrition/health-outcomes`,     icon: FaChild },
    { label: t('sidebar.interventions'),     href: `/${country}/dashboard/nutrition/interventions`,       icon: FaHandsHelping },
    { label: t('sidebar.policyFunding'),     href: `/${country}/dashboard/nutrition/policy-funding`,      icon: FaMoneyBill },
    { label: t('sidebar.coverage'),          href: `/${country}/dashboard/nutrition/program-coverage-surveillance`, icon: FaShieldAlt },
    { label: t('sidebar.dataMethodology'),   href: `/${country}/dashboard/nutrition/data-methodology`,   icon: FaDatabase },
  ];

  const isActive = (href: string) => pathname === href;

  // -----------------------------------------------------------------
  // Mobile / Collapse handling
  // -----------------------------------------------------------------
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      const collapsed = mobile ? true : false;
      setIsCollapsed(collapsed);
      onCollapseChange(collapsed);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onCollapseChange]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const newState = !prev;
      onCollapseChange(newState);
      return newState;
    });
  };

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[var(--dark-green)] text-[var(--white)] flex flex-col z-40 transition-all duration-300 ${isCollapsed ? 'w-13' : 'w-44'}`}
      aria-label={t('sidebar.aria.navigation')}
    >
      {/* Logo & Brand */}
      <div className="px-4 h-16 flex items-center gap-2 font-semibold border-b border-[var(--wine)]">
        <div className="h-9 w-9 grid place-items-center rounded-full bg-[var(--white)] overflow-hidden">
          <Image src="/logo.png" width={30} height={30} alt={t('sidebar.logo.alt')} />
        </div>
        {!isCollapsed && <span>{t('sidebar.brand')}</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="py-2">
          {nav.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm sm:text-[15px] ${
                  isActive(href)
                    ? 'bg-[var(--dark-green)] text-[var(--white)] font-semibold shadow'
                    : 'hover:bg-[var(--yellow)]/90'
                }`}
                aria-current={isActive(href) ? 'page' : undefined}
              >
                <Icon className="shrink-0 text-lg" />
                {!isCollapsed && <span className="text-sm sm:text-[12px]">{label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 text-left text-[var(--white)] hover:text-[var(--yellow)] hover:bg-[var(--wine)]/90 transition-colors"
        aria-label={t('sidebar.logout')}
      >
        <FaSignOutAlt className="text-lg" />
        {!isCollapsed && <span>{t('sidebar.logout')}</span>}
      </button>

      {/* Collapse Toggle */}
      <button
        className={`absolute top-20 ${isCollapsed ? 'left-13' : 'left-44'} transform -translate-y-1/2 text-[var(--white)] bg-[var(--wine)] p-2 rounded-full shadow-lg hover:scale-110 transition-transform`}
        onClick={toggleCollapse}
        aria-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
      >
        {isCollapsed ? <FaChevronCircleRight /> : <FaChevronCircleLeft />}
      </button>
    </aside>
  );
};

export default NutritionSidebar;
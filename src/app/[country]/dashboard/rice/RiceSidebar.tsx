'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import { FaSeedling, FaChevronCircleRight, FaChevronCircleLeft, FaSignOutAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface RiceSidebarProps {
  onCollapseChange: (collapsed: boolean) => void;
}

const RiceSidebar = ({ onCollapseChange }: RiceSidebarProps) => {
  const { t } = useTranslation('common');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const { country } = useParams();
  const pathname = usePathname();

  const nav = [
    {
      label: t('sidebar.riceProduction'),
      href: `/${country}/dashboard/kpi-analysis`,
      icon: FaSeedling,
    },
  ];

  // Detect active path
  const isActive = (href: string) => pathname === href;

  // Detect screen size for mobile and handle collapse
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

  // Handle collapse toggle
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      onCollapseChange(newState);
      return newState;
    });
  };

  // Logout function (can be replaced with real auth later)
  const logout = () => {
    console.log('Logging out...');
    window.location.href = '/login';
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[var(--dark-green)] text-[var(--white)] flex flex-col z-40 transition-all duration-300 ${
        isCollapsed ? 'w-13' : 'w-44'
      }`}
      aria-label={t('rice.sidebar.ariaLabel')}
    >
      <div className="px-4 h-16 flex items-center gap-2 font-semibold border-b border-[var(--wine)]">
        <div className="h-9 w-9 grid place-items-center rounded-full font-bold bg-[var(--white)]">
          <Image src="/logo.png" width={30} height={30} alt={t('rice.sidebar.logoAlt')} />
        </div>
        {!isCollapsed && <span>{t('sidebar.brand')}</span>}
      </div>

      <nav className="flex-1">
        <ul className="py-2">
          {nav.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive(href)
                    ? 'bg-[var(--dark-green)] text-[var(--white)] font-semibold shadow text-sm sm:text-[15px]'
                    : 'hover:bg-[var(--yellow)]/90'
                }`}
                aria-current={isActive(href) ? 'page' : undefined}
              >
                <Icon className="shrink-0" />
                {!isCollapsed && <span className="text-sm sm:text-[12px]">{label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 text-left text-[var(--white)] hover:text-[var(--yellow)] hover:bg-[var(--wine)]/90 transition-colors"
        aria-label={t('sidebar.logout')}
      >
        <FaSignOutAlt />
        {!isCollapsed && <span>{t('sidebar.logout')}</span>}
      </button>

      {/* Toggle Collapse Button */}
      <button
        className={`absolute top-21 ${
          isCollapsed ? 'left-17' : 'left-47'
        } transform -translate-x-full text-[var(--white)] bg-[var(--wine)] p-2 rounded-full hover:bg-[var(--wine)]/80`}
        onClick={toggleCollapse}
        aria-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
      >
        {isCollapsed ? <FaChevronCircleRight /> : <FaChevronCircleLeft />}
      </button>
    </aside>
  );
};

export default RiceSidebar;
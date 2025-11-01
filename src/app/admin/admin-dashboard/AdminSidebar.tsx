'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  FaChartBar,
  FaUsers,
  FaUpload,
  FaFileAlt,
  FaCog,
  FaKey,
  FaSignOutAlt,
  FaChevronCircleRight,
  FaChevronCircleLeft,
  FaLeaf,
  FaHorse,
  FaAppleAlt,
  FaSeedling,
  FaDatabase,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const logout = () => {
  document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  window.location.href = '/admin/login';
};

interface AdminSidebarProps {
  onCollapseChange: (collapsed: boolean) => void;
}

const AdminSidebar = ({ onCollapseChange }: AdminSidebarProps) => {
  const { t } = useTranslation('common');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isProductsOpen, setIsProductsOpen] = useState<boolean>(false);
  const pathname = usePathname();

  // Define submenu items
  const productItems = [
    { label: t('adminSidebar.nav.macro'), href: '/admin/dashboard/data/macro', icon: FaDatabase },
    { label: t('adminSidebar.nav.agric'), href: '/admin/dashboard/data/agric', icon: FaLeaf },
    { label: t('adminSidebar.nav.livestock'), href: '/admin/dashboard/data/livestock', icon: FaHorse },
    { label: t('adminSidebar.nav.nutrition'), href: '/admin/dashboard/data/nutrition', icon: FaAppleAlt },
    { label: t('adminSidebar.nav.rice'), href: '/admin/dashboard/data/rice', icon: FaSeedling },
  ];

  const topNav = [
    { label: t('adminSidebar.nav.dashboard'), href: '/admin/dashboard', icon: FaChartBar },
    { label: t('adminSidebar.nav.users'), href: '/admin/dashboard/users', icon: FaUsers },
    { label: t('adminSidebar.nav.upload'), href: '/admin/dashboard/data/upload', icon: FaUpload },
  ];

  const bottomNav = [
    { label: t('adminSidebar.nav.logs'), href: '/admin/dashboard/logs', icon: FaFileAlt },
    { label: t('adminSidebar.nav.settings'), href: '/admin/dashboard/settings', icon: FaCog },
    { label: t('adminSidebar.nav.apiKeys'), href: '/admin/dashboard/api-keys', icon: FaKey },
  ];

  const isActive = (href: string) => pathname === href;
  const isProductActive = productItems.some((item) => pathname.startsWith(item.href));

  // Mobile & collapse logic
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
    setIsCollapsed((prev) => {
      const newState = !prev;
      onCollapseChange(newState);
      return newState;
    });
  };

  const toggleProducts = () => {
    if (!isCollapsed) {
      setIsProductsOpen((prev) => !prev);
    }
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[var(--dark-green)] text-[var(--white)] flex flex-col z-40 transition-all duration-300 ${
        isCollapsed ? 'w-13' : 'w-44'
      }`}
      aria-label={t('adminSidebar.ariaLabel')}
    >
      {/* Brand */}
      <div className="px-4 h-16 flex items-center gap-2 font-semibold border-b border-[var(--wine)]">
        <div className="h-9 w-9 grid place-items-center rounded-full font-bold bg-[var(--white)]">
          <Image src="/logo.png" width={30} height={30} alt={t('adminSidebar.logoAlt')} />
        </div>
        {!isCollapsed && <span>{t('adminSidebar.brand')}</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="py-2">
          {/* Top Items */}
          {topNav.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm sm:text-[15px] ${
                  isActive(href)
                    ? 'bg-[var(--dark-green)] text-[var(--white)] font-semibold shadow'
                    : 'hover:bg-[var(--yellow)]/90'
                }`}
              >
                <Icon className="shrink-0 text-[var(--white)]" />
                {!isCollapsed && <span className="text-sm sm:text-[12px]">{label}</span>}
              </Link>
            </li>
          ))}

          {/* Products Editor (Parent + Submenu) */}
          <li>
            <button
              onClick={toggleProducts}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-sm sm:text-[15px] ${
                isProductActive
                  ? 'bg-[var(--dark-green)] text-[var(--white)] font-semibold shadow'
                  : 'hover:bg-[var(--yellow)]/90'
              }`}
              aria-expanded={!isCollapsed && isProductsOpen}
              aria-controls="products-submenu"
            >
              <div className="flex items-center gap-3">
                <FaDatabase className="shrink-0 text-[var(--white)]" />
                {!isCollapsed && (
                  <span className="text-sm sm:text-[12px]">{t('adminSidebar.nav.productsEditor')}</span>
                )}
              </div>
              {!isCollapsed && (
                <span className="text-xs">
                  {isProductsOpen ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              )}
            </button>

            {/* Submenu */}
            {!isCollapsed && isProductsOpen && (
              <ul id="products-submenu" className="ml-8 border-l-2 border-[var(--yellow)]">
                {productItems.map(({ href, icon: Icon, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 px-4 py-2 text-xs transition-colors ${
                        isActive(href)
                          ? 'text-[var(--yellow)] font-medium'
                          : 'text-[var(--white)]/80 hover:text-[var(--yellow)]'
                      }`}
                    >
                      <Icon className="text-sm" />
                      <span>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>

          {/* Bottom Items */}
          {bottomNav.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm sm:text-[15px] ${
                  isActive(href)
                    ? 'bg-[var(--dark-green)] text-[var(--white)] font-semibold shadow'
                    : 'hover:bg-[var(--yellow)]/90'
                }`}
              >
                <Icon className="shrink-0 text-[var(--white)]" />
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
      >
        <FaSignOutAlt />
        {!isCollapsed && <span>{t('adminSidebar.logout')}</span>}
      </button>

      {/* Collapse Toggle */}
      <button
        className={`absolute top-21 ${
          isCollapsed ? 'left-17' : 'left-47'
        } transform -translate-x-full text-[var(--white)] bg-[var(--wine)] p-2 rounded-full`}
        onClick={toggleCollapse}
        aria-label={isCollapsed ? t('adminSidebar.expand') : t('adminSidebar.collapse')}
      >
        {isCollapsed ? <FaChevronCircleRight /> : <FaChevronCircleLeft />}
      </button>
    </aside>
  );
};

export default AdminSidebar;
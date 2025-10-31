// src/components/AdminSidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
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
  FaUserCog,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface AdminSidebarProps {
  onCollapseChange: (collapsed: boolean) => void;
}

const AdminSidebar = ({ onCollapseChange }: AdminSidebarProps) => {
  const { t } = useTranslation('common');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isProductsOpen, setIsProductsOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();

  // Define submenu items
  const productItems = [
    { label: t('adminSidebar.nav.macro'), href: '/admin/data/macro', icon: FaDatabase },
    { label: t('adminSidebar.nav.agric'), href: '/admin/data/agric', icon: FaLeaf },
    { label: t('adminSidebar.nav.livestock'), href: '/admin/data/livestock', icon: FaHorse },
    { label: t('adminSidebar.nav.nutrition'), href: '/admin/data/nutrition', icon: FaAppleAlt },
    { label: t('adminSidebar.nav.rice'), href: '/admin/data/rice', icon: FaSeedling },
  ];

  const topNav = [
    { label: t('adminSidebar.nav.dashboard'), href: '/admin/admin-dashboard', icon: FaChartBar },
    { label: t('adminSidebar.nav.users'), href: '/admin/users', icon: FaUsers },
    { label: t('adminSidebar.nav.upload'), href: '/admin/data-upload', icon: FaUpload },
    { label: 'Manage Admins', href: '/admin/manage-admins', icon: FaUserCog },
  ];

  const bottomNav = [
    { label: t('adminSidebar.nav.logs'), href: '/admin/logs', icon: FaFileAlt },
    { label: t('adminSidebar.nav.settings'), href: '/admin/settings', icon: FaCog },
    { label: t('adminSidebar.nav.apiKeys'), href: '/admin/api-keys', icon: FaKey },
  ];

  const isActive = (href: string) => pathname === href;
  const isProductActive = productItems.some((item) => pathname.startsWith(item.href));

  // Mobile & collapse logic
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

  const toggleProducts = () => {
    if (!isCollapsed) {
      setIsProductsOpen((prev) => !prev);
    }
  };

  // Logout: Clear localStorage + redirect
  const handleLogout = () => {
    localStorage.removeItem('admin-auth');
    router.replace('/admin/login');
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
        <div className="h-9 w-9 grid place-items-center rounded-full font-bold bg-[var(--white)] overflow-hidden">
          <Image src="/logo.png" width={36} height={36} alt={t('adminSidebar.logoAlt')} className="object-cover" />
        </div>
        {!isCollapsed && <span className="text-sm">{t('adminSidebar.brand')}</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul>
          {/* Top Items */}
          {topNav.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm ${
                  isActive(href)
                    ? 'bg-[var(--wine)] text-white font-semibold'
                    : 'hover:bg-[var(--yellow)]/20 text-white/90'
                }`}
              >
                <Icon className="text-lg shrink-0" />
                {!isCollapsed && <span>{label}</span>}
              </Link>
            </li>
          ))}

          {/* Products Editor */}
          <li>
            <button
              onClick={toggleProducts}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors text-sm ${
                isProductActive
                  ? 'bg-[var(--wine)] text-white font-semibold'
                  : 'hover:bg-[var(--yellow)]/20 text-white/90'
              }`}
              aria-expanded={!isCollapsed && isProductsOpen}
            >
              <div className="flex items-center gap-3">
                <FaDatabase className="text-lg shrink-0" />
                {!isCollapsed && <span>{t('adminSidebar.nav.productsEditor')}</span>}
              </div>
              {!isCollapsed && (
                <span className="text-xs">
                  {isProductsOpen ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              )}
            </button>

            {/* Submenu */}
            {!isCollapsed && isProductsOpen && (
              <ul className="ml-8 border-l-2 border-[var(--yellow)]">
                {productItems.map(({ href, icon: Icon, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 px-4 py-2 text-xs transition-colors ${
                        isActive(href)
                          ? 'text-[var(--yellow)] font-medium'
                          : 'text-white/80 hover:text-[var(--yellow)]'
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
                className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm ${
                  isActive(href)
                    ? 'bg-[var(--wine)] text-white font-semibold'
                    : 'hover:bg-[var(--yellow)]/20 text-white/90'
                }`}
              >
                <Icon className="text-lg shrink-0" />
                {!isCollapsed && <span>{label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-[var(--wine)]/90 transition-colors text-sm"
      >
        <FaSignOutAlt className="text-lg" />
        {!isCollapsed && <span>{t('adminSidebar.logout')}</span>}
      </button>

      {/* Collapse Toggle */}
      <button
        onClick={toggleCollapse}
        className={`absolute top-20 ${
          isCollapsed ? 'left-13' : 'left-44'
        } -translate-x-1/2 bg-[var(--wine)] text-white p-1.5 rounded-full shadow-lg hover:bg-[var(--wine)]/80 transition-all`}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <FaChevronCircleRight size={18} /> : <FaChevronCircleLeft size={18} />}
      </button>
    </aside>
  );
};

export default AdminSidebar;
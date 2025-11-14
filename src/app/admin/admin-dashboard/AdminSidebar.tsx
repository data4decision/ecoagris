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
  FaDatabase,
  FaQuestionCircle,
  FaBell,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { db } from '@/app/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface AdminSidebarProps {
  onCollapseChange: (collapsed: boolean) => void;
}

const AdminSidebar = ({ onCollapseChange }: AdminSidebarProps) => {
  const { t } = useTranslation('common');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const pathname = usePathname();

  const topNav = [
    { label: t('adminSidebar.nav.dashboard'), href: '/admin/admin-dashboard', icon: FaChartBar },
    { label: t('adminSidebar.nav.users'), href: '/admin/admin-dashboard/users', icon: FaUsers },
    { label: t('adminSidebar.nav.upload'), href: '/admin/admin-dashboard/data-upload', icon: FaUpload },
    { label: t('adminSidebar.nav.files'), href: '/admin/admin-dashboard/files', icon: FaUpload },
    { label: t('adminSidebar.nav.productEditor'), href: '/admin/product-editor', icon: FaDatabase },
  ];

  const bottomNav = [
    { label: t('adminSidebar.nav.settings'), href: '/admin/admin-dashboard/settings', icon: FaCog },
    { label: t('adminSidebar.nav.help'), href: '/admin/help-support', icon: FaQuestionCircle },
    {
      label: t('adminSidebar.nav.notifications'),
      href: '/admin/notifications',
      icon: FaBell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  const isActive = (href: string) => pathname === href;

  // Real-time unread count
  useEffect(() => {
    const q = query(
      collection(db, 'adminNotifications'),
      where('read', '==', false)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (err) => {
      console.error('Failed to fetch unread count:', err);
    });

    return () => unsub();
  }, []);

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
                className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm sm:text-[15px] relative ${
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

          {/* Bottom Items */}
          {bottomNav.map(({ href, icon: Icon, label, badge }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 transition-colors text-sm sm:text-[15px] relative ${
                  isActive(href)
                    ? 'bg-[var(--dark-green)] text-[var(--white)] font-semibold shadow'
                    : 'hover:bg-[var(--yellow)]/90'
                }`}
              >
                <div className="relative">
                  <Icon className="shrink-0 text-[var(--white)]" />
                  {badge !== null && (
                    <span className="absolute -top-1 -right-1 bg-[var(--red)] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                      {badge}
                    </span>
                  )}
                </div>
                {!isCollapsed && <span className="text-sm sm:text-[12px]">{label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

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
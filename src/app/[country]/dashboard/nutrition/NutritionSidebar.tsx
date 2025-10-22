'use client';
import React, { useState, useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import { FaChartBar,
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
FaSignOutAlt } from 'react-icons/fa';
// Add the logout function implementation (imported or defined)
const logout = () => {
  // Implement your logout logic here
  console.log('Logging out...');
  // Example: redirect to login page
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

 const nav = [
  {label: 'Overview', href: `/${country}/dashboard/nutrition`, icon: FaChartBar, },
  {label: 'Malnutrition Indicators', href: `/${country}/dashboard/nutrition/malnutrition`, icon: FaHeartbeat, },
  {label: 'Dietary & Nutrient Intake', href: `/${country}/dashboard/nutrition/dietary-nutrient-intake`, icon: FaUtensils, },
  {label: 'Micronutrient Deficiencies',href: `/${country}/dashboard/nutrition/micronutrient-deficiencies`, icon: FaCapsules },
  {label: 'Health Outcomes', href: `/${country}/dashboard/nutrition/health-outcomes`, icon: FaChild},
  {label: 'Nutrition Interventions', href: `/${country}/dashboard/nutrition/interventions`, icon: FaHandsHelping,},
  {label: 'Policy & Funding', href: `/${country}/dashboard/nutrition/policy-funding`, icon: FaMoneyBill},
  {label: 'Program Coverage & Surveillance', href: `/${country}/dashboard/nutrition/program-coverage-surveillance`, icon: FaShieldAlt, },
  {label: 'Data & Methodology', href: `/${country}/dashboard/nutrition/data-methodology`, icon: FaDatabase, },
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
    setIsCollapsed(prev => {
      const newState = !prev;
      onCollapseChange(newState);
      return newState;
    });
  };

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-[var(--dark-green)] text-[var(--white)] flex flex-col z-40 transition-all duration-300 ${isCollapsed ? 'w-13' : 'w-44'}`} 
      aria-label="User Navigation"
    >
      <div className="px-4 h-16 flex items-center gap-2 font-semibold border-b border-[var(--wine)]">
        <div className="h-9 w-9 grid place-items-center rounded-full font-bold bg-[var(--white)]">
          <Image src="/logo.png" width={30} height={30} alt="ECOAGRIS LOGO" />
        </div>
        {!isCollapsed && <span>ECOAGRIS</span>}
      </div>

      <nav className="flex-1">
        <ul className="py-2">
          {nav.map(({ href, icon: Icon, label }) => (
            <li key={href}>
              <Link 
                href={href} 
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isActive(href) ? ' text-sm sm:text-[15px] bg-[var(--dark-green)] text-[var(--white)] font-semibold shadow' : 'hover:bg-[var(--yellow)]/90 '}`}
                aria-current={isActive(href) ? 'page' : undefined}
              >
                <Icon className="shrink-0" />
                {!isCollapsed && <span className=" text-sm sm:text-[12px]">{label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <button 
        onClick={logout} 
        className="flex items-center gap-3 px-4 py-3 text-left text-[var(--white)] hover:text-[var(--yellow)] hover:bg-[var(--wine)]/90 transition-colors"
      >
        <FaSignOutAlt />
        {!isCollapsed && <span>Logout</span>}
      </button>

      {/* Toggle Collapse Button */}
      <button 
        className={`absolute top-21 ${isCollapsed ? 'left-17' : 'left-47'} transform -translate-x-full text-[var(--white)] bg-[var(--wine)] p-2 rounded-full`} 
        onClick={toggleCollapse}
      >
        {isCollapsed ? <FaChevronCircleRight /> : <FaChevronCircleLeft />}
      </button>
    </aside>
  );
};

export default NutritionSidebar;

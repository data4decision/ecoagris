'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import {
  FaHome,
  FaChartLine,
  FaClinicMedical,
  FaDatabase,
  FaUser,
  FaSignOutAlt,
  FaLeaf,
  FaSeedling,
  FaChartBar,
  FaWater,
  FaFish,
} from 'react-icons/fa';
import { FiBarChart2, FiGlobe, FiTrendingUp } from 'react-icons/fi';
import { GiCow } from 'react-icons/gi';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
}

const Sidebar = ({ isCollapsed, onCollapseChange }: SidebarProps) => {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const country = params.country as string;
  const product = params.product as string;

  const toggleCollapse = () => {
    onCollapseChange(!isCollapsed);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('Signed out, redirecting to /login');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Define unique submenus for each product
  const getProductSubmenu = (productSlug: string) => {
    const productName = productSlug.charAt(0).toUpperCase() + productSlug.slice(1).replace(/-/g, ' ');
    switch (productSlug) {
      case 'livestock':
        return [
          { href: `/${country}/dashboard/livestock`, icon: FaHome, label: 'Overview Dashboard' },
          { href: `/${country}/dashboard/livestock/population`, icon: GiCow, label: 'Livestock Population' },
          { href: `/${country}/dashboard/livestock/production`, icon: FiBarChart2, label: 'Production and Output' },
          { href: `/${country}/dashboard/livestock/economy`, icon: FaChartLine, label: 'Economic Indicators' },
          { href: `/${country}/dashboard/livestock/health`, icon: FaClinicMedical, label: 'Animal Health & Welfare' },
          { href: `/${country}/dashboard/livestock/grazing`, icon: FaLeaf, label: 'Grazing & Transhumance' },
          { href: `/${country}/dashboard/livestock/comparison`, icon: FiGlobe, label: 'Country Comparison' },
          { href: `/${country}/dashboard/livestock/forecast`, icon: FiTrendingUp, label: 'Forecast & Simulation' },
          { href: `/${country}/dashboard/livestock/methodology`, icon: FaDatabase, label: 'Data & Methodology' },
        ];
      case 'agric-input':
        return [
          { href: `/${country}/dashboard/agric-input`, icon: FaHome, label: 'Inputs Overview' },
          { href: `/${country}/dashboard/agric-input/fertilizer`, icon: FaSeedling, label: 'Fertilizer Usage' },
          { href: `/${country}/dashboard/agric-input/seeds`, icon: FaLeaf, label: 'Seed Distribution' },
          { href: `/${country}/dashboard/agric-input/pesticides`, icon: FaClinicMedical, label: 'Pesticide Application' },
          { href: `/${country}/dashboard/agric-input/economy`, icon: FaChartLine, label: 'Economic Impact' },
          { href: `/${country}/dashboard/agric-input/comparison`, icon: FiGlobe, label: 'Country Comparison' },
        ];
      case 'agro-hydro-meteorology':
        return [
          { href: `/${country}/dashboard/agro-hydro-meteorology`, icon: FaHome, label: 'Weather Overview' },
          { href: `/${country}/dashboard/agro-hydro-meteorology/rainfall`, icon: FaWater, label: 'Rainfall Patterns' },
          { href: `/${country}/dashboard/agro-hydro-meteorology/temperature`, icon: FaChartBar, label: 'Temperature Trends' },
          { href: `/${country}/dashboard/agro-hydro-meteorology/irrigation`, icon: FaLeaf, label: 'Irrigation Stats' },
          { href: `/${country}/dashboard/agro-hydro-meteorology/forecast`, icon: FiTrendingUp, label: 'Weather Forecast' },
        ];
      case 'agricultural-production':
        return [
          { href: `/${country}/dashboard/agricultural-production`, icon: FaHome, label: 'Production Overview' },
          { href: `/${country}/dashboard/agricultural-production/yield`, icon: FaSeedling, label: 'Crop Yield' },
          { href: `/${country}/dashboard/agricultural-production/area`, icon: FaChartBar, label: 'Cultivated Area' },
          { href: `/${country}/dashboard/agricultural-production/economy`, icon: FaChartLine, label: 'Economic Indicators' },
          { href: `/${country}/dashboard/agricultural-production/comparison`, icon: FiGlobe, label: 'Country Comparison' },
          { href: `/${country}/dashboard/agricultural-production/forecast`, icon: FiTrendingUp, label: 'Production Forecast' },
        ];
      case 'agricultural-market':
        return [
          { href: `/${country}/dashboard/agricultural-market`, icon: FaHome, label: 'Market Overview' },
          { href: `/${country}/dashboard/agricultural-market/prices`, icon: FaChartLine, label: 'Market Prices' },
          { href: `/${country}/dashboard/agricultural-market/trade`, icon: FiGlobe, label: 'Trade Flows' },
          { href: `/${country}/dashboard/agricultural-market/demand`, icon: FaChartBar, label: 'Demand Trends' },
          { href: `/${country}/dashboard/agricultural-market/supply`, icon: FaSeedling, label: 'Supply Trends' },
        ];
      case 'food-stocks':
        return [
          { href: `/${country}/dashboard/food-stocks`, icon: FaHome, label: 'Stocks Overview' },
          { href: `/${country}/dashboard/food-stocks/inventory`, icon: FaChartBar, label: 'Stock Inventory' },
          { href: `/${country}/dashboard/food-stocks/storage`, icon: FaDatabase, label: 'Storage Capacity' },
          { href: `/${country}/dashboard/food-stocks/distribution`, icon: FiGlobe, label: 'Distribution Networks' },
          { href: `/${country}/dashboard/food-stocks/security`, icon: FaChartLine, label: 'Food Security' },
        ];
      case 'nutrition':
        return [
          { href: `/${country}/dashboard/nutrition`, icon: FaHome, label: 'Nutrition Overview' },
          { href: `/${country}/dashboard/nutrition/dietary`, icon: FaLeaf, label: 'Dietary Patterns' },
          { href: `/${country}/dashboard/nutrition/deficiencies`, icon: FaClinicMedical, label: 'Nutrient Deficiencies' },
          { href: `/${country}/dashboard/nutrition/programs`, icon: FaChartBar, label: 'Nutrition Programs' },
          { href: `/${country}/dashboard/nutrition/comparison`, icon: FiGlobe, label: 'Country Comparison' },
        ];
      case 'fishery':
        return [
          { href: `/${country}/dashboard/fishery`, icon: FaHome, label: 'Fishery Overview' },
          { href: `/${country}/dashboard/fishery/catch`, icon: FaFish, label: 'Fish Catch' },
          { href: `/${country}/dashboard/fishery/species`, icon: FaLeaf, label: 'Species Diversity' },
          { href: `/${country}/dashboard/fishery/economy`, icon: FaChartLine, label: 'Economic Impact' },
          { href: `/${country}/dashboard/fishery/sustainability`, icon: FiGlobe, label: 'Sustainability' },
        ];
      case 'aquaculture':
        return [
          { href: `/${country}/dashboard/aquaculture`, icon: FaHome, label: 'Aquaculture Overview' },
          { href: `/${country}/dashboard/aquaculture/production`, icon: FaFish, label: 'Production Stats' },
          { href: `/${country}/dashboard/aquaculture/technology`, icon: FaChartBar, label: 'Farming Technology' },
          { href: `/${country}/dashboard/aquaculture/environment`, icon: FaLeaf, label: 'Environmental Impact' },
          { href: `/${country}/dashboard/aquaculture/comparison`, icon: FiGlobe, label: 'Country Comparison' },
        ];
      case 'agric-research-results':
        return [
          { href: `/${country}/dashboard/agric-research-results`, icon: FaHome, label: 'Research Overview' },
          { href: `/${country}/dashboard/agric-research-results/innovations`, icon: FaSeedling, label: 'Innovations' },
          { href: `/${country}/dashboard/agric-research-results/publications`, icon: FaDatabase, label: 'Publications' },
          { href: `/${country}/dashboard/agric-research-results/impact`, icon: FaChartLine, label: 'Research Impact' },
          { href: `/${country}/dashboard/agric-research-results/funding`, icon: FaChartBar, label: 'Funding Trends' },
        ];
      case 'macroeconomics-indices':
        return [
          { href: `/${country}/dashboard/macroeconomics-indices`, icon: FaHome, label: 'Macro Indices Overview' },
          { href: `/${country}/dashboard/macroeconomics-indices/gdp`, icon: FaChartLine, label: 'Agricultural GDP' },
          { href: `/${country}/dashboard/macroeconomics-indices/trade`, icon: FiGlobe, label: 'Trade Indices' },
          { href: `/${country}/dashboard/macroeconomics-indices/inflation`, icon: FaChartBar, label: 'Inflation Impact' },
          { href: `/${country}/dashboard/macroeconomics-indices/forecast`, icon: FiTrendingUp, label: 'Economic Forecast' },
        ];
      default:
        return [];
    }
  };

  const nav = [
    { href: `/${country}/dashboard`, icon: FaHome, label: 'Product Selection' },
    ...(product ? getProductSubmenu(product) : []),
    { href: `/${country}/profile`, icon: FaUser, label: 'Profile' },
    { href: '#', icon: FaSignOutAlt, label: 'Logout', onClick: logout },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div
      className={`fixed top-0 left-0 h-screen bg-[var(--dark-green)] text-[var(--white)] flex flex-col z-40 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      aria-label="User Navigation"
    >
      <div className="px-4 h-16 flex items-center gap-2 font-semibold border-b border-[var(--yellow)]">
        <div className="h-9 w-9 grid place-items-center rounded-full font-bold bg-[var(--white)]">
          <Image src="/logo.png" width={30} height={30} alt="ECOAGRIS" />
        </div>
        {!isCollapsed && <span>ECOAGRIS</span>}
      </div>
      <button
        onClick={toggleCollapse}
        className="px-4 py-2 text-[var(--yellow)] hover:bg-[var(--medium-green)]/90"
      >
        {isCollapsed ? 'Expand' : 'Collapse'}
      </button>
      <nav className="flex-1">
        <ul>
          {nav.map(({ href, icon: Icon, label, onClick }) => (
            <li key={href}>
              {onClick ? (
                <button
                  onClick={onClick}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors w-full text-left ${
                    isActive(href)
                      ? 'bg-[var(--white)] text-[var(--olive-green)] font-semibold shadow'
                      : 'hover:bg-[var(--medium-green)]/90'
                  }`}
                  aria-current={isActive(href) ? 'page' : undefined}
                >
                  <Icon className="shrink-0" />
                  {!isCollapsed && <span>{label}</span>}
                </button>
              ) : (
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    isActive(href)
                      ? 'bg-[var(--white)] text-[var(--olive-green)] font-semibold shadow'
                      : 'hover:bg-[var(--medium-green)]/90'
                  }`}
                  aria-current={isActive(href) ? 'page' : undefined}
                >
                  <Icon className="shrink-0" />
                  {!isCollapsed && <span>{label}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
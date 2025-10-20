'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';

// Import Livestock submenu components
import PopulationChart from '@/components/products/livestock/PopulationChart';
import ProductionChart from '@/components/products/livestock/ProductionChart';
import EconomyChart from '@/components/products/livestock/EconomyChart';
import HealthStats from '@/components/products/livestock/HealthStats';
import GrazingMap from '@/components/products/livestock/GrazingMap';
import ComparisonTable from '@/components/products/livestock/ComparisonTable';
import ForecastChart from '@/components/products/livestock/ForecastChart';
import Methodology from '@/components/products/livestock/Methodology';

export default function ProductSubmenuDashboard() {
  const { country, product, submenu } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!user) return null;

  const submenuDisplayNames: { [key: string]: string } = {
    population: 'Population',
    production: 'Production and Output',
    economy: 'Economic Indicators',
    health: 'Animal Health & Welfare',
    grazing: 'Grazing & Transhumance',
    comparison: 'Country Comparison',
    forecast: 'Forecast & Simulation',
    methodology: 'Data & Methodology',
    // Add other products’ submenus later
  };

  const productName = product.charAt(0).toUpperCase() + product.slice(1).replace(/-/g, ' ');
  const submenuTitle = submenuDisplayNames[submenu as string] || submenu.charAt(0).toUpperCase() + submenu.slice(1).replace(/-/g, ' ');

  // Map submenu components for Livestock
  const submenuComponents: { [key: string]: { [key: string]: React.ComponentType } } = {
    livestock: {
      population: PopulationChart,
      production: ProductionChart,
      economy: EconomyChart,
      health: HealthStats,
      grazing: GrazingMap,
      comparison: ComparisonTable,
      forecast: ForecastChart,
      methodology: Methodology,
    },
    // Add other products later
  };

  const SubmenuComponent = submenuComponents[product as string]?.[submenu as string] || (() => (
    <div className="bg-[var(--yellow)]/20 p-4 rounded-lg">
      <p className="text-[var(--olive-green)]">
        This is the {submenuTitle.toLowerCase()} dashboard for {productName} in {country}. Add your data visualizations here.
      </p>
    </div>
  ));

  return (
    <div className="min-h-screen bg-[var(--white)] p-6">
      <h1 className="text-2xl font-bold text-[var(--dark-green)] mb-4">
        {productName} {submenuTitle} for {country.charAt(0).toUpperCase() + country.slice(1)}
      </h1>
      <SubmenuComponent />
    </div>
  );
}
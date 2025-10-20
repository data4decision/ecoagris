'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import LivestockOverview from '@/app/products/livestock/Overview';

export default function ProductDashboard() {
  const { country, product } = useParams();
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

  const productName = product.charAt(0).toUpperCase() + product.slice(1).replace(/-/g, ' ');

  const overviewComponents = {
    livestock: LivestockOverview,
  };

  const OverviewComponent = overviewComponents[product as string] || (() => (
    <div className="bg-[var(--yellow)]/20 p-4 rounded-lg">
      <p className="text-[var(--olive-green)]">
        This is the overview dashboard for {productName} in {country}. Product not supported yet.
      </p>
    </div>
  ));

  const supportedCountries = ['benin', 'burkina faso', 'cape verde', 'cote divoire', 'gambia', 'ghana', 'guinea', 'guinea-bissau', 'liberia', 'mali', 'niger', 'nigeria', 'senegal', 'sierra leone', 'togo'];
  if (!supportedCountries.includes((country as string).toLowerCase())) {
    return (
      <div className="min-h-screen bg-[var(--white)] p-6">
        <h1 className="text-2xl font-bold text-[var(--dark-green)] mb-4">
          {productName} Overview for {country.charAt(0).toUpperCase() + country.slice(1)}
        </h1>
        <p className="text-[var(--wine)]">Data not available for {country}. Please select a supported country (e.g., Benin, Nigeria).</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--white)] p-6">
      <h1 className="text-2xl font-bold text-[var(--dark-green)] mb-4">
        {productName} Overview for {country.charAt(0).toUpperCase() + country.slice(1)}
      </h1>
      <OverviewComponent />
    </div>
  );
}
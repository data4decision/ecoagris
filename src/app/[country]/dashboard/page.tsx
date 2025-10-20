'use client';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import Link from 'next/link';
import { FaLeaf } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const products = [
  { name: 'Agric Input', slug: 'agric' },
  { name: 'Agro-hydro-meteorology', slug: 'agro-hydro-meteorology' },
  { name: 'Agricultural Production', slug: 'agricultural-production' },
  { name: 'Agricultural Market', slug: 'agricultural-market' },
  { name: 'Food Stocks', slug: 'food-stocks' },
  { name: 'Nutrition', slug: 'nutrition' },
  { name: 'Livestock', slug: 'livestock' },
  { name: 'Fishery', slug: 'fishery' },
  { name: 'Aquaculture', slug: 'aquaculture' },
  { name: 'Agric Research Results', slug: 'agric-research-results' },
  { name: 'Macroeconomics Indices', slug: 'macroeconomics-indices' },
];

export default function ProductSelection() {
  const router = useRouter();
  const { country } = useParams();
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

  return (
    <div className="min-h-screen bg-[var(--yellow)]">
      <Navbar />
      <div className="p-6 w-full sm:w-[80%] mx-auto">
        <h1 className="text-2xl font-bold text-[var(--dark-green)] mb-6">
          Select a Product for {country.charAt(0).toUpperCase() + country.slice(1)}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Link
              key={product.slug}
              href={`/${country}/dashboard/${product.slug}`}
              className="flex items-center p-4 bg-[var(--white)] text-[var(--dark-green)] rounded-lg hover:bg-[var(--wine)] hover:text-[var(--white)] transition-colors shadow-sm"
            >
              <FaLeaf className="mr-2" />
              <span className="font-medium">{product.name}</span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
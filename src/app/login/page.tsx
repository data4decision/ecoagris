'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/app/lib/firebase';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Page = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userCountry = userData?.country;

        if (userCountry) {
          router.push(`/${userCountry.toLowerCase()}/dashboard`);
        } else {
          setError('Error: Country information is missing.');
        }
      } else {
        setError('Error: User data not found.');
      }
    } catch (error: unknown) {
      setError('Error signing in: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (loading) {
    return <p className="text-center mt-10 text-[var(--white)]">Loading...</p>;
  }

  const text =
    'Please log in to access your personalized dashboard. Once you log in with your registered credentials, you\'ll be automatically directed to your country\'s specific dashboard, where you can view relevant agricultural data, resources, and insights for your ECOWAS region.';

  return (
    <div className="bg-[var(--yellow)]">
      <Navbar />
      <div className="grid grid-cols-1 sm:grid-cols-2 w-full sm:w-[80%] m-auto">
        <div
          className="relative rounded-lg pl-10 pr-10 py-5 mt-4 mb-4 bg-cover bg-center object-contain rounded-tl-lg rounded-bl-xl"
          style={{ backgroundImage: "url('/about.jpg')" }}
        >
          <span className="absolute inset-0 z-0"></span>
          <div className="flex items-center justify-start gap-2 mt-7">
            <Image src="/logo.png" alt="EcoAgris logo" width={40} height={40} />
            <h1 className="font-bold text-[var(--medium-green)] text-[17px] sm:text-[20px]">EcoAgris</h1>
          </div>
          <div className="flex flex-col leading-none mt-15">
            <h1 className="text-[var(--white)] text-[60px] font-semibold">Hello,</h1>
            <h1 className="text-[var(--yellow)] text-[60px] font-bold">
              <b>Welcome!</b>
            </h1>
          </div>
          <div className="mt-7">
            <h3 className="bg-[var(--olive-green)] px-2 py-2 rounded-lg text-[var(--white)] sm:text-[15px] text-[10px] font-semibold">
              {text}
            </h3>
          </div>
        </div>
        <div
          className="bg-[var(--medium-green)] rounded-lg bg-cover bg-center object-contain mt-4 mb-4"
          style={{ backgroundImage: "url('/part2.png')" }}
        >
          <div className="rounded-lg">
            <form onSubmit={handleEmailLogin} className="mb-4 mt-10 w-[80%] m-auto py-15">
              {error && <p className="text-red-500">{error}</p>}
              <div className="flex items-center gap-2 bg-[var(--white)] px-2 rounded-lg">
                <FaUser size={20} className="text-[var(--dark-green)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Your Email"
                  className="w-full bg-[var(--white)] py-2 outline-none text-[var(--dark-green)]"
                  required
                />
              </div>
              <div className="relative mt-5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Your Password"
                  className="w-full bg-[var(--white)] rounded-lg px-3 py-2 pr-10 outline-none text-[var(--dark-green)]"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-[var(--yellow)]"
                >
                  {showPassword ? (
                    <FaEyeSlash size={20} className="text-[var(--dark-green)]" />
                  ) : (
                    <FaEye size={20} className="text-[var(--dark-green)]" />
                  )}
                </button>
              </div>
              <button
                type="submit"
                className="mt-10 cursor-pointer w-full bg-[var(--wine)] hover:bg-[var(--yellow)] transition ease-in-out duration-300 text-[var(--white)] font-bold py-2 rounded-lg"
              >
                Login
              </button>
              <div className="flex items-center gap-3 m-auto mt-2">
                <p className="text-[var(--white)] text-[20px] sm:text-[15px]">Not registered yet?</p>
                <Link
                  href="/signup"
                  className="hover:text-[var(--wine)] text-[var(--yellow)] font-semibold transition duration-300 ease-in-out"
                >
                  Sign Up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Page;
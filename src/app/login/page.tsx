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
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
          setError(t('login.errors.missing_country'));
        }
      } else {
        setError(t('login.errors.no_user_data'));
      }
    } catch {
      setError(t('login.errors.invalid_credentials'));
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--yellow)] flex items-center justify-center">
        <p className="text-center text-[var(--white)] text-lg">{t('login.loading')}</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--yellow)] min-h-screen">
      <Navbar />

      <div className="grid grid-cols-1 sm:grid-cols-2 w-full sm:w-[80%] mx-auto">
        {/* LEFT PANEL */}
        <div
          className="relative rounded-tl-lg rounded-bl-xl p-10 mt-4 mb-4 bg-cover bg-center"
          style={{ backgroundImage: "url('/log.jpg')" }}
        >
          <span className="absolute inset-0 bg-[var(--dark-green)]/50 z-0"></span>
          <div className="relative z-10 flex items-center justify-start gap-2 mt-7">
            <Image src="/logo.png" alt="EcoAgris logo" width={40} height={40} />
            <h1 className="font-bold text-[var(--yellow)] text-[17px] sm:text-[20px]">EcoAgris</h1>
          </div>

          <div className="relative z-10 flex flex-col leading-none mt-10">
            <h1 className="text-[var(--white)] text-[40px] sm:text-[60px] font-semibold">
              {t('login.hello')}
            </h1>
            <h1 className="text-[var(--yellow)] text-[40px] sm:text-[60px] font-bold">
              {t('login.welcome')}
            </h1>
          </div>

          <div className="relative z-10 mt-7">
            <p className="bg-[var(--olive-green)] px-4 py-3 rounded-lg text-[var(--white)] text-[12px] sm:text-[14px] font-medium">
              {t('login.welcome_text')}
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-[var(--medium-green)] rounded-tr-lg rounded-br-xl mt-4 mb-4 p-10 pt-20">
          <form onSubmit={handleEmailLogin} className="w-full max-w-md mx-auto">
            {error && <p className="text-[var(--wine)] mb-4 text-center">{error}</p>}

            <div className="flex items-center gap-2 bg-[var(--white)] px-3 py-2 rounded-lg mb-4">
              <FaUser size={20} className="text-[var(--dark-green)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.email_placeholder')}
                className="w-full bg-[var(--white)] outline-none text-[var(--dark-green)] py-2"
                required
              />
            </div>

            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.password_placeholder')}
                className="w-full bg-[var(--white)] rounded-lg px-3 py-3 pr-10 outline-none text-[var(--dark-green)]"
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
              disabled={loading}
              className="w-full bg-[var(--wine)] hover:bg-[var(--yellow)] text-[var(--white)] font-bold py-3 rounded-lg transition ease-in-out duration-300 disabled:opacity-50 cursor-pointer"
            >
              {t('login.login_button')}
            </button>

            <div className="flex items-center justify-center gap-3 mt-4">
              <p className="text-[var(--white)] text-[14px] sm:text-[15px]">
                {t('login.not_registered')}
              </p>
              <Link
                href="/signup"
                className="text-[var(--yellow)] hover:text-[var(--wine)] font-semibold transition duration-300 ease-in-out"
              >
                {t('login.signup_link')}
              </Link>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LoginPage;

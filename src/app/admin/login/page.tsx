'use client';

// Prevent ALL static rendering and prerendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginAction } from './action';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const result = await loginAction(idToken);

      if (result.error) throw new Error(result.error);

      router.push('/admin/admin-dashboard');
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      const code = firebaseError.code;
      const message = firebaseError.message || 'Login failed. Please try again.';

      if (code === 'auth/network-request-failed') {
        setError('Network error. Check your internet connection.');
      } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--medium-green)] to-[var(--dark-green)] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-[var(--yellow)] p-3 rounded-full">
            <div className="bg-white p-2 rounded-full">
              <span className="text-2xl font-bold text-[var(--dark-green)]">ECOAGRIS</span>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-[var(--dark-green)] mb-2">
          Admin Login
        </h1>
        <p className="text-center text-[var(--olive-green)] text-sm mb-6">
          Access the ECOAGRIS Admin Dashboard
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--dark-green)] mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--yellow)] focus:border-transparent transition"
              placeholder="admin@ecoagris.org"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--dark-green)] mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--yellow)] focus:border-transparent transition"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--dark-green)] text-white py-3 rounded-lg font-semibold hover:bg-[var(--olive-green)] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            Need access? Contact{' '}
            <a href="mailto:support@ecoagris.org" className="text-[var(--dark-green)] underline">
              support@ecoagris.org
            </a>
          </p>
        </div>

        {/* CRITICAL FIX: Use <a> instead of <Link> to avoid prerender error */}
        <div className="mt-4 text-center">
          {/* <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              router.push('/');
            }}
            className="text-sm text-[var(--olive-green)] hover:text-[var(--dark-green)] transition cursor-pointer"
          >
            ← Back to ECOAGRIS
          </a> */}
        </div>
      </div>
    </div>
  );
}
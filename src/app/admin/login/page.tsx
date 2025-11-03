'use client';

import { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { FaSpinner } from 'react-icons/fa';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const isNavigating = useRef(false);

  // Listen to auth state changes (initial load + post-login)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !isNavigating.current) {
        isNavigating.current = true;
        try {
          const idTokenResult = await user.getIdTokenResult();
          const adminEmail = idTokenResult.claims.email;

          if (adminEmail === 'admin@ecoagris.org') {
            router.replace('/admin/admin-dashboard');
          } else {
            await auth.signOut();
            setError('Access denied. Admin account required.');
          }
        } catch (err) {
          await auth.signOut();
          setError('Authentication failed. Please try again.');
        } finally {
          isNavigating.current = false;
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Handle form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isNavigating.current) return;

    setLoading(true);
    setError('');

    try {
      // Firebase login — no redirect here!
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle redirect
    } catch (err: unknown) {
      let errorMessage = 'Login failed. Please try again.';

      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Try again later.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Check your connection.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          default:
            errorMessage = 'An unexpected error occurred.';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--yellow)] to-[var(--dark-green)] flex items-center justify-center p-4 ">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
            <div className='flex justify-center mb-6'>
              <div className="bg-[var(--yellow)] p-3 rounded-full ">
                <div className="bg-white p-2 rounded-full">
                  <span className='text-2xl font-bold text-[var(--dark-green)]'>ECOAGRIS</span>
                </div>
              </div>
            </div>
            <h1 className='text-2xl font-bold text-center text-[var(--dark-green)] mb-2'>
              Admin
            </h1>
            <p className='text-2xl font-bold text-center text-[var(--olive-green)] text-sm mb-6'>
              Access the ECOAGRIS Admin Dashboard
            </p>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className='block text-sm font-medium text-[var(--dark-green)] mb-1'>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              className="w-full px-4 py-3 border border-[var(--wine)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--yellow)] focus:border-transparent transition"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
             
          <div>
            <label className='block text-sm font-medium text-[var(--dark-green)] mb-1'>
              Password
             </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 border border-[var(--wine)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--yellow)] focus:border-transparent transition"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--dark-green)] hover:bg-[var(--yellow)] cursor-pointer text-[var(--white)] py-3 rounded-lg font-semibold hover:bg-[var(--olive-green)] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ?( <span className="flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin h-5 w-5"/>Signing In...</span>) : ("Login")}
          </button>

          {error && (
            <p className="text-[var(--red)] text-sm text-center mt-3 bg-red-50 py-2 px-4 rounded-md">
              {error}
            </p>
          )}
        </form>

        <p className="text-xs text-[var(--wine)] text-center mt-6">
          Only <span className="font-medium">admin</span> can access this panel.
        </p>
      </div>
    </div>
  );
}
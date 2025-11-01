'use client';

import { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Admin Login</h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ecoagris.org"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>

          {error && (
            <p className="text-red-600 text-sm text-center mt-3 bg-red-50 py-2 px-4 rounded-md">
              {error}
            </p>
          )}
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Only <span className="font-medium">admin@ecoagris.org</span> can access this panel.
        </p>
      </div>
    </div>
  );
}
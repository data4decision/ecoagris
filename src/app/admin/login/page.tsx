// src/app/admin/login/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const isNavigating = useRef(false);

  // Auto-redirect if already logged in as admin
  useEffect(() => {
    if (isNavigating.current) return;

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user && !isNavigating.current) {
        isNavigating.current = true;
        try {
          const idTokenResult = await user.getIdTokenResult();
          const payload = idTokenResult.claims;

          if (payload.email === 'admin@ecoagris.org') {
            router.push('/admin/admin-dashboard');
          } else {
            await auth.signOut();
            isNavigating.current = false;
          }
        } catch {
          await auth.signOut();
          isNavigating.current = false;
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isNavigating.current) return;

    setLoading(true);
    setError('');
    isNavigating.current = true;

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idTokenResult = await cred.user.getIdTokenResult();
      const payload = idTokenResult.claims;

      if (payload.email !== 'admin@ecoagris.org') {
        await auth.signOut();
        setError('Access denied. Admin only.');
        isNavigating.current = false;
        setLoading(false);
        return;
      }

      // Firebase handles session — no localStorage!
      router.push('/admin/admin-dashboard');
    } catch (err: unknown) {
      isNavigating.current = false;
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg mt-20">
      <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@ecoagris.org"
          className="w-full px-4 py-2 border rounded-lg"
          required
          disabled={loading}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-2 border rounded-lg"
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-300 text-white py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </form>
    </div>
  );
}
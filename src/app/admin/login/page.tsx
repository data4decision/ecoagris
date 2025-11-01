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
  const isNavigating = useRef(false); // Prevent double navigation

  const decodeTokenPayload = (idToken: string): { email?: string } | null => {
    try {
      const payload = idToken.split('.')[1];
      return JSON.parse(atob(payload)) as { email?: string };
    } catch {
      return null;
    }
  };

  // Auto-redirect ONLY if not already navigating
  useEffect(() => {
    if (isNavigating.current) return;

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user && !isNavigating.current) {
        isNavigating.current = true;
        const idToken = await user.getIdToken();
        const payload = decodeTokenPayload(idToken);

        if (payload?.email === 'admin@ecoagris.org') {
          localStorage.setItem('admin-token', idToken);
          // Use router.push for SPA navigation (no full reload)
          router.push('/admin/admin-dashboard');
        } else {
          await auth.signOut();
          isNavigating.current = false;
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Critical!
    if (loading || isNavigating.current) return;

    setLoading(true);
    setError('');
    isNavigating.current = true;

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      const payload = decodeTokenPayload(idToken);

      if (!payload || payload.email !== 'admin@ecoagris.org') {
        await auth.signOut();
        setError('Access denied. Admin only.');
        isNavigating.current = false;
        setLoading(false);
        return;
      }

      localStorage.setItem('admin-token', idToken);
      router.push('/admin/admin-dashboard'); // SPA navigation
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
          className="w-full bg-yellow-700 text-white py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </form>
    </div>
  );
}
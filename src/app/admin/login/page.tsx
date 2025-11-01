// src encontram/app/admin/login/page.tsx
'use client';                     // ← client UI
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';

// ──────────────────────────────────────────────────────────────
//  SERVER PART (Node.js runtime) – runs inside the same file
// ──────────────────────────────────────────────────────────────
'use server';
export const runtime = 'nodejs';   // enables fs, child_process, etc.

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { adminAuth } from '@/app/lib/firebaseAdmin';

interface AuthError extends Error {
  code?: string;
}

/** Server action – verify token, set cookie, redirect */
async function loginAction(idToken: string) {
  headers(); // guarantee server-only

  if (!idToken || typeof idToken !== 'string' || idToken.length < 100) {
    return { error: 'Invalid token. Please log in again.' };
  }

  const cookieStore = await cookies();

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    // admin-only check
    if (decoded.email !== 'admin@ecoagris.org') {
      return { error: 'Access denied. Admin only.' };
    }

    // HttpOnly cookie
    cookieStore.set('admin-session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    redirect('/admin/admin-dashboard');
  } catch (e: unknown) {
    const err = e as AuthError;
    console.error('loginAction error:', err.message, err.code);
    return { error: 'Authentication failed. Please try again.' };
  }
}

// ──────────────────────────────────────────────────────────────
//  API ROUTE – called from the client
// ──────────────────────────────────────────────────────────────
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    const result = await loginAction(idToken as string);

    if (result?.error) {
      return Response.json({ error: result.error }, { status: 401 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }
}

// ──────────────────────────────────────────────────────────────
//  CLIENT UI
// ──────────────────────────────────────────────────────────────
export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();

      const res = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        // server already redirected – force client navigation as fallback
        window.location.href = '/admin/admin-dashboard';
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
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
          className="w-full bg-green-700 text-white py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </form>
    </div>
  );
}
// src/app/admin/login/action.ts
'use server';

export const runtime = 'nodejs'; // ← THIS IS THE FIX

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { adminAuth } from '@/app/lib/firebaseAdmin';

interface AuthError extends Error {
  code?: string;
}

export async function loginAction(idToken: string) {
  headers(); // Force server

  if (!idToken || idToken.length < 50) {
    return { error: 'Invalid session. Please log in again.' };
  }

  const cookieStore = await cookies();

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    if (decoded.email !== 'admin@ecoagris.org') {
      return { error: 'Access denied. Admin only.' };
    }

    cookieStore.set('admin-session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    redirect('/admin/admin-dashboard');
  } catch (error: unknown) {
    const err = error as AuthError;

    if (err.code?.startsWith('auth/')) {
      return { error: 'Invalid session. Please log in again.' };
    }

    console.error('Login failed:', err);
    return { error: 'Authentication failed. Please try again.' };
  }
}
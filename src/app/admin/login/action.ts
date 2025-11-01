// src/app/admin/login/action.ts
'use server';

export const runtime = 'nodejs'; // ← CRITICAL: Enables fs, child_process

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { adminAuth } from '@/app/lib/firebaseAdmin';

interface AuthError extends Error {
  code?: string;
}

export async function loginAction(idToken: string) {
  headers(); // Force server-only

  if (!idToken || typeof idToken !== 'string' || idToken.length < 100) {
    return { error: 'Invalid token. Please log in again.' };
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
    console.error('Login failed:', err.message, err.code);
    return { error: 'Authentication failed. Please try again.' };
  }
}
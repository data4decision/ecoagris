// src/app/admin/login/action.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers'; // ← ADD THIS
import { adminAuth } from '@/app/lib/firebaseAdmin';

type LoginResult = { error?: string };

interface FirebaseAdminError extends Error {
  code?: string;
}

export async function loginAction(idToken: string): Promise<LoginResult> {
  // FORCE SERVER-ONLY EXECUTION
  headers(); // This throws if called from client

  const cookieStore = await cookies();

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (decodedToken.email !== 'admin@ecoagris.org') {
      return { error: 'Access denied. Admin only.' };
    }

    cookieStore.set('admin-session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // This will now work without NEXT_REDIRECT
    redirect('/admin/admin-dashboard');
  } catch (error: unknown) {
    if (error instanceof Error) {
      const firebaseError = error as FirebaseAdminError;
      const code = firebaseError.code;

      if (code === 'auth/id-token-expired') {
        return { error: 'Session expired. Please log in again.' };
      }
      if (code === 'auth/invalid-id-token') {
        return { error: 'Invalid session. Please log in again.' };
      }
      if (code === 'auth/argument-error') {
        return { error: 'Invalid token format.' };
      }
    }

    console.error('Login action failed:', error);
    return { error: 'Authentication failed. Please try again.' };
  }
}
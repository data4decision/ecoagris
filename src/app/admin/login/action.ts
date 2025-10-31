// src/app/admin/login/action.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/app/lib/firebaseAdmin';
import { FirebaseError } from 'firebase-admin/auth';

type LoginResult = { error?: string };

export async function loginAction(idToken: string): Promise<LoginResult> {
  const cookieStore = await cookies();

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Restrict to admin email
    if (decodedToken.email !== 'admin@ecoagris.org') {
      return { error: 'Access denied. Admin only.' };
    }

    // Set secure HttpOnly cookie
    cookieStore.set('admin-session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    redirect('/admin/admin-dashboard');
  } catch (error: unknown) {
    if (error instanceof FirebaseError) {
      if (error.code === 'auth/id-token-expired') {
        return { error: 'Session expired. Please log in again.' };
      }
      if (error.code === 'auth/invalid-id-token') {
        return { error: 'Invalid session. Please log in again.' };
      }
    }

    console.error('Login action failed:', error);
    return { error: 'Authentication failed. Please try again.' };
  }
}
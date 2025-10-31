'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/app/lib/firebaseAdmin';

type LoginResult = { error?: string };

interface FirebaseAdminError extends Error {
  code?: string;
}

export async function loginAction(idToken: string): Promise<LoginResult> {
  const cookieStore = await cookies();

  console.log('Login action started');
  console.log('idToken exists:', !!idToken);
  console.log('idToken length:', idToken?.length);

  try {
    console.log('Verifying ID token with Firebase Admin...');
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    console.log('Token verified. UID:', decodedToken.uid);
    console.log('Email:', decodedToken.email);

    if (decodedToken.email !== 'admin@ecoagris.org') {
      console.log('Access denied: not admin email');
      return { error: 'Access denied. Admin only.' };
    }

    console.log('Setting HttpOnly cookie...');
    cookieStore.set('admin-session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    console.log('Redirecting to dashboard...');
    redirect('/admin/admin-dashboard');
  } catch (error: unknown) {
    // LOG THE ACTUAL ERROR
    console.error('LOGIN ACTION FAILED:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

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

    return { error: 'Authentication failed. Please try again.' };
  }
}
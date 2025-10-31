'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authAdmin } from '@/app/lib/firebaseAdmin';
import { FirebaseError } from 'firebase-admin/auth'; // ← Critical import

// Define return type
type LoginResult = { error?: string };

export async function loginAction(idToken: string): Promise<LoginResult> {
  const cookieStore = await cookies();

  try {
    // 1. Verify Firebase ID token (type-safe)
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Restrict to admin email (optional but recommended)
    if (decodedToken.email !== 'admin@ecoagris.org') {
      return { error: 'Access denied. Admin only.' };
    }

    // 3. Set secure HttpOnly cookie
    cookieStore.set('admin-session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // 4. Server-side redirect
    redirect('/admin/admin-dashboard');
  } catch (error: unknown) {
    // 5. Type-safe error handling
    if (error instanceof FirebaseError) {
      // Firebase Admin SDK errors
      if (error.code === 'auth/id-token-expired') {
        return { error: 'Session expired. Please log in again.' };
      }
      if (error.code === 'auth/invalid-id-token') {
        return { error: 'Invalid session. Please log in again.' };
      }
    }

    // Log for debugging (Vercel logs)
    console.error('Login action failed:', error);

    // Generic fallback
    return { error: 'Authentication failed. Please try again.' };
  }
}
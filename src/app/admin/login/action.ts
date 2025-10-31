

'use server';

import { adminAuth } from '@/app/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function loginAction(idToken: string) {
  try {
    // Verify ID token
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Optional: Restrict to admin emails
    if (!decoded.email?.endsWith('@ecoagris.org')) {
      return { error: 'Unauthorized: Only @ecoagris.org emails allowed' };
    }

    // Create session cookie (5 days)
    const expiresIn = 60 * 60 * 24 * 5;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'admin-token',
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn,
    });

    return { success: true };
  } catch (error: unknown) {
    // Safely extract message from unknown error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Login action error:', errorMessage);
    return { error: 'Invalid token', details: errorMessage };
  }
}
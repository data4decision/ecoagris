'use server';

import { adminAuth } from '@/app/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export async function loginAction(idToken: string) {
  try {
    // Verify ID token
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Optional: Restrict to admin emails
    if (!decoded.email?.endsWith('@ecoagris.org')) {
      return { error: 'Unauthorized' };
    }

    // Create session cookie (5 days)
    const expiresIn = 60 * 60 * 24 * 5;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set HttpOnly cookie
    cookies().set({
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
    console.error('Login action error:', error.message);
    return { error: 'Invalid token', details: error.message };
  }
}
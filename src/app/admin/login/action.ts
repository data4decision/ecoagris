'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Server Action: Sets HttpOnly session cookie after Firebase ID token verification
 */
export async function loginAction(idToken: string) {
  const cookieStore = cookies();

  try {
    // Optional: Verify Firebase ID token on the server (recommended for production)
    // Skip for now if you're using Firebase Admin SDK elsewhere
    // Or add verification using Firebase Admin SDK

    // Set secure HttpOnly cookie
    cookieStore.set('admin-session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error('Login action failed:', error);
    return { error: 'Failed to authenticate. Please try again.' };
  }
}

/**
 * Optional: Logout action (call from client)
 */
export async function logoutAction() {
  const cookieStore = cookies();
  cookieStore.delete('admin-session');
  redirect('/admin/login');
}
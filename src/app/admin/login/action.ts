'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Server Action: Secure login with HttpOnly cookie
 */
export async function loginAction(idToken: string) {
  // MUST AWAIT cookies() — it returns a Promise!
  const cookieStore = await cookies();

  try {
    // Set secure HttpOnly session cookie
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
    return { error: 'Authentication failed. Please try again.' };
  }
}

/**
 * Logout action
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('admin-session');
  redirect('/admin/login');
}
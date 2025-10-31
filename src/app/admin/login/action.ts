// src/app/admin/login/action.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(idToken: string) {
  const cookieStore = await cookies();

  try {
    // Set HttpOnly cookie
    cookieStore.set('admin-session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // REDIRECT HERE — SERVER-SIDE
    redirect('/admin/admin-dashboard');
  } catch (error) {
    console.error('Login failed:', error);
    return { error: 'Authentication failed.' };
  }
}
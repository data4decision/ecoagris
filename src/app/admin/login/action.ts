// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    if (decoded.email !== 'admin@ecoagris.org') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const response = NextResponse.redirect(new URL('/admin/admin-dashboard', request.url));

    response.cookies.set('admin-session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
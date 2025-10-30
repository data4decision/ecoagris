// src/app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Optional: Restrict to specific domain
    if (!decoded.email?.endsWith('@ecoagris.org')) {
      return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 });
    }

    const expiresIn = 60 * 60 * 24 * 7; // 7 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin-token', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: expiresIn,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
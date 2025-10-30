// src/app/api/admin/auth/login/route.ts
import { NextRequest } from 'next/server';
import { adminAuth } from '@/app/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  let idToken: string;

  try {
    const body = await req.json();
    idToken = body.idToken;
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!idToken) {
    return Response.json({ error: 'Missing idToken' }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    console.log('Token verified for:', decoded.email);

    const expiresIn = 60 * 60 * 24 * 5; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = Response.json({ success: true });
    response.cookies.set({
      name: 'admin-token',
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresIn,
    });

    return response;
  } catch (error: unknown) {
    console.error('Token verification failed:', error.message);
    return Response.json(
      { error: 'Invalid token', details: error.message },
      { status: 401 }
    );
  }
}
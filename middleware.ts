// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/app/lib/firebaseAdmin';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    const session = req.cookies.get('admin-token')?.value;
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    try {
      await adminAuth.verifySessionCookie(session, true);
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL('/admin/login', req.url));
      res.cookies.delete('admin-token');
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
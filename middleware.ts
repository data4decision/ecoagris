// // src/middleware.ts
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { adminAuth } from '@/app/lib/firebaseAdmin';

// export async function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;

//   // Allow login page
//   if (pathname === '/admin/login') {
//     return NextResponse.next();
//   }

//   // Protect all /admin routes
//   if (pathname.startsWith('/admin')) {
//     const session = req.cookies.get('admin-token')?.value;
//     if (!session) {
//       return NextResponse.redirect(new URL('/admin/login', req.url));
//     }

//     try {
//       await adminAuth.verifySessionCookie(session, true);
//       return NextResponse.next();
//     } catch {
//       const res = NextResponse.redirect(new URL('/admin/login', req.url));
//       res.cookies.delete('admin-token');
//       return res;
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: '/admin/:path*',
// };

// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/app/lib/firebaseAdmin';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes
  const publicRoutes = ['/', '/login', '/api/public'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Admin routes
  const isAdminRoute = pathname.startsWith('/admin');
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  try {
    // Verify token using Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Optional: Check if user is admin
    const user = await adminAuth.getUser(uid);
    if (!user.customClaims?.admin) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Attach user to headers
    const response = NextResponse.next();
    response.headers.set('x-user-id', uid);
    response.headers.set('x-user-email', user.email || '');
    return response;
  } catch (error) {
    console.error('Middleware auth error:', error);
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
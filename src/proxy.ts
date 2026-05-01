import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
    '/',
    '/auth/super-admin/login',
    '/auth/super-admin/verify-2fa',
    '/auth/super-admin/forgot-password',
    '/auth/organization/login',
    '/auth/organization/verify-2fa',
    '/auth/organization/forgot-password',
    '/auth/user/login',
    '/auth/user/verify-2fa',
    '/auth/user/forgot-password',
    '/auth/professional/register',
    '/auth/reset-password',
];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (publicRoutes.some((route) => pathname === route || pathname.startsWith('/_next') || pathname.startsWith('/api'))) {
        return NextResponse.next();
    }

    // MOCK: Check for auth token in cookies
    // In production, this would verify JWT from HTTP-only cookie
    const token = request.cookies.get('auth_token')?.value;

    // For now, allow all routes in development (mock mode)
    // When backend is ready, uncomment the redirect below:
    // if (!token) {
    //   return NextResponse.redirect(new URL('/', request.url));
    // }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
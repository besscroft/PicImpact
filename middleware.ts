import { auth } from '~/server/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {

  if (req.nextUrl.pathname.startsWith('/api/v1') && !req.auth) {
    return Response.json(
      { success: false, message: 'authentication failed' },
      { status: 401 }
    )
  }
  if (req.nextUrl.pathname.startsWith('/admin') && !req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (req.auth && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.url))
  }
});

// Optionally, don't invoke Middleware on some paths
// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/admin/:path*",
    '/api/v1/:path*',
  ],
}
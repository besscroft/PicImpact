import { auth } from '~/utils/lib/auth'

export default auth;

export const config = {
  matcher: ["/admin/:path*"],
}
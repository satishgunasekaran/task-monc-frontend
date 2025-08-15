import { type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
runtime: 'experimental-edge',
  unstable_allowDynamic: [
    // Allow dynamic imports from Supabase packages
    '**/node_modules/@supabase/supabase-js/dist/module/index.js',
    '**/node_modules/@supabase/ssr/dist/module/index.js',
  ],
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_COOKIE = 'admin_session'
const PROTECTED = ['/admin', '/ny', '/api/admin']

async function sha256(value: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (!isProtected) return NextResponse.next()
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value
  const expected = await sha256(process.env.ADMIN_PASSWORD ?? '')
  if (cookie !== expected) return NextResponse.redirect(new URL('/logg-inn', req.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/ny', '/ny/:path*', '/api/admin/:path*'],
}

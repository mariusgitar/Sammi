export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

async function sha256(value: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string }
  const providedHash = await sha256(body.password ?? '')
  const expectedHash = await sha256(process.env.ADMIN_PASSWORD ?? '')

  if (providedHash !== expectedHash) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: 'admin_session',
    value: expectedHash,
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })

  return response
}

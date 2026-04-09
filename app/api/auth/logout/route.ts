import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: 'admin_session',
    value: '',
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
  })
  return response
}

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { sessions } from '@/db/schema'
import { normalizeSession } from '@/app/lib/normalizeSession'

export async function GET(_: Request, { params }: { params: { code: string } }) {
  const db = getDb()
  const code = params.code.toUpperCase()
  const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1)

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json(normalizeSession(session as Record<string, unknown>))
}

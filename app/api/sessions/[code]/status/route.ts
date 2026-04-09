export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { sessions } from '@/db/schema'
import { normalizeSession } from '@/app/lib/normalizeSession'

const VALID_STATUS = new Set(['setup', 'active', 'paused', 'closed'])

export async function PATCH(request: Request, { params }: { params: { code: string } }) {
  const db = getDb()
  const body = (await request.json()) as { status?: string }
  const nextStatus = body.status ?? ''

  if (!VALID_STATUS.has(nextStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updated = await db
    .update(sessions)
    .set({ status: nextStatus as 'setup' | 'active' | 'paused' | 'closed' })
    .where(eq(sessions.code, params.code.toUpperCase()))
    .returning()

  if (updated.length === 0) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json(normalizeSession(updated[0] as Record<string, unknown>))
}

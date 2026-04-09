export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { sessions } from '@/db/schema'
import { normalizeSession } from '@/app/lib/normalizeSession'

type SessionPatchBody = {
  title?: string
  tags?: string[] | null
  allowNewItems?: boolean
  dotBudget?: number
  allowMultipleDots?: boolean
  maxRankItems?: number
  innspillMode?: string
  innspillMaxChars?: number
}

export async function GET(_: Request, { params }: { params: { code: string } }) {
  const db = getDb()
  const code = params.code.toUpperCase()
  const [session] = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1)

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json(normalizeSession(session as Record<string, unknown>))
}

export async function PATCH(request: Request, { params }: { params: { code: string } }) {
  const db = getDb()
  const code = params.code.toUpperCase()
  const body = (await request.json()) as SessionPatchBody

  const updateData: Partial<typeof sessions.$inferInsert> = {}

  if (body.title !== undefined) updateData.title = body.title
  if (body.tags !== undefined) updateData.tags = body.tags
  if (body.allowNewItems !== undefined) updateData.allowNewItems = body.allowNewItems
  if (body.dotBudget !== undefined) updateData.dotBudget = body.dotBudget
  if (body.allowMultipleDots !== undefined) updateData.allowMultipleDots = body.allowMultipleDots
  if (body.maxRankItems !== undefined) updateData.maxRankItems = body.maxRankItems
  if (body.innspillMode !== undefined) updateData.innspillMode = body.innspillMode
  if (body.innspillMaxChars !== undefined) updateData.innspillMaxChars = body.innspillMaxChars

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const [updated] = await db
    .update(sessions)
    .set(updateData)
    .where(eq(sessions.code, code))
    .returning()

  if (!updated) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json(normalizeSession(updated as Record<string, unknown>))
}

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { responses } from '@/db/schema'

type ResponsePayload = {
  sessionId?: string
  itemId?: string
  participantId?: string
  value?: string
}

function toResponseJson(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ''),
    sessionId: String(row.session_id ?? row.sessionId ?? ''),
    itemId: String(row.item_id ?? row.itemId ?? ''),
    participantId: String(row.participant_id ?? row.participantId ?? ''),
    value: String(row.value ?? ''),
    createdAt: String(row.created_at ?? row.createdAt ?? ''),
  }
}

export async function POST(request: Request) {
  const db = getDb()
  const body = (await request.json()) as ResponsePayload

  const sessionId = body.sessionId?.trim() ?? ''
  const itemId = body.itemId?.trim() ?? ''
  const participantId = body.participantId?.trim() ?? ''
  const value = body.value?.trim() ?? ''

  if (!sessionId || !itemId || !participantId || !value) {
    return NextResponse.json({ error: 'sessionId, itemId, participantId, and value are required' }, { status: 400 })
  }

  const [existing] = await db
    .select()
    .from(responses)
    .where(
      and(
        eq(responses.sessionId, sessionId),
        eq(responses.itemId, itemId),
        eq(responses.participantId, participantId),
      ),
    )
    .limit(1)

  if (existing) {
    const [updated] = await db
      .update(responses)
      .set({ value })
      .where(eq(responses.id, existing.id))
      .returning()

    return NextResponse.json(toResponseJson(updated as Record<string, unknown>))
  }

  const [inserted] = await db
    .insert(responses)
    .values({ sessionId, itemId, participantId, value })
    .returning()

  return NextResponse.json(toResponseJson(inserted as Record<string, unknown>))
}

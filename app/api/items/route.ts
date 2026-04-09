export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { items } from '@/db/schema'

type ItemPayload = {
  text: string
  orderIndex: number
}

function toItemResponse(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ''),
    text: String(row.text ?? ''),
    orderIndex: Number(row.order_index ?? row.orderIndex ?? 0),
    excluded: Boolean(row.excluded ?? false),
    isQuestion: Boolean(row.is_question ?? row.isQuestion ?? false),
    questionStatus: String(row.question_status ?? row.questionStatus ?? 'inactive'),
    defaultTag: (row.default_tag ?? row.defaultTag ?? null) as string | null,
    isNew: Boolean(row.is_new ?? row.isNew ?? false),
    createdBy: (row.created_by ?? row.createdBy ?? null) as string | null,
  }
}

export async function GET(request: Request) {
  const db = getDb()
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(items)
    .where(and(eq(items.sessionId, sessionId), eq(items.excluded, false)))
    .orderBy(asc(items.orderIndex))

  return NextResponse.json(rows.map((row) => toItemResponse(row as Record<string, unknown>)))
}

export async function POST(request: Request) {
  const db = getDb()
  const body = (await request.json()) as { sessionId?: string; items?: ItemPayload[] }

  const sessionId = body.sessionId ?? ''
  const payload = body.items ?? []

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  if (payload.length === 0) {
    return NextResponse.json({ error: 'items cannot be empty' }, { status: 400 })
  }

  const insertedRows: Record<string, unknown>[] = []

  for (const entry of payload) {
    const text = entry.text?.trim() ?? ''
    if (!text) continue

    const [inserted] = await db
      .insert(items)
      .values({
        sessionId,
        text,
        orderIndex: Number.isFinite(entry.orderIndex) ? entry.orderIndex : 0,
      })
      .returning()

    if (inserted) {
      insertedRows.push(inserted as Record<string, unknown>)
    }
  }

  return NextResponse.json(insertedRows.map((row) => toItemResponse(row)))
}

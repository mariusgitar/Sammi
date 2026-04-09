import { NextResponse } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { innspill, items, responses, sessions, themes } from '@/db/schema'
import { normalizeSession } from '@/app/lib/normalizeSession'

export async function GET(request: Request, { params }: { params: { code: string } }) {
  const db = getDb()
  const participantId = new URL(request.url).searchParams.get('participantId') ?? ''

  const [sessionRow] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.code, params.code.toUpperCase()))
    .limit(1)

  if (!sessionRow) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const session = normalizeSession(sessionRow as Record<string, unknown>)

  const itemRows = await db
    .select()
    .from(items)
    .where(and(eq(items.sessionId, session.id), eq(items.excluded, false)))
    .orderBy(asc(items.orderIndex))

  const innspillRows = session.moduleType === 'aapne-innspill'
    ? await db.select().from(innspill).where(eq(innspill.sessionId, session.id))
    : []

  const themeRows = await db
    .select()
    .from(themes)
    .where(eq(themes.sessionId, session.id))
    .orderBy(asc(themes.orderIndex))

  const myResponseRows = participantId
    ? await db
      .select()
      .from(responses)
      .where(and(eq(responses.sessionId, session.id), eq(responses.participantId, participantId)))
    : []

  return NextResponse.json({
    session,
    items: itemRows.map((row) => ({
      id: row.id,
      text: row.text,
      orderIndex: row.orderIndex,
      excluded: row.excluded,
      isQuestion: row.isQuestion,
      questionStatus: row.questionStatus,
      defaultTag: row.defaultTag,
      isNew: row.isNew,
      createdBy: row.createdBy,
    })),
    innspill: innspillRows.map((row) => ({
      id: row.id,
      questionId: row.questionId,
      participantId: row.participantId,
      nickname: row.nickname,
      text: row.text,
      detaljer: row.detaljer,
      likes: row.likes,
    })),
    themes: themeRows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      orderIndex: row.orderIndex,
    })),
    myResponses: myResponseRows.map((row) => ({
      id: row.id,
      itemId: row.itemId,
      value: row.value,
    })),
  })
}

import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { sessions } from '@/db/schema'
import { normalizeSession } from '@/app/lib/normalizeSession'

function randomCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
}

export async function POST(request: Request) {
  const db = getDb()
  const body = (await request.json()) as { title?: string; moduleType?: string; tags?: string[] }

  if (!body.title || !body.moduleType) {
    return NextResponse.json({ error: 'title and moduleType are required' }, { status: 400 })
  }

  let code = randomCode()
  // avoid db.transaction() for neon-http compatibility
  for (let i = 0; i < 20; i += 1) {
    const existing = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.code, code)).limit(1)
    if (existing.length === 0) break
    code = randomCode()
  }

  const [newRow] = await db.insert(sessions).values({
    code,
    title: body.title,
    moduleType: body.moduleType,
    tags: body.tags ?? null,
  }).returning()

  return NextResponse.json(normalizeSession(newRow as Record<string, unknown>), { status: 201 })
}

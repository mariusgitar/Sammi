export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { getDb } from '@/db'
import { sessions } from '@/db/schema'
import { normalizeSession } from '@/app/lib/normalizeSession'

export async function GET() {
  const db = getDb()
  const rows = await db.select().from(sessions).orderBy(desc(sessions.createdAt))
  return NextResponse.json(rows.map((row) => normalizeSession(row as Record<string, unknown>)))
}

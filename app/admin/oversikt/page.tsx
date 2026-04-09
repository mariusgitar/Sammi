'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { NormalizedSession } from '@/app/lib/normalizeSession'

export default function OversiktPage() {
  const [sessions, setSessions] = useState<NormalizedSession[]>([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const res = await fetch('/api/admin/sessions')
      if (!res.ok) return
      const data = (await res.json()) as NormalizedSession[]
      if (mounted) setSessions(data)
    }
    load()
  }, [])

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sesjonsoversikt</h1>
        <Link href="/ny" className="rounded-full bg-[#0f172a] px-4 py-2 text-white">Ny sesjon</Link>
      </div>
      <ul className="space-y-3">
        {sessions.map((session) => (
          <li key={session.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <Link href={`/admin/${session.code}`} className="block">
              <p className="font-semibold">{session.title}</p>
              <p className="text-sm text-slate-600">{session.code} · {session.status} · {session.moduleType}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}

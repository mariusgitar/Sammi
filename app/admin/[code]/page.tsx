'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { NormalizedSession } from '@/app/lib/normalizeSession'

export default function AdminSessionPage() {
  const params = useParams<{ code: string }>()
  const code = params.code.toUpperCase()
  const [session, setSession] = useState<NormalizedSession | null>(null)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/sessions/${code}`)
      if (!res.ok) return
      setSession((await res.json()) as NormalizedSession)
    }
    load()
  }, [code])

  async function updateStatus(status: 'active' | 'paused' | 'closed') {
    const res = await fetch(`/api/sessions/${code}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) return
    setSession((await res.json()) as NormalizedSession)
  }

  if (!session) return <main className="p-6">Laster…</main>

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">{session.title}</h1>
      <p className="mt-2 text-slate-600">Kode: {session.code} · {session.moduleType} · {session.status}</p>
      <div className="mt-4 flex gap-2">
        <button onClick={() => updateStatus('active')} className="rounded-full bg-[#0f172a] px-4 py-2 text-white">Start</button>
        <button onClick={() => updateStatus('paused')} className="rounded-full border border-slate-200 px-4 py-2">Pause</button>
        <button onClick={() => updateStatus('closed')} className="rounded-full border border-red-200 px-4 py-2 text-red-600">Close</button>
      </div>
      <p className="mt-6">Bli med-lenke: <Link href={`/delta/${session.code}`} className="text-blue-600 underline">/delta/{session.code}</Link></p>
    </main>
  )
}

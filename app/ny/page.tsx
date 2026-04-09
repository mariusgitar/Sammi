'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

type CreateResponse = { code: string }

const moduleTypes = ['kartlegging', 'skala', 'dot-voting', 'aapne-innspill', 'rangering']

export default function NewSessionPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [moduleType, setModuleType] = useState(moduleTypes[0])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, moduleType }),
    })
    if (!res.ok) return
    const data = (await res.json()) as CreateResponse
    router.push(`/admin/${data.code}`)
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Ny sesjon</h1>
      <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tittel"
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          required
        />
        <select
          value={moduleType}
          onChange={(e) => setModuleType(e.target.value)}
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2"
        >
          {moduleTypes.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <button type="submit" className="mt-4 rounded-full bg-[#0f172a] px-4 py-2 text-white">Opprett</button>
      </form>
    </main>
  )
}

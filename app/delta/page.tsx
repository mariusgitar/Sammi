'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeltaJoinPage() {
  const router = useRouter()
  const [code, setCode] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!code.trim()) return
    router.push(`/delta/${code.trim().toUpperCase()}`)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form onSubmit={onSubmit} className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Bli med i sesjon</h1>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Kode"
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 uppercase"
        />
        <button type="submit" className="mt-4 w-full rounded-full bg-[#0f172a] px-4 py-2 text-white">Fortsett</button>
      </form>
    </main>
  )
}

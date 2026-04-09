'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import type { NormalizedSession } from '@/app/lib/normalizeSession'

type AdminItem = {
  id: string
  text: string
  orderIndex: number
  excluded: boolean
  isQuestion: boolean
  questionStatus: string
  defaultTag: string | null
  isNew: boolean
  createdBy: string | null
}

const POLL_MS = 10_000

export default function AdminSessionPage() {
  const params = useParams<{ code: string }>()
  const code = String(params.code ?? '').toUpperCase()

  const [session, setSession] = useState<NormalizedSession | null>(null)
  const [items, setItems] = useState<AdminItem[]>([])
  const [newItemsText, setNewItemsText] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isAddingItems, setIsAddingItems] = useState(false)

  const initialized = useRef(false)

  useEffect(() => {
    if (!code) return

    let mounted = true

    const load = async () => {
      const sessionRes = await fetch(`/api/sessions/${code}`)
      if (sessionRes.ok) {
        const incomingSession = (await sessionRes.json()) as NormalizedSession
        if (!mounted) return

        if (!initialized.current) {
          initialized.current = true
          setSession(incomingSession)
        } else {
          setSession(incomingSession)
        }

        const itemsRes = await fetch(`/api/items?sessionId=${encodeURIComponent(incomingSession.id)}`)
        if (!itemsRes.ok || !mounted) return

        const incomingItems = (await itemsRes.json()) as AdminItem[]
        setItems((prev) => (incomingItems.length > 0 ? incomingItems : prev))
      }
    }

    void load()
    const interval = setInterval(() => {
      void load()
    }, POLL_MS)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [code])

  const joinUrl = useMemo(() => {
    if (typeof window === 'undefined' || !code) return ''
    return `${window.location.origin}/delta/${code}`
  }, [code])

  const updateStatus = async (status: 'active' | 'paused' | 'closed') => {
    if (!code) return

    setIsUpdatingStatus(true)
    try {
      const res = await fetch(`/api/sessions/${code}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) return
      const updated = (await res.json()) as NormalizedSession
      setSession(updated)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const addItems = async () => {
    if (!session) return

    const lines = newItemsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length === 0) return

    const payload = lines.map((text, index) => ({
      text,
      orderIndex: items.length + index,
    }))

    setIsAddingItems(true)
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, items: payload }),
      })

      if (!res.ok) return
      const inserted = (await res.json()) as AdminItem[]
      setItems((prev) => [...prev, ...inserted])
      setNewItemsText('')
    } finally {
      setIsAddingItems(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0f172a] p-6 text-white">
      <div className="mb-4 rounded-xl bg-[#1e293b] p-4">
        <h1 className="text-3xl font-bold">{session?.title ?? 'Laster sesjon...'}</h1>
        <p className="mt-2 text-3xl font-extrabold tracking-wide">{session?.code ?? code}</p>
        <p className="mt-2 text-slate-300">Modultype: {session?.moduleType ?? '-'}</p>
        <p className="text-slate-300">Status: {session?.status ?? '-'}</p>
      </div>

      <div className="mb-4 rounded-xl bg-[#1e293b] p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void updateStatus('active')}
            disabled={isUpdatingStatus || session?.status === 'active'}
            className="rounded-full bg-[#a78bfa] px-4 py-2 font-semibold text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => void updateStatus('paused')}
            disabled={isUpdatingStatus || session?.status === 'paused'}
            className="rounded-full bg-[#a78bfa] px-4 py-2 font-semibold text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={() => void updateStatus('closed')}
            disabled={isUpdatingStatus || session?.status === 'closed'}
            className="rounded-full bg-[#a78bfa] px-4 py-2 font-semibold text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Avslutt
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-[#1e293b] p-4">
        <p className="mb-2 font-semibold">Deltakerlenke</p>
        <div className="select-all break-all rounded-xl border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-200">
          {joinUrl || `/delta/${code}`}
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-[#1e293b] p-4">
        <p className="mb-2 font-semibold">Legg til elementer (ett per linje)</p>
        <textarea
          value={newItemsText}
          onChange={(event) => setNewItemsText(event.target.value)}
          rows={6}
          placeholder="Skriv ett element per linje"
          className="w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 py-2 text-white placeholder-slate-500"
        />
        <button
          type="button"
          onClick={() => void addItems()}
          disabled={isAddingItems}
          className="mt-3 rounded-full bg-[#a78bfa] px-4 py-2 font-semibold text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Legg til elementer
        </button>
      </div>

      <div className="mb-4 rounded-xl bg-[#1e293b] p-4">
        <p className="mb-2 font-semibold">Elementer</p>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-200">
              {item.text}
            </li>
          ))}
          {items.length === 0 && <li className="text-slate-400">Ingen elementer enda.</li>}
        </ul>
      </div>
    </main>
  )
}

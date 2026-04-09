'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import type { NormalizedSession } from '@/app/lib/normalizeSession'

type ItemRow = {
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

const POLL_INTERVAL = 10_000

export default function AdminSessionPage() {
  const params = useParams<{ code: string }>()
  const code = useMemo(() => params.code.toUpperCase(), [params.code])

  const [session, setSession] = useState<NormalizedSession | null>(null)
  const [items, setItems] = useState<ItemRow[]>([])
  const [newItemsText, setNewItemsText] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isAddingItems, setIsAddingItems] = useState(false)

  const sessionInitialized = useRef(false)
  const itemsInitialized = useRef(false)

  useEffect(() => {
    let active = true

    const loadSession = async () => {
      const res = await fetch(`/api/sessions/${code}`, { cache: 'no-store' })
      if (!res.ok) return

      const incoming = (await res.json()) as NormalizedSession
      if (!active || !incoming?.id) return

      if (!sessionInitialized.current) {
        setSession(incoming)
        sessionInitialized.current = true
        return
      }

      setSession((prev) => (incoming ? incoming : prev))
    }

    void loadSession()
    const intervalId = setInterval(() => {
      void loadSession()
    }, POLL_INTERVAL)

    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [code])

  useEffect(() => {
    if (!session?.id) return

    let active = true

    const loadItems = async () => {
      const res = await fetch(`/api/items?sessionId=${session.id}`, { cache: 'no-store' })
      if (!res.ok) return

      const incoming = (await res.json()) as ItemRow[]
      if (!active) return

      if (!itemsInitialized.current) {
        setItems(incoming)
        itemsInitialized.current = true
        return
      }

      setItems((prev) => (incoming.length > 0 ? incoming : prev))
    }

    void loadItems()
    const intervalId = setInterval(() => {
      void loadItems()
    }, POLL_INTERVAL)

    return () => {
      active = false
      clearInterval(intervalId)
    }
  }, [session?.id])

  async function updateStatus(status: 'active' | 'paused' | 'closed') {
    if (!session || session.status === status) return
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

  async function addItems() {
    if (!session?.id) return

    const lines = newItemsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length === 0) return

    setIsAddingItems(true)

    try {
      const payload = {
        sessionId: session.id,
        items: lines.map((text, index) => ({
          text,
          orderIndex: items.length + index,
        })),
      }

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) return

      const inserted = (await res.json()) as ItemRow[]
      setItems((prev) => [...prev, ...inserted].sort((a, b) => a.orderIndex - b.orderIndex))
      setNewItemsText('')
    } finally {
      setIsAddingItems(false)
    }
  }

  const joinLink = typeof window === 'undefined' ? `/delta/${code}` : `${window.location.origin}/delta/${code}`

  if (!session) {
    return (
      <main className="min-h-screen bg-[#0f172a] p-6 text-white">
        <div className="mx-auto max-w-4xl rounded-xl bg-[#1e293b] p-4">Laster sesjon…</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0f172a] p-6 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <section className="rounded-xl bg-[#1e293b] p-4">
          <h1 className="text-2xl font-semibold">{session.title}</h1>
          <p className="mt-3 text-4xl font-bold tracking-widest">{session.code}</p>
          <p className="mt-2 text-slate-300">Modul: {session.moduleType}</p>
          <p className="text-slate-300">Status: {session.status}</p>
        </section>

        <section className="rounded-xl bg-[#1e293b] p-4">
          <p className="mb-3 font-semibold">Statuskontroll</p>
          <div className="flex flex-wrap gap-2">
            {([
              { label: 'Start', status: 'active' },
              { label: 'Pause', status: 'paused' },
              { label: 'Avslutt', status: 'closed' },
            ] as const).map((entry) => {
              const disabled = isUpdatingStatus || session.status === entry.status
              return (
                <button
                  key={entry.status}
                  type="button"
                  onClick={() => void updateStatus(entry.status)}
                  disabled={disabled}
                  className={`rounded-full px-4 py-2 font-semibold text-[#0f172a] ${disabled ? 'cursor-not-allowed bg-[#a78bfa] opacity-40' : 'bg-[#a78bfa]'}`}
                >
                  {entry.label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-xl bg-[#1e293b] p-4">
          <p className="mb-2 font-semibold">Deltakerlenke</p>
          <p className="select-all break-all rounded-xl bg-[#0f172a] px-3 py-2 text-slate-200">{joinLink}</p>
        </section>

        <section className="rounded-xl bg-[#1e293b] p-4">
          <p className="mb-2 font-semibold">Legg til elementer (ett per linje)</p>
          <textarea
            value={newItemsText}
            onChange={(event) => setNewItemsText(event.target.value)}
            rows={7}
            placeholder="Skriv hvert element på en ny linje"
            className="w-full rounded-xl border border-slate-700 bg-[#0f172a] px-3 py-2 text-white"
          />
          <button
            type="button"
            onClick={() => void addItems()}
            disabled={isAddingItems}
            className={`mt-3 rounded-full px-4 py-2 font-semibold text-[#0f172a] ${isAddingItems ? 'cursor-not-allowed bg-[#a78bfa] opacity-40' : 'bg-[#a78bfa]'}`}
          >
            Legg til elementer
          </button>
        </section>

        <section className="rounded-xl bg-[#1e293b] p-4">
          <p className="mb-2 font-semibold">Elementer</p>
          {items.length === 0 ? (
            <p className="text-slate-300">Ingen elementer enda.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="rounded-lg bg-[#0f172a] px-3 py-2">
                  <span className="text-slate-400">#{item.orderIndex + 1}</span> {item.text}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

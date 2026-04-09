'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ModuleViewProps } from './types'

type VoteMap = Record<string, string>

export default function KartleggingView({ session, items, myResponses, participantId }: ModuleViewProps) {
  const initialized = useRef(false)
  const [votes, setVotes] = useState<VoteMap>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const doneStorageKey = `samen_module_done_${session.code}`
  const tags = session.tags ?? []
  const activeItems = useMemo(() => items.filter((item) => !item.excluded), [items])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const isDone = localStorage.getItem(doneStorageKey) === 'true'
    if (isDone) {
      setIsSubmitted(true)
      return
    }

    const initialVotes: VoteMap = {}

    for (const response of myResponses) {
      initialVotes[response.itemId] = response.value
    }

    for (const item of activeItems) {
      if (!initialVotes[item.id] && item.defaultTag) {
        initialVotes[item.id] = item.defaultTag
      }
    }

    setVotes(initialVotes)
  }, [activeItems, doneStorageKey, myResponses])

  const allTagged = useMemo(() => {
    if (activeItems.length === 0) return false
    return activeItems.every((item) => {
      const value = votes[item.id]
      return typeof value === 'string' && value.length > 0
    })
  }, [activeItems, votes])

  function selectTag(itemId: string, tagValue: string) {
    setVotes((prev) => ({
      ...prev,
      [itemId]: tagValue,
    }))
  }

  async function submitVotes() {
    if (isSubmitting || !allTagged || activeItems.length === 0) return

    const voteEntries = activeItems
      .map((item) => ({ itemId: item.id, value: votes[item.id] }))
      .filter((entry) => Boolean(entry.value))

    if (voteEntries.length === 0) return

    setIsSubmitting(true)

    try {
      for (const entry of voteEntries) {
        const res = await fetch('/api/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: session.id,
            itemId: entry.itemId,
            participantId,
            value: entry.value,
          }),
        })

        if (!res.ok) {
          throw new Error('Kunne ikke sende svar')
        }
      }

      localStorage.setItem(doneStorageKey, 'true')
      setIsSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-2xl bg-[#f8fafc] p-8 text-center text-lg font-semibold text-[#0f172a]">
        Svarene dine er registrert
      </div>
    )
  }

  return (
    <div className="bg-[#f8fafc]">
      {activeItems.map((item) => {
        const selectedTag = votes[item.id] ?? ''

        return (
          <section key={item.id} className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-[#0f172a]">{item.text}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTag === tag

                return (
                  <button
                    type="button"
                    key={`${item.id}-${tag}`}
                    onClick={() => selectTag(item.id, tag)}
                    className={isSelected
                      ? 'rounded-full bg-[#0f172a] px-3 py-1 text-sm text-white'
                      : 'rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600'}
                  >
                    {tag}
                    {item.defaultTag === tag ? <span className="ml-1 text-xs text-slate-400">foreslått</span> : null}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      <button
        type="button"
        disabled={!allTagged || isSubmitting}
        onClick={submitVotes}
        className="w-full rounded-full bg-[#0f172a] px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Send inn
      </button>
    </div>
  )
}

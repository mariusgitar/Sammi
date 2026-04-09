'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import WaitingScreen from '@/app/components/ui/WaitingScreen'
import ClosedScreen from '@/app/components/ui/ClosedScreen'
import { resolveView } from '@/app/lib/resolveView'
import type { NormalizedSession } from '@/app/lib/normalizeSession'
import KartleggingView from './modules/KartleggingView'
import SkalaView from './modules/SkalaView'
import DotVotingView from './modules/DotVotingView'
import InnspillView from './modules/InnspillView'
import RangeringView from './modules/RangeringView'
import type { Item, Response } from './modules/types'

type Theme = {
  id: string
  name: string
  color: string | null
  orderIndex: number | null
}

type InnspillEntry = {
  id: string
  questionId: string
  participantId: string
  nickname: string | null
  text: string
  detaljer: string | null
  likes: number | null
}

type DeltaState = {
  session: NormalizedSession
  items: Item[]
  innspill: InnspillEntry[]
  themes: Theme[]
  myResponses: Response[]
}

function createParticipantId() {
  return crypto.randomUUID()
}

export default function DeltaSessionPage() {
  const params = useParams<{ code: string }>()
  const code = params.code.toUpperCase()
  const router = useRouter()
  const initialized = useRef(false)

  const [participantId, setParticipantId] = useState<string>('')
  const [nickname, setNickname] = useState<string>('')
  const [nicknameDraft, setNicknameDraft] = useState<string>('')
  const [session, setSession] = useState<NormalizedSession | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [innspill, setInnspill] = useState<InnspillEntry[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [myResponses, setMyResponses] = useState<Response[]>([])

  useEffect(() => {
    const existing = localStorage.getItem('samen_participant_id')
    const resolved = existing || createParticipantId()
    if (!existing) localStorage.setItem('samen_participant_id', resolved)
    setParticipantId(resolved)

    const savedNickname = localStorage.getItem(`samen_nickname_${code}`)
    if (savedNickname) {
      setNickname(savedNickname)
      setNicknameDraft(savedNickname)
    }
  }, [code])

  useEffect(() => {
    if (!participantId) return

    const load = async () => {
      const res = await fetch(`/api/delta/${code}/state?participantId=${participantId}`)
      if (!res.ok) return
      const data = (await res.json()) as DeltaState

      if (!initialized.current) {
        initialized.current = true
        setSession(data.session)
        setItems(data.items)
        setInnspill(data.innspill)
        setThemes(data.themes)
        setMyResponses(data.myResponses)
        return
      }

      setSession(data.session)
      setItems((prev) => (data.items.length > 0 ? data.items : prev))
      setInnspill((prev) => (data.innspill.length > 0 ? data.innspill : prev))
      setThemes((prev) => (data.themes.length > 0 ? data.themes : prev))
      setMyResponses((prev) => (data.myResponses.length > 0 ? data.myResponses : prev))
    }

    load()
    const interval = window.setInterval(load, 5000)
    return () => window.clearInterval(interval)
  }, [code, participantId])

  const viewState = useMemo(() => (session ? resolveView(session) : { view: 'waiting', reason: 'Laster sesjon…' } as const), [session])

  function saveNickname() {
    if (!nicknameDraft.trim()) return
    localStorage.setItem(`samen_nickname_${code}`, nicknameDraft.trim())
    setNickname(nicknameDraft.trim())
  }

  if (!nickname) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold">Velg kallenavn</h1>
          <input
            value={nicknameDraft}
            onChange={(e) => setNicknameDraft(e.target.value)}
            placeholder="Kallenavn"
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
          <button onClick={saveNickname} className="mt-4 rounded-full bg-[#0f172a] px-4 py-2 text-white">Fortsett</button>
        </div>
      </main>
    )
  }

  if (!session && viewState.view === 'waiting') {
    return <main className="p-6"><WaitingScreen reason={viewState.reason} /></main>
  }

  if (!session) return <main className="p-6">Laster…</main>

  const moduleProps = { session, items, myResponses, participantId, nickname }

  switch (viewState.view) {
    case 'waiting':
      return <main className="p-6"><WaitingScreen reason={viewState.reason} /></main>
    case 'closed':
      return <main className="p-6"><ClosedScreen /></main>
    case 'results':
      router.push(`/delta/${code}/resultater`)
      return null
    case 'kartlegging':
      return <main className="p-6"><KartleggingView {...moduleProps} /></main>
    case 'skala':
      return <main className="p-6"><SkalaView {...moduleProps} /></main>
    case 'dot-voting':
      return <main className="p-6"><DotVotingView {...moduleProps} /></main>
    case 'aapne-innspill':
      return <main className="p-6"><InnspillView {...moduleProps} /></main>
    case 'rangering':
      return <main className="p-6"><RangeringView {...moduleProps} /></main>
    default:
      return <main className="p-6"><WaitingScreen reason="Ukjent visning" /></main>
  }
}

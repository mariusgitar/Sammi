import type { NormalizedSession } from './normalizeSession'

export type ViewState =
  | { view: 'waiting'; reason: string }
  | { view: 'kartlegging' }
  | { view: 'skala' }
  | { view: 'dot-voting' }
  | { view: 'aapne-innspill' }
  | { view: 'rangering' }
  | { view: 'results' }
  | { view: 'closed' }

export function resolveView(session: NormalizedSession): ViewState {
  if (session.status === 'closed') return { view: 'closed' }
  if (session.visibility.participant.showResults) return { view: 'results' }
  if (session.status !== 'active') return {
    view: 'waiting',
    reason: session.status === 'paused'
      ? 'Sesjonen er midlertidig pauset.'
      : 'Sesjonen har ikke startet ennå.',
  }
  switch (session.moduleType) {
    case 'kartlegging': return { view: 'kartlegging' }
    case 'flervalgstagging': return { view: 'kartlegging' }
    case 'skala': return { view: 'skala' }
    case 'dot-voting': return { view: 'dot-voting' }
    case 'aapne-innspill': return { view: 'aapne-innspill' }
    case 'rangering': return { view: 'rangering' }
    default: return { view: 'waiting', reason: 'Ukjent modultype.' }
  }
}

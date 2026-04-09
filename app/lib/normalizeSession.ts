import { getVisibility, type VisibilityConfig } from './getVisibility'

export type NormalizedSession = {
  id: string
  code: string
  title: string
  moduleType: string
  status: 'setup' | 'active' | 'paused' | 'closed'
  tags: string[] | null
  allowNewItems: boolean
  dotBudget: number
  allowMultipleDots: boolean
  maxRankItems: number
  innspillMode: string
  innspillMaxChars: number
  visibility: VisibilityConfig
  timerEndsAt: string | null
  timerLabel: string | null
  createdAt: string
}

export function normalizeSession(raw: Record<string, unknown>): NormalizedSession {
  return {
    id: String(raw.id ?? ''),
    code: String(raw.code ?? ''),
    title: String(raw.title ?? ''),
    moduleType: String(raw.module_type ?? raw.moduleType ?? ''),
    status: (raw.status ?? 'setup') as NormalizedSession['status'],
    tags: (raw.tags ?? null) as string[] | null,
    allowNewItems: Boolean(raw.allow_new_items ?? raw.allowNewItems ?? true),
    dotBudget: Number(raw.dot_budget ?? raw.dotBudget ?? 5),
    allowMultipleDots: Boolean(raw.allow_multiple_dots ?? raw.allowMultipleDots ?? false),
    maxRankItems: Number(raw.max_rank_items ?? raw.maxRankItems ?? 0),
    innspillMode: String(raw.innspill_mode ?? raw.innspillMode ?? 'enkel'),
    innspillMaxChars: Number(raw.innspill_max_chars ?? raw.innspillMaxChars ?? 500),
    visibility: getVisibility(raw.visibility),
    timerEndsAt: (raw.timer_ends_at ?? raw.timerEndsAt ?? null) as string | null,
    timerLabel: (raw.timer_label ?? raw.timerLabel ?? null) as string | null,
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
  }
}

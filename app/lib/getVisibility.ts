export type VisibilityConfig = {
  facilitator: {
    showRawResponses: boolean
    showDistribution: boolean
    showParticipantIds: boolean
  }
  participant: {
    showOwnResponses: boolean
    showAggregated: boolean
    showResults: boolean
  }
  presentation: {
    showResults: boolean
    pinnedItemIds: string[]
  }
}

const defaults: VisibilityConfig = {
  facilitator: {
    showRawResponses: true,
    showDistribution: true,
    showParticipantIds: true,
  },
  participant: {
    showOwnResponses: true,
    showAggregated: false,
    showResults: false,
  },
  presentation: {
    showResults: false,
    pinnedItemIds: [],
  },
}

export function getVisibility(raw: unknown): VisibilityConfig {
  if (!raw || typeof raw !== 'object') return defaults
  const r = raw as Record<string, unknown>
  return {
    facilitator: { ...defaults.facilitator, ...((r.facilitator as object) ?? {}) },
    participant: { ...defaults.participant, ...((r.participant as object) ?? {}) },
    presentation: { ...defaults.presentation, ...((r.presentation as object) ?? {}) },
  }
}

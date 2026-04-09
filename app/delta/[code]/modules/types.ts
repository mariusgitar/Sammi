import type { NormalizedSession } from '@/app/lib/normalizeSession'

export type Item = {
  id: string
  text: string
  orderIndex: number | null
  excluded: boolean | null
  isQuestion: boolean | null
  questionStatus: string | null
  defaultTag: string | null
  isNew: boolean | null
  createdBy: string | null
}

export type Response = {
  id: string
  itemId: string
  value: string
}

export type ModuleViewProps = {
  session: NormalizedSession
  items: Item[]
  myResponses: Response[]
  participantId: string
  nickname: string
}

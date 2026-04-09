# Sammen v2 — AI agent context

## What this is
Sammen is a workshop facilitation tool.
Stack: Next.js 14 (App Router), TypeScript, Drizzle ORM,
Neon (serverless Postgres), Tailwind CSS. Deployed on Vercel.

Never run db.transaction() — neon-http does not support it.
Never fetch() in server components — query db directly via getDb().
Never insert an empty array — guard with if (arr.length === 0) return.

---

## Core mental model

Everything in Sammen is one primitive:

  A list of elements + participants responding to them.

What varies is the RESPONSE TYPE and the VIEW. Modules are not
separate concepts — they are named configurations of this primitive.

  session
    └── items[]          — the elements
    └── responses[]      — participant answers (value shape varies by module)
    └── innspill[]        — free-text input (only for innspill modules)
    └── themes[]          — AI-grouped categories (only for innspill modules)

---

## Module taxonomy

module_type on a session determines response shape and UI:

  KATEGORISERING family (response.value = tag string):
    'kartlegging'     — pick one tag per item
    'flervalgstagging'— pick multiple tags per item (future)
    'binar'           — yes/no per item (future)

  VURDERING family (response.value = numeric string):
    'skala'           — 1–5 scale per item
    'dot-voting'      — allocate dot budget across items
    'tommel'          — up/down per item (future)

  INNSPILL family (free text, stored in innspill table):
    'aapne-innspill'  — open text response to a question/prompt

  PRIORITERING family (response.value = position string):
    'rangering'       — drag-and-drop ranking

New module types can be added by:
  1. Adding the type string to the module_type enum in db/schema.ts
  2. Creating app/delta/[code]/modules/[ModuleName]View.tsx
  3. Adding a case in app/lib/resolveView.ts
  4. Adding a case in app/delta/[code]/page.tsx switch statement
  No other files need to change.

---

## Database schema (complete, authoritative)

### sessions
  id                uuid PRIMARY KEY default gen_random_uuid()
  code              text UNIQUE NOT NULL        — 4-letter join code
  title             text NOT NULL
  module_type       text NOT NULL               — see module taxonomy above
  status            text NOT NULL default 'setup'
                    — 'setup' | 'active' | 'paused' | 'closed'
  tags              text[]                      — available tags (kategorisering)
  allow_new_items   boolean default true
  dot_budget        integer default 5           — for dot-voting
  allow_multiple_dots boolean default false
  max_rank_items    integer default 0           — 0 = no limit (rangering)
  innspill_mode     text default 'enkel'        — 'enkel' | 'detaljert'
  innspill_max_chars integer default 500
  visibility        jsonb default '{}'          — see visibility model below
  timer_ends_at     timestamptz
  timer_label       text
  created_at        timestamptz default now()

### items
  id                uuid PRIMARY KEY default gen_random_uuid()
  session_id        uuid REFERENCES sessions(id) ON DELETE CASCADE
  text              text NOT NULL
  order_index       integer default 0
  excluded          boolean default false
  is_question       boolean default false       — true = prompt for innspill
  question_status   text default 'inactive'
                    — 'inactive' | 'active' | 'locked'
  default_tag       text                        — pre-suggested tag
  created_by        text                        — 'facilitator' | participantId
  is_new            boolean default false       — added by participant
  created_at        timestamptz default now()

### responses
  id                uuid PRIMARY KEY default gen_random_uuid()
  session_id        uuid REFERENCES sessions(id) ON DELETE CASCADE
  item_id           uuid REFERENCES items(id) ON DELETE CASCADE
  participant_id    text NOT NULL
  value             text NOT NULL
                    — kartlegging: tag string
                    — skala: '1'–'5'
                    — dot-voting: dot count as string
                    — rangering: position as string
  created_at        timestamptz default now()

### innspill
  id                uuid PRIMARY KEY default gen_random_uuid()
  session_id        uuid REFERENCES sessions(id) ON DELETE CASCADE
  question_id       uuid REFERENCES items(id) ON DELETE CASCADE
  participant_id    text NOT NULL
  nickname          text
  text              text NOT NULL
  detaljer          text
  likes             integer default 0
  created_at        timestamptz default now()

### innspill_likes
  id                uuid PRIMARY KEY default gen_random_uuid()
  innspill_id       uuid REFERENCES innspill(id) ON DELETE CASCADE
  participant_id    text NOT NULL
  created_at        timestamptz default now()
  UNIQUE(innspill_id, participant_id)

### themes
  id                uuid PRIMARY KEY default gen_random_uuid()
  session_id        uuid REFERENCES sessions(id) ON DELETE CASCADE
  name              text NOT NULL
  description       text
  color             text
  order_index       integer default 0
  created_at        timestamptz default now()

### innspill_themes
  id                uuid PRIMARY KEY default gen_random_uuid()
  innspill_id       uuid REFERENCES innspill(id) ON DELETE CASCADE
  theme_id          uuid REFERENCES themes(id) ON DELETE CASCADE
  created_at        timestamptz default now()
  UNIQUE(innspill_id, theme_id)

### workshops (schema ready, UI not built yet)
  id                uuid PRIMARY KEY default gen_random_uuid()
  title             text NOT NULL
  description       text
  created_at        timestamptz default now()

### workshop_steps (schema ready, UI not built yet)
  id                uuid PRIMARY KEY default gen_random_uuid()
  workshop_id       uuid REFERENCES workshops(id) ON DELETE CASCADE
  session_id        uuid REFERENCES sessions(id) ON DELETE CASCADE
  step_order        integer NOT NULL
  created_at        timestamptz default now()

---

## Visibility model

sessions.visibility is a JSONB column that controls what each
audience sees. Default value: {}

Shape:
  {
    "facilitator": {
      "showRawResponses": true,    — see individual responses
      "showDistribution": true,    — see score/tag distribution
      "showParticipantIds": true   — see who answered what
    },
    "participant": {
      "showOwnResponses": true,    — always true
      "showAggregated": false,     — see group results while active
      "showResults": false         — see results page
    },
    "presentation": {
      "showResults": false,        — /vis/[code] reveals results
      "pinnedItemIds": []          — only show these items (empty = show all)
    }
  }

Facilitator toggles these fields via PATCH /api/sessions/[code]/visibility.
Components read only the fields relevant to their audience.

Helper: app/lib/getVisibility.ts
  export function getVisibility(raw: unknown): VisibilityConfig
  — parses and fills defaults for missing fields

---

## Normalized session type (use everywhere)

File: app/lib/normalizeSession.ts

All API routes that return a session MUST call normalizeSession()
before sending the response. This ensures consistent camelCase
throughout the frontend.

export type NormalizedSession = {
  id: string
  code: string
  title: string
  moduleType: string              — replaces old 'mode' field
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

Note: there is no 'phase' field in v2. The module type IS the phase.
Sessions do not transition between phases internally — a workshop
chains multiple sessions instead.

---

## resolveView — single source of truth

File: app/lib/resolveView.ts

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
  if (session.status === 'closed')
    return { view: 'closed' }
  if (session.visibility.participant.showResults)
    return { view: 'results' }
  if (session.status !== 'active')
    return { view: 'waiting', reason:
      session.status === 'paused'
        ? 'Sesjonen er midlertidig pauset.'
        : 'Sesjonen har ikke startet ennå.' }
  switch (session.moduleType) {
    case 'kartlegging':     return { view: 'kartlegging' }
    case 'flervalgstagging':return { view: 'kartlegging' }
    case 'skala':           return { view: 'skala' }
    case 'dot-voting':      return { view: 'dot-voting' }
    case 'aapne-innspill':  return { view: 'aapne-innspill' }
    case 'rangering':       return { view: 'rangering' }
    default:
      return { view: 'waiting', reason: 'Ukjent modultype.' }
  }
}

---

## API contract

All routes return camelCase. No snake_case in responses. Ever.
All routes that return a session call normalizeSession() first.

Public (no auth):
  GET  /api/sessions/[code]           — session info for participants
  GET  /api/delta/[code]/state        — MAIN participant polling endpoint
       ?participantId=xxx
       Returns: { session, items, innspill, themes, myResponses }
  POST /api/responses                 — submit a response
  POST /api/innspill                  — submit free text
  POST /api/innspill/[id]/like        — like an innspill

Admin (cookie auth via middleware):
  GET  /api/admin/sessions            — list all sessions
  POST /api/sessions                  — create session
  PATCH /api/sessions/[code]          — update session fields
  PATCH /api/sessions/[code]/visibility — update visibility config
  PATCH /api/sessions/[code]/status   — set status (active/paused/closed)
  DELETE /api/sessions/[code]         — delete session
  POST /api/items                     — add item(s)
  PATCH /api/items/[id]               — update single item
  DELETE /api/items/[id]              — delete item
  GET  /api/admin/[code]/summary      — aggregated results
  POST /api/admin/[code]/suggest-themes — AI theme suggestion
  GET/POST /api/admin/[code]/themes   — manage themes
  PATCH/DELETE /api/admin/[code]/themes/[id]
  PATCH /api/innspill/[id]/theme      — assign theme to innspill

/api/delta/[code]/state response shape:
  {
    session: NormalizedSession,
    items: Array<{
      id, text, orderIndex, excluded, isQuestion,
      questionStatus, defaultTag, isNew, createdBy
    }>,
    innspill: Array<{
      id, questionId, participantId, nickname,
      text, detaljer, likes
    }>,
    themes: Array<{
      id, name, color, orderIndex
    }>,
    myResponses: Array<{
      id, itemId, value
    }>
  }

---

## Participant page structure

app/delta/[code]/page.tsx — ONLY does this:
  1. Read participantId + nickname from localStorage
  2. Poll /api/delta/[code]/state every 5 seconds (merge, never replace)
  3. Call resolveView(session)
  4. Switch on viewState.view → render the right module component
  5. No other logic lives here

Module components live in:
  app/delta/[code]/modules/KartleggingView.tsx
  app/delta/[code]/modules/SkalaView.tsx
  app/delta/[code]/modules/DotVotingView.tsx
  app/delta/[code]/modules/InnspillView.tsx
  app/delta/[code]/modules/RangeringView.tsx

Each module component receives:
  session: NormalizedSession
  items: Item[]
  myResponses: Response[]
  participantId: string
  nickname: string
  — plus module-specific data (innspill, themes) where needed

Module components NEVER fetch data themselves.
All data comes from page.tsx via props.

---

## Admin panel structure

app/admin/[code]/page.tsx — facilitator control panel
  - Shows live participant count
  - Controls session status (start / pause / close)
  - Controls visibility settings per audience
  - Shows live response overview
  - Phase transitions not needed — use workshop_steps instead (future)

app/admin/[code]/results/page.tsx — full results view
  - Reads from /api/admin/[code]/summary
  - Fasilitator can set pinnedItemIds for presentation

app/vis/[code]/page.tsx — fullscreen presentation mode
  - Polls every 3 seconds
  - Only shows items in pinnedItemIds (or all if empty)
  - Controlled entirely by visibility.presentation settings

---

## Polling pattern (use everywhere, no exceptions)

Participant pages: poll every 5 seconds
Admin pages: poll every 10 seconds
Presentation mode: poll every 3 seconds

Always MERGE incoming data into state — never replace:
  setItems(prev =>
    incoming.length > 0 ? incoming : prev
  )

Always use initialized ref to protect optimistic updates:
  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    // set initial state from first poll here
  }, [data])

---

## localStorage pattern

  samen_participant_id          — shared across all sessions
  samen_nickname_[code]         — per session
  samen_module_done_[code]      — participant has submitted (per session)

Read on mount. Set on join. Never clear unless user explicitly leaves.

---

## Recurring bugs — never repeat these

- Empty array insert → crashes neon-http. Guard: if (arr.length === 0) return
- fetch() in server components → ECONNREFUSED. Always use getDb() directly.
- useEffect syncing from props → snap-back on optimistic updates.
  Always use initialized ref pattern.
- Polling replacing state with empty data → merge, never replace.
- db.transaction() → not supported by neon-http. Use sequential awaits.
- Drizzle returns snake_case from db. normalizeSession() converts to camelCase.
  Never access raw db fields in components.
- question_status overwritten by polling → only update from PATCH response body.

---

## Før du bygger en ny modul — sjekkliste

1. Hvilken familie tilhører den?
   kategorisering | vurdering | innspill | prioritering

2. Er det en variant (ny visning, samme datastruktur)?
   → Legg til en ny moduleType-streng og en ny View-komponent.
   → Ingen endringer i schema eller API.

3. Er det en ny familie (ny responslogikk)?
   → Ny tabell eller nytt value-format i responses.
   → Ny seksjon i /api/delta/[code]/state.
   → Ny family-type i denne listen.

Tvilstilfeller: spør om responstypen. Hvis value-feltet
i responses-tabellen kan romme dataene som en enkel streng,
er det en variant. Hvis du trenger relasjoner eller flere
felt per respons, er det en ny familie.

- - -

## Auth

Middleware protects: /admin/*, /ny, /api/admin/*
Public: /delta/*, /vis/*, /api/delta/*, /api/sessions/*, /api/responses,
        /api/innspill/*, /api/items (POST only for participant-added items)

Cookie: admin_session (30 days, httpOnly)
Env: ADMIN_PASSWORD

---

## Environment variables

DATABASE_URL             — Neon pooled connection string
ADMIN_PASSWORD           — global admin password
SAMEN_OPENROUTER_KEY     — OpenRouter API key for AI theme suggestion

---

## Design system

Light theme (participant pages):
  Background: #f8fafc
  Card: white, shadow-sm, border border-slate-100
  Primary button: bg-[#0f172a] text-white rounded-full
  Secondary button: border border-slate-200 rounded-full
  Input: border border-slate-200 rounded-xl
  Font: Barlow (next/font/google)

Dark theme (admin + presentation):
  Background: #0f172a
  Accent violet: #a78bfa
  Accent cyan: #67e8f9

Consensus colors (use everywhere results are shown):
  Agreement:     #22c55e
  Some spread:   #f59e0b
  Disagreement:  #ef4444

Shared components (build once, use everywhere):
  app/components/ui/ToggleButton.tsx
  app/components/ui/StyledSelect.tsx
  app/components/ui/TimerBanner.tsx
  app/components/ui/WaitingScreen.tsx    — shown when view === 'waiting'
  app/components/ui/ClosedScreen.tsx     — shown when view === 'closed'

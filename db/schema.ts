import { pgTable, uuid, text, boolean, integer, jsonb, timestamp as timestamptz, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  code: text('code').unique().notNull(),
  title: text('title').notNull(),
  moduleType: text('module_type').notNull(),
  status: text('status').notNull().default('setup'),
  tags: text('tags').array(),
  allowNewItems: boolean('allow_new_items').default(true),
  dotBudget: integer('dot_budget').default(5),
  allowMultipleDots: boolean('allow_multiple_dots').default(false),
  maxRankItems: integer('max_rank_items').default(0),
  innspillMode: text('innspill_mode').default('enkel'),
  innspillMaxChars: integer('innspill_max_chars').default(500),
  visibility: jsonb('visibility').default({}),
  timerEndsAt: timestamptz('timer_ends_at', { withTimezone: true }),
  timerLabel: text('timer_label'),
  createdAt: timestamptz('created_at', { withTimezone: true }).default(sql`now()`),
})

export const items = pgTable('items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  text: text('text').notNull(),
  orderIndex: integer('order_index').default(0),
  excluded: boolean('excluded').default(false),
  isQuestion: boolean('is_question').default(false),
  questionStatus: text('question_status').default('inactive'),
  defaultTag: text('default_tag'),
  createdBy: text('created_by'),
  isNew: boolean('is_new').default(false),
  createdAt: timestamptz('created_at', { withTimezone: true }).default(sql`now()`),
})

export const responses = pgTable('responses', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  itemId: uuid('item_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
  participantId: text('participant_id').notNull(),
  value: text('value').notNull(),
  createdAt: timestamptz('created_at', { withTimezone: true }).default(sql`now()`),
})

export const innspill = pgTable('innspill', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  questionId: uuid('question_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
  participantId: text('participant_id').notNull(),
  nickname: text('nickname'),
  text: text('text').notNull(),
  detaljer: text('detaljer'),
  likes: integer('likes').default(0),
  createdAt: timestamptz('created_at', { withTimezone: true }).default(sql`now()`),
})

export const innspillLikes = pgTable('innspill_likes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  innspillId: uuid('innspill_id').references(() => innspill.id, { onDelete: 'cascade' }).notNull(),
  participantId: text('participant_id').notNull(),
  createdAt: timestamptz('created_at', { withTimezone: true }).default(sql`now()`),
}, (table) => ({
  innspillParticipantUnique: unique().on(table.innspillId, table.participantId),
}))

export const themes = pgTable('themes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),
  orderIndex: integer('order_index').default(0),
  createdAt: timestamptz('created_at', { withTimezone: true }).default(sql`now()`),
})

export const innspillThemes = pgTable('innspill_themes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  innspillId: uuid('innspill_id').references(() => innspill.id, { onDelete: 'cascade' }).notNull(),
  themeId: uuid('theme_id').references(() => themes.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamptz('created_at', { withTimezone: true }).default(sql`now()`),
}, (table) => ({
  innspillThemeUnique: unique().on(table.innspillId, table.themeId),
}))

export const workshops = pgTable('workshops', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: timestamptz('created_at', { withTimezone: true }).default(sql`now()`),
})

export const workshopSteps = pgTable('workshop_steps', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workshopId: uuid('workshop_id').references(() => workshops.id, { onDelete: 'cascade' }).notNull(),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  stepOrder: integer('step_order').notNull(),
  createdAt: timestamptz('created_at', { withTimezone: true }).default(sql`now()`),
})

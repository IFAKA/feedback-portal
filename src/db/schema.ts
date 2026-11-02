import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const feedbackSessions = sqliteTable('feedback_sessions', {
  id: text('id').primaryKey(),
  projectName: text('project_name').notNull(),
  targetUrl: text('target_url'),
  testerName: text('tester_name').notNull(),
  status: text('status', { enum: ['draft', 'live', 'reviewed'] }).notNull().default('draft'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const feedbackPins = sqliteTable('feedback_pins', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => feedbackSessions.id, { onDelete: 'cascade' }),
  x: real('x').notNull(),
  y: real('y').notNull(),
  message: text('message').notNull(),
  severity: text('severity', { enum: ['note', 'issue', 'blocker'] }).notNull().default('note'),
  screenshotUrl: text('screenshot_url'),
  createdAt: text('created_at').notNull(),
});

export const timelineEvents = sqliteTable('timeline_events', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => feedbackSessions.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['session.created', 'pin.created', 'signal.joined'] }).notNull(),
  payload: text('payload', { mode: 'json' }).notNull(),
  createdAt: text('created_at').notNull(),
});

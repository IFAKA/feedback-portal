import { desc, eq } from 'drizzle-orm';
import { db } from './client';
import { ensureSchema } from './migrate';
import { feedbackPins, feedbackSessions, timelineEvents } from './schema';
import { createId } from '@/lib/id';
import type { CreateSessionInput, FeedbackPinInput } from '@/features/feedback/schemas';

ensureSchema();

const now = () => new Date().toISOString();

export async function createSession(input: CreateSessionInput) {
  const timestamp = now();
  const session = { id: createId('ses'), status: 'live' as const, createdAt: timestamp, updatedAt: timestamp, ...input };
  await db.insert(feedbackSessions).values(session);
  await addTimelineEvent(session.id, 'session.created', { projectName: session.projectName, testerName: session.testerName });
  return session;
}

export async function listSessions() {
  return db.select().from(feedbackSessions).orderBy(desc(feedbackSessions.createdAt));
}

export async function getSession(sessionId: string) {
  return db.query.feedbackSessions.findFirst({ where: eq(feedbackSessions.id, sessionId) });
}

export async function createPin(input: FeedbackPinInput) {
  const pin = { id: createId('pin'), createdAt: now(), screenshotUrl: input.screenshotUrl ?? null, ...input };
  await db.insert(feedbackPins).values(pin);
  await addTimelineEvent(input.sessionId, 'pin.created', { pinId: pin.id, severity: pin.severity, message: pin.message });
  return pin;
}

export async function listPins(sessionId: string) {
  return db.select().from(feedbackPins).where(eq(feedbackPins.sessionId, sessionId)).orderBy(desc(feedbackPins.createdAt));
}

export async function addTimelineEvent(sessionId: string, type: 'session.created' | 'pin.created' | 'signal.joined', payload: Record<string, unknown>) {
  await db.insert(timelineEvents).values({ id: createId('evt'), sessionId, type, payload, createdAt: now() });
}

export async function listTimeline(sessionId?: string) {
  const base = db.select().from(timelineEvents).orderBy(desc(timelineEvents.createdAt));
  return sessionId ? db.select().from(timelineEvents).where(eq(timelineEvents.sessionId, sessionId)).orderBy(desc(timelineEvents.createdAt)) : base;
}

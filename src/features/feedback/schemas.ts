import { z } from 'zod';

export const sessionStatusSchema = z.enum(['draft', 'live', 'reviewed']);
export const severitySchema = z.enum(['note', 'issue', 'blocker']);

export const createSessionSchema = z.object({
  projectName: z.string().trim().min(2).max(80),
  targetUrl: z.string().url().optional().or(z.literal('')).transform((value) => value || null),
  testerName: z.string().trim().min(2).max(80),
});

export const feedbackPinSchema = z.object({
  sessionId: z.string().min(4),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  message: z.string().trim().min(3).max(500),
  severity: severitySchema.default('note'),
  screenshotUrl: z.string().url().nullable().optional(),
});

export const signalingRoomSchema = z.object({ roomId: z.string().min(4).max(80) });

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type FeedbackPinInput = z.infer<typeof feedbackPinSchema>;
export type Severity = z.infer<typeof severitySchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;

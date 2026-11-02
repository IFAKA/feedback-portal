import { describe, expect, it } from 'vitest';
import { createSessionSchema, feedbackPinSchema } from '@/features/feedback/schemas';

describe('feedback schemas', () => {
  it('normalizes an empty target URL to null', () => {
    const result = createSessionSchema.parse({ projectName: 'Portal QA', targetUrl: '', testerName: 'Mina' });
    expect(result.targetUrl).toBeNull();
  });

  it('rejects pins outside the overlay coordinate range', () => {
    const result = feedbackPinSchema.safeParse({ sessionId: 'ses_1234', x: 1.2, y: 0.4, message: 'Fix alignment', severity: 'issue' });
    expect(result.success).toBe(false);
  });
});

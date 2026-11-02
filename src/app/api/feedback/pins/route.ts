export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { feedbackPinSchema } from '@/features/feedback/schemas';
import { parseJson } from '@/lib/api';
import { createPin, getSession, listPins } from '@/db/repository';

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ errors: [{ field: 'sessionId', message: 'sessionId is required' }] }, { status: 400 });
  const pins = await listPins(sessionId);
  return NextResponse.json({ pins });
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, feedbackPinSchema);
  if ('errors' in parsed) return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  const session = await getSession(parsed.data.sessionId);
  if (!session) {
    return NextResponse.json({ errors: [{ field: 'sessionId', message: 'Session room was not found' }] }, { status: 404 });
  }

  const pin = await createPin(parsed.data);
  return NextResponse.json({ pin }, { status: 201 });
}

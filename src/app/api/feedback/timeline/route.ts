export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { listTimeline } from '@/db/repository';

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get('sessionId') ?? undefined;
  const events = await listTimeline(sessionId);
  return NextResponse.json({ events });
}

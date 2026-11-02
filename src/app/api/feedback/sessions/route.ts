export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createSessionSchema } from '@/features/feedback/schemas';
import { parseJson } from '@/lib/api';
import { createSession, listSessions } from '@/db/repository';

export async function GET() {
  const sessions = await listSessions();
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, createSessionSchema);
  if ('errors' in parsed) return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  const session = await createSession(parsed.data);
  return NextResponse.json({ session }, { status: 201 });
}

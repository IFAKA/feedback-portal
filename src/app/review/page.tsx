export const dynamic = 'force-dynamic';

import { NavLink } from '@/components/nav-link';
import { Timeline } from '@/components/timeline';
import { listTimeline } from '@/db/repository';

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ sessionId?: string }> }) {
  const { sessionId } = await searchParams;
  const events = await listTimeline(sessionId);
  return <main className="min-h-screen px-5 py-6 md:px-10"><div className="mx-auto max-w-5xl"><div className="mb-8 flex items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.25em] text-copper">Review timeline</p><h1 className="text-4xl font-black tracking-[-0.04em] md:text-6xl">Decision trail</h1></div><NavLink href="/">Home</NavLink></div><Timeline events={events} /></div></main>;
}

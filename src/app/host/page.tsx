export const dynamic = 'force-dynamic';

import { FeedbackOverlay } from '@/components/feedback-overlay';
import { HostSignalingPanel } from '@/components/host-signaling-panel';
import { NavLink } from '@/components/nav-link';
import { getSession, listPins } from '@/db/repository';

export default async function HostPage({ searchParams }: { searchParams: Promise<{ sessionId?: string }> }) {
  const { sessionId } = await searchParams;
  const session = sessionId ? await getSession(sessionId) : null;
  const pins = sessionId ? await listPins(sessionId) : [];
  return <main className="min-h-screen px-5 py-6 md:px-10"><div className="mx-auto max-w-6xl"><div className="mb-6 flex items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.25em] text-copper">Host room</p><h1 className="text-3xl font-black tracking-[-0.03em] md:text-5xl">{session?.projectName ?? 'Create a session first'}</h1></div><NavLink href="/">Home</NavLink></div>{session ? <><div className="mb-4 rounded-3xl border border-black/10 bg-white/70 p-4 text-sm font-semibold">Room ID: <code>{session.id}</code> · Tester: {session.testerName}</div><HostSignalingPanel roomId={session.id} /><FeedbackOverlay sessionId={session.id} initialPins={pins} /></> : <p className="rounded-3xl bg-white p-6">Start a review from the home page to create a host room.</p>}</div></main>;
}

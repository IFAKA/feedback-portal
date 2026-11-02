type TimelineEvent = { id: string; type: string; sessionId: string; payload: unknown; createdAt: string };

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return <ol className="space-y-3">{events.map((event) => <li key={event.id} className="rounded-3xl border border-black/10 bg-white/75 p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">{event.type}</span><time className="text-xs font-semibold text-ink/60">{new Date(event.createdAt).toLocaleString()}</time></div><pre className="mt-3 overflow-auto rounded-2xl bg-paper p-3 text-xs text-ink/70">{JSON.stringify(event.payload, null, 2)}</pre></li>)}</ol>;
}

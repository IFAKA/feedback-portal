'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SessionForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch('/api/feedback/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const payload = await response.json();
    setIsSubmitting(false);
    if (!response.ok) {
      setError(payload.errors?.[0]?.message ?? 'Could not create the session.');
      return;
    }
    router.push(`/host?sessionId=${payload.session.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[2rem] border border-black/10 bg-white/80 p-5 shadow-2xl shadow-black/10 backdrop-blur md:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-ink">Project name<input name="projectName" required minLength={2} className="min-h-11 rounded-2xl border border-black/10 bg-paper px-4 outline-none focus:ring-4 focus:ring-copper/20" placeholder="Checkout redesign" /></label>
        <label className="grid gap-2 text-sm font-semibold text-ink">Target URL<input name="targetUrl" type="url" className="min-h-11 rounded-2xl border border-black/10 bg-paper px-4 outline-none focus:ring-4 focus:ring-copper/20" placeholder="https://example.com" /></label>
        <label className="grid gap-2 text-sm font-semibold text-ink">Tester name<input name="testerName" required minLength={2} className="min-h-11 rounded-2xl border border-black/10 bg-paper px-4 outline-none focus:ring-4 focus:ring-copper/20" placeholder="Sam Rivera" /></label>
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <button disabled={isSubmitting} className="pressable mt-5 min-h-11 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-lg shadow-ink/20 disabled:opacity-50">{isSubmitting ? 'Creating session…' : 'Start live review'}</button>
    </form>
  );
}

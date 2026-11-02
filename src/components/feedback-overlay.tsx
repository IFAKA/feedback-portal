'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { FeedbackPin } from '@/features/feedback/types';
import type { Severity } from '@/features/feedback/schemas';

const severityStyles: Record<Severity, string> = { note: 'bg-blueprint', issue: 'bg-copper', blocker: 'bg-red-700' };

export function FeedbackOverlay({ sessionId, initialPins = [] }: { sessionId: string; initialPins?: FeedbackPin[] }) {
  const stageRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const instructionsId = useId();
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [pins, setPins] = useState<FeedbackPin[]>(initialPins);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<Severity>('note');

  useEffect(() => {
    fetch(`/api/feedback/pins?sessionId=${sessionId}`).then((res) => res.json()).then((data) => setPins(data.pins ?? initialPins)).catch(() => undefined);
  }, [sessionId, initialPins]);

  useEffect(() => {
    if (!draft) return;
    textareaRef.current?.focus();
  }, [draft]);

  function closeDraft() {
    setDraft(null);
    requestAnimationFrame(() => (restoreFocusRef.current ?? stageRef.current)?.focus());
  }

  function startDraftAt(x: number, y: number) {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : stageRef.current;
    setDraft({ x: Math.min(Math.max(x, 0), 1), y: Math.min(Math.max(y, 0), 1) });
  }

  function startDraft(event: React.MouseEvent<HTMLButtonElement>) {
    if (event.detail === 0) {
      startDraftAt(0.5, 0.5);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    startDraftAt((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
  }

  async function savePin() {
    if (!draft || message.trim().length < 3) return;
    const response = await fetch('/api/feedback/pins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, x: draft.x, y: draft.y, message, severity }) });
    const payload = await response.json();
    if (response.ok) {
      setPins((current) => [payload.pin, ...current]);
      setMessage('');
      setSeverity('note');
      closeDraft();
    }
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDraft();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), textarea, select, input, [href], [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }

  return (
    <section className="rounded-[2rem] border border-black/10 bg-[#d8d0c1] p-3 shadow-2xl shadow-black/10" aria-label="Feedback pinning overlay">
      <div className="relative min-h-[540px] overflow-hidden rounded-[1.5rem] border border-black/10 bg-[linear-gradient(135deg,#f8f5ef_25%,#ece4d6_25%,#ece4d6_50%,#f8f5ef_50%,#f8f5ef_75%,#ece4d6_75%)] bg-[length:42px_42px]">
        <button
          ref={stageRef}
          type="button"
          onClick={startDraft}
          aria-describedby={instructionsId}
          aria-label="Place a feedback pin at the selected point. Keyboard activation places it at the center."
          disabled={Boolean(draft)}
          className="absolute inset-0 text-left outline-none focus:ring-4 focus:ring-copper/30"
        >
          <span id={instructionsId} className="pointer-events-none absolute inset-8 rounded-[1.25rem] border border-dashed border-black/20 bg-white/40 p-6 text-center text-sm font-semibold text-ink/60">
            Click anywhere on the surface to pin feedback. Keyboard users can focus this surface button and press Enter or Space to place a pin at the center.
          </span>
        </button>
        {pins.map((pin, index) => <button key={pin.id} type="button" disabled={Boolean(draft)} className={`pressable absolute z-10 min-h-11 min-w-11 rounded-full ${severityStyles[pin.severity]} px-3 text-xs font-bold text-white shadow-lg`} style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%`, transform: 'translate(-50%, -50%)' }} title={pin.message} aria-label={`${pin.severity} feedback pin ${pins.length - index}: ${pin.message}`}>#{pins.length - index}</button>)}
        {draft ? <div ref={dialogRef} className="absolute z-20 w-80 max-w-[calc(100%-2rem)] rounded-3xl border border-black/10 bg-white p-4 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby={dialogTitleId} aria-describedby={dialogDescriptionId} onKeyDown={handleDialogKeyDown} style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, transform: 'translate(-1rem, -1rem)' }}>
          <h2 id={dialogTitleId} className="text-base font-black">New feedback pin</h2>
          <p id={dialogDescriptionId} className="mt-1 text-sm font-semibold text-ink/65">Write the feedback for this point. Press Escape to close and return to the surface.</p>
          <label className="mt-3 grid gap-2 text-sm font-bold">Feedback note<textarea ref={textareaRef} value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-24 rounded-2xl border border-black/10 bg-paper p-3 outline-none focus:ring-4 focus:ring-copper/20" placeholder="What should change here?" /></label>
          <label className="mt-3 grid gap-2 text-sm font-bold">Severity<select value={severity} onChange={(event) => setSeverity(event.target.value as Severity)} className="min-h-11 rounded-2xl border border-black/10 bg-paper px-3"><option value="note">Note</option><option value="issue">Issue</option><option value="blocker">Blocker</option></select></label>
          <div className="mt-4 flex gap-2"><button type="button" onClick={savePin} className="pressable rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">Save pin</button><button type="button" onClick={closeDraft} className="pressable rounded-full border border-black/10 px-4 py-2 text-sm font-bold">Cancel</button></div>
        </div> : null}
      </div>
    </section>
  );
}

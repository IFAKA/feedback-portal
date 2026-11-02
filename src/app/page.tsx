export const dynamic = 'force-dynamic';

import { SessionForm } from '@/components/session-form';
import { NavLink } from '@/components/nav-link';
import { listSessions } from '@/db/repository';

const roleCards = [
  {
    title: 'Host',
    href: '/host',
    description: 'Create or open a session, share your app window, and copy the Room ID for the tester.',
  },
  {
    title: 'Tester',
    href: '/tester',
    description: 'Enter the host Room ID and watch the live app stream in your browser.',
  },
  {
    title: 'Review',
    href: '/review',
    description: 'Open the timeline after a test to inspect captured feedback and session events.',
  },
];

const happyPathSteps = [
  'Create a session below with a project name and tester name.',
  'Send the tester the reachable app URL and the Room ID shown on the Host page.',
  'Tester opens the Tester page and enters the Room ID.',
  'Host clicks Start Sharing and chooses the app window or simulator when the browser asks.',
];

export default async function HomePage() {
  const sessions = await listSessions();
  return (
    <main className="min-h-screen px-5 py-6 md:px-10">
      <header className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-copper">Feedback Portal MVP</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-ink md:text-7xl">Live product reviews, pinned to the screen.</h1>
          <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-ink/70">
            Run a simple remote usability test: create a session, share your app window, have a tester join by Room ID, then review the feedback timeline.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          <NavLink href="/host">Host</NavLink>
          <NavLink href="/tester">Tester</NavLink>
          <NavLink href="/review">Review</NavLink>
        </nav>
      </header>

      <section className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3">
        {roleCards.map((role) => (
          <article key={role.title} className="rounded-[1.75rem] border border-black/10 bg-white/70 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-moss">Choose this if you are the</p>
            <h2 className="mt-2 text-2xl font-black text-ink">{role.title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink/65">{role.description}</p>
            <div className="mt-5">
              <NavLink href={role.href}>Open {role.title}</NavLink>
            </div>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-black/10 bg-white/70 p-5 shadow-sm md:p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-copper">First-time happy path</p>
          <ol className="mt-5 grid gap-3">
            {happyPathSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-ink/70">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-black text-white">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <aside className="rounded-[2rem] border border-copper/20 bg-copper/10 p-5 md:p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-copper">Remote testing note</p>
          <p className="mt-4 text-sm leading-6 text-ink/70">
            Feedback Portal is not a tunnel. Remote testers cannot open your localhost URL unless you expose it with ngrok, Cloudflare Tunnel, or a deployed server. The screen-share permission prompt appears only for the host.
          </p>
        </aside>
      </section>

      <section className="mx-auto mt-10 max-w-6xl">
        <div className="mb-4">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-copper">Create a session</p>
          <p className="mt-2 text-sm text-ink/65">Start here if you are hosting a new review.</p>
        </div>
        <SessionForm />
      </section>

      {sessions.length ? (
        <section className="mx-auto mt-10 max-w-6xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-copper">Recent sessions</p>
              <p className="mt-2 text-sm text-ink/65">Reopen a host view or inspect a timeline.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {sessions.slice(0, 6).map((session) => (
              <article key={session.id} className="rounded-[1.75rem] border border-black/10 bg-white/70 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-moss">{session.status}</p>
                <h2 className="mt-2 text-xl font-black">{session.projectName}</h2>
                <p className="mt-2 text-sm text-ink/65">Tester: {session.testerName}</p>
                <div className="mt-4 flex gap-2">
                  <NavLink href={`/host?sessionId=${session.id}`}>Open</NavLink>
                  <NavLink href={`/review?sessionId=${session.id}`}>Timeline</NavLink>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

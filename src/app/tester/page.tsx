import { NavLink } from '@/components/nav-link';
import { TesterSignalingPanel } from '@/components/tester-signaling-panel';

export default function TesterPage() {
  return <main className="min-h-screen px-5 py-6 md:px-10"><div className="mx-auto max-w-4xl"><div className="flex items-center justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.25em] text-copper">Tester route</p><h1 className="text-4xl font-black tracking-[-0.04em] md:text-6xl">WebRTC tester handoff</h1></div><NavLink href="/">Home</NavLink></div><TesterSignalingPanel /></div></main>;
}

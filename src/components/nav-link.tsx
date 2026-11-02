import Link from 'next/link';

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link className="pressable rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-white" href={href}>{children}</Link>;
}

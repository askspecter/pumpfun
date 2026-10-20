import Link from "next/link";
import type { ReactNode } from "react";

export interface TocItem {
  id: string;
  title: string;
}

/**
 * Shared layout for Docs, Privacy and Terms: a large header, a sticky table of
 * contents on desktop, and readable long-form typography.
 */
export function DocShell({
  eyebrow,
  title,
  intro,
  updated,
  toc,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  updated?: string;
  toc: TocItem[];
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:pt-20">
      <header className="max-w-3xl">
        <div className="text-[13px] font-medium text-pink">{eyebrow}</div>
        <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl">
          <span className="bg-gradient-to-b from-white from-40% to-white/55 bg-clip-text text-transparent">{title}</span>
        </h1>
        <div className="mt-5 text-base leading-relaxed text-zinc-600 sm:text-lg">{intro}</div>
        {updated && <div className="mt-5 text-xs text-zinc-400">Last updated {updated}</div>}
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-[220px,1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-24">
            <div className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400">ON THIS PAGE</div>
            <ul className="mt-4 space-y-2.5 border-l border-white/[0.07]">
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="-ml-px block border-l border-transparent pl-4 text-sm text-zinc-500 transition hover:border-white/40 hover:text-white">
                    {t.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <div className="min-w-0 max-w-3xl space-y-16">{children}</div>
      </div>
    </div>
  );
}

export function DocSection({ id, title, kicker, children }: { id: string; title: string; kicker?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      {kicker && <div className="font-mono text-xs text-zinc-400">{kicker}</div>}
      <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-[28px]">{title}</h2>
      <div className="doc-prose mt-5">{children}</div>
    </section>
  );
}

export function Callout({ tone = "info", title, children }: { tone?: "info" | "warn" | "good"; title: string; children: ReactNode }) {
  const color = tone === "warn" ? "#ffce6a" : tone === "good" ? "#2fe39a" : "#c7cdff";
  return (
    <div className="my-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5" style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
      <div className="text-sm font-semibold" style={{ color }}>
        {title}
      </div>
      <div className="mt-1.5 text-sm leading-relaxed text-zinc-600">{children}</div>
    </div>
  );
}

export function Steps({ items }: { items: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="my-6 grid gap-3 sm:grid-cols-2">
      {items.map((s, i) => (
        <li key={s.title} className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-[#0f1013] to-[#0b0c0e] p-5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ffffff] font-mono text-xs font-bold text-[#08090a]">{i + 1}</span>
          <div className="mt-4 text-[15px] font-semibold text-white">{s.title}</div>
          <div className="mt-1.5 text-sm leading-relaxed text-zinc-600">{s.body}</div>
        </li>
      ))}
    </ol>
  );
}

export function DocTable({ head, rows }: { head: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-2xl border border-white/[0.07]">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-white/[0.03] text-xs text-zinc-500">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/[0.05]">
              {r.map((c, k) => (
                <td key={k} className={`px-4 py-3 align-top ${k === 0 ? "font-medium text-white" : "text-zinc-600"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Faq({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="my-6 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.07]">
      {items.map((f) => (
        <details key={f.q} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-white">
            {f.q}
            <span className="text-zinc-400 transition group-open:rotate-45">+</span>
          </summary>
          <div className="mt-3 text-sm leading-relaxed text-zinc-600">{f.a}</div>
        </details>
      ))}
    </div>
  );
}

export function DocCta() {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/create" className="btn-brand">
        Launch your profile
      </Link>
      <Link href="/" className="btn-dark">
        Back to markets
      </Link>
    </div>
  );
}

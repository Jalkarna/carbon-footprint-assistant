import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock, Code2, Accessibility, Gauge } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "What Carbon is, the principles behind it, and how your data is handled.",
};

const PRINCIPLES = [
  {
    icon: Code2,
    title: "Deterministic core",
    body: "All emissions math and recommendations are pure, unit-tested functions. The AI layer narrates; it never fabricates figures.",
  },
  {
    icon: Lock,
    title: "Privacy by design",
    body: "Your activity log is stored locally in your browser. There is no account and no analytics. Data leaves your device only when you ask the assistant a question.",
  },
  {
    icon: Accessibility,
    title: "Accessible to everyone",
    body: "Semantic HTML, full keyboard support, screen-reader-friendly charts, AA contrast, and respect for reduced-motion preferences.",
  },
  {
    icon: Gauge,
    title: "Honest about limits",
    body: "These are educational estimates from public factors, not a certified audit. We show our sources so you can judge for yourself.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
          About
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-fg">
          A clear, honest way to understand your impact
        </h1>
        <p className="mt-4 text-lg text-fg-muted">
          Carbon helps individuals understand, track, and reduce their carbon
          footprint through simple actions and personalized insights. It&apos;s
          designed for the everyday person who wants to do better without a
          spreadsheet or a science degree.
        </p>
      </header>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {PRINCIPLES.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-[var(--r-lg)] border border-[var(--border)] bg-surface p-6"
          >
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-[var(--r-md)] border border-[var(--accent-line)] bg-[var(--accent-subtle)]"
            >
              <Icon className="size-5 text-[var(--accent)]" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-fg">{title}</h2>
            <p className="mt-2 text-sm text-fg-muted">{body}</p>
          </div>
        ))}
      </div>

      <section className="mt-12 rounded-[var(--r-xl)] border border-[var(--border)] bg-bg-subtle p-8">
        <h2 className="text-2xl font-bold tracking-tight text-fg">
          Ready to see your footprint?
        </h2>
        <p className="mt-2 text-fg-muted">
          It takes one logged activity to get your first insight.
        </p>
        <Link
          href="/app"
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[var(--r-md)] bg-accent px-5 text-sm font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-strong)]"
        >
          Open the app
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </section>
    </div>
  );
}

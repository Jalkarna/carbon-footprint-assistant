import Link from "next/link";
import {
  ArrowRight,
  Car,
  Zap,
  Salad,
  ShoppingBag,
  LineChart,
  MessageSquare,
  ShieldCheck,
  Gauge,
  PlugZap,
} from "lucide-react";
import { EMISSION_FACTORS } from "@/lib/emissions/factors";
import { BENCHMARKS } from "@/lib/insights/analyze";

const CATEGORIES = [
  { icon: Car, label: "Transport", note: "Cars, transit, flights, cycling" },
  { icon: Zap, label: "Home energy", note: "Electricity and heating" },
  { icon: Salad, label: "Diet", note: "From red meat to plant-based" },
  { icon: ShoppingBag, label: "Shopping", note: "Clothing and electronics" },
];

const FEATURES = [
  {
    icon: LineChart,
    title: "A precise breakdown",
    body: "Every activity is converted to CO2e using documented emission factors, then broken down by category so you see exactly where your footprint comes from.",
  },
  {
    icon: Gauge,
    title: "Logical, quantified guidance",
    body: "A deterministic engine analyzes your data and ranks the highest-impact changes — each with a concrete estimate of the CO2e you'd save.",
  },
  {
    icon: MessageSquare,
    title: "An assistant that knows your data",
    body: "Ask questions in plain language. The assistant answers using your real logged footprint — it narrates your numbers, it doesn't invent them.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Your activity log lives in your browser. No account, no tracking. It only leaves your device when you choose to ask the assistant a question.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Log what you do",
    body: "Add trips, meals, energy use, and purchases in their natural units.",
  },
  {
    n: "02",
    title: "See your footprint",
    body: "Get an instant breakdown, daily average, and trend over time.",
  },
  {
    n: "03",
    title: "Act on the insights",
    body: "Follow ranked, quantified suggestions and ask the assistant for help.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-grid relative overflow-hidden border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-line)] bg-[var(--accent-subtle)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
              <PlugZap aria-hidden="true" className="size-3.5" />
              Personal carbon intelligence
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-fg md:text-6xl">
              Understand your footprint. Then actually shrink it.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-fg-muted">
              Carbon turns your everyday choices into a clear, measured picture
              — and gives you specific, data-grounded ways to do better.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/app"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--r-md)] bg-accent px-6 text-base font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-strong)]"
              >
                Start tracking
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/methodology"
                className="inline-flex h-12 items-center justify-center rounded-[var(--r-md)] border border-[var(--border-strong)] px-6 text-base font-medium text-fg transition-colors hover:bg-surface-2"
              >
                How it works
              </Link>
            </div>
          </div>

          {/* Category chips */}
          <ul className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORIES.map(({ icon: Icon, label, note }) => (
              <li
                key={label}
                className="rounded-[var(--r-lg)] border border-[var(--border)] bg-surface p-4 text-center"
              >
                <Icon
                  aria-hidden="true"
                  className="mx-auto size-5 text-[var(--accent)]"
                />
                <p className="mt-2 text-sm font-medium text-fg">{label}</p>
                <p className="mt-0.5 text-xs text-fg-subtle">{note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-[var(--border)] bg-bg-subtle">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px overflow-hidden px-4 py-10 sm:grid-cols-3 md:px-6">
          <Stat
            value={`${EMISSION_FACTORS.length}`}
            label="Documented emission factors"
          />
          <Stat
            value={`${BENCHMARKS.globalDailyAvg} kg`}
            label="Global daily average, for context"
          />
          <Stat value="100%" label="Computed locally, in your browser" />
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-fg">
            Built to be trusted, not just pretty.
          </h2>
          <p className="mt-3 text-fg-muted">
            The intelligence is deterministic and auditable. The assistant is a
            narrator on top — it explains your real numbers in plain language.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
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
              <h3 className="mt-4 text-lg font-semibold text-fg">{title}</h3>
              <p className="mt-2 text-sm text-fg-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[var(--border)] bg-bg-subtle">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-fg">
            Three steps to a clearer picture.
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n} className="relative">
                <span className="tnum text-sm font-semibold text-[var(--accent)]">
                  {step.n}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-fg">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-fg-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="rounded-[var(--r-xl)] border border-[var(--border)] bg-surface p-10 text-center md:p-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-fg md:text-4xl">
            Your first insight is one activity away.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-fg-muted">
            No sign-up. Start logging and watch your footprint take shape.
          </p>
          <Link
            href="/app"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-[var(--r-md)] bg-accent px-6 text-base font-semibold text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-strong)]"
          >
            Open the app
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 py-2 text-center sm:text-left">
      <p className="tnum text-3xl font-bold tracking-tight text-fg">{value}</p>
      <p className="mt-1 text-sm text-fg-muted">{label}</p>
    </div>
  );
}

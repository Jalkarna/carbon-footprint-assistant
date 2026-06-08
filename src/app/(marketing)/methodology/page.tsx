import type { Metadata } from "next";
import { EMISSION_FACTORS, CATEGORY_META, CATEGORIES } from "@/lib/emissions/factors";
import { BENCHMARKS } from "@/lib/insights/analyze";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Carbon calculates emissions: the documented factors, benchmarks, and the deterministic logic behind every recommendation.",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
          Methodology
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-fg">
          How the numbers are calculated
        </h1>
        <p className="mt-4 text-lg text-fg-muted">
          Carbon is built on a simple principle: the intelligence is
          deterministic and auditable. Every figure you see traces back to a
          documented emission factor — nothing is invented.
        </p>
      </header>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-fg">
          The calculation
        </h2>
        <p className="mt-3 text-fg-muted">
          Each activity you log is multiplied by an emission factor expressed in
          kilograms of CO2-equivalent per unit. Summing across activities gives
          your total; grouping by category gives your breakdown. The same pure
          functions run on every device, so results are reproducible.
        </p>
        <div className="mt-4 rounded-[var(--r-lg)] border border-[var(--border)] bg-surface-2 p-4 font-mono text-sm text-fg-muted">
          emissions (kg CO2e) = quantity × factor[activity]
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-fg">
          Benchmarks
        </h2>
        <p className="mt-3 text-fg-muted">
          To make a bare number meaningful, your daily average is compared to two
          references: the global per-person average (~{BENCHMARKS.globalDailyAvg}{" "}
          kg/day, roughly 4 tonnes a year) and a climate-friendly target (~
          {BENCHMARKS.sustainableDailyTarget} kg/day, roughly 2 tonnes a year).
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-fg">
          Emission factors
        </h2>
        <p className="mt-3 text-fg-muted">
          These are representative figures drawn from public datasets and rounded
          for clarity. They are estimates for educational guidance, not a
          certified audit.
        </p>

        {CATEGORIES.map((category) => {
          const factors = EMISSION_FACTORS.filter(
            (f) => f.category === category,
          );
          return (
            <div key={category} className="mt-8">
              <h3 className="text-lg font-semibold text-fg">
                {CATEGORY_META[category].label}
              </h3>
              <div className="mt-3 overflow-x-auto rounded-[var(--r-lg)] border border-[var(--border)]">
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    {CATEGORY_META[category].label} emission factors
                  </caption>
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-surface-2 text-left">
                      <th scope="col" className="px-4 py-2.5 font-medium">
                        Activity
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-medium">
                        Factor
                      </th>
                      <th scope="col" className="px-4 py-2.5 font-medium">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-faint)]">
                    {factors.map((f) => (
                      <tr key={f.id}>
                        <th
                          scope="row"
                          className="px-4 py-2.5 text-left font-normal text-fg"
                        >
                          {f.label}
                        </th>
                        <td className="tnum px-4 py-2.5 whitespace-nowrap text-fg-muted">
                          {f.perUnitKg} kg / {f.unit}
                        </td>
                        <td className="px-4 py-2.5 text-fg-subtle">{f.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-fg">
          The assistant
        </h2>
        <p className="mt-3 text-fg-muted">
          The AI assistant receives a context block built from this
          deterministic analysis and is instructed to base every figure on it.
          It explains and contextualizes your data — it never overrides the
          computed numbers. If the AI service is unavailable, the entire app
          continues to work; the assistant is purely additive.
        </p>
      </section>

      <p className="mt-12 border-t border-[var(--border)] pt-6 text-sm text-fg-subtle">
        Primary references: UK DEFRA/DESNZ greenhouse gas conversion factors
        (2024), US EPA emission factors, and Poore &amp; Nemecek (2018),
        &ldquo;Reducing food&apos;s environmental impacts through producers and
        consumers,&rdquo; Science.
      </p>
    </div>
  );
}

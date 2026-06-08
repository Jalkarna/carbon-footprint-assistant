"use client";

import { useMemo } from "react";
import { useCarbonStore } from "@/lib/store/carbon-store";
import { analyzeFootprint } from "@/lib/insights/analyze";
import { useHydrated } from "@/components/useHydrated";
import { ActivityForm } from "@/components/ActivityForm";
import { ActivityList } from "@/components/ActivityList";
import { BreakdownChart } from "@/components/BreakdownChart";
import { InsightList } from "@/components/InsightList";
import { SummaryCards } from "@/components/SummaryCards";
import { Assistant } from "@/components/Assistant";

/** Card wrapper used to group dashboard sections consistently. */
function Section({
  title,
  description,
  children,
  labelledBy,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  labelledBy: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className="rounded-xl border border-border bg-surface p-5"
    >
      <h2 id={labelledBy} className="text-lg font-semibold">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Home() {
  const hydrated = useHydrated();
  const activities = useCarbonStore((s) => s.activities);

  // Recompute the analysis whenever the activity log changes.
  const analysis = useMemo(() => analyzeFootprint(activities), [activities]);

  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <p className="text-sm font-medium text-primary">Carbon</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Understand and shrink your carbon footprint
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Log everyday activities and get personalized, quantified insights —
            plus a smart assistant that reasons about your real data.
          </p>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {!hydrated ? (
          <p className="text-muted-foreground" role="status">
            Loading your dashboard…
          </p>
        ) : (
          <div className="space-y-8">
            <SummaryCards analysis={analysis} />

            <div className="grid gap-8 lg:grid-cols-2">
              <Section
                title="Log an activity"
                labelledBy="log-heading"
                description="Add a trip, meal, or energy use. Everything stays in your browser."
              >
                <ActivityForm />
              </Section>

              <Section
                title="Footprint by category"
                labelledBy="breakdown-heading"
                description="Where your emissions come from."
              >
                {analysis.activityCount > 0 ? (
                  <BreakdownChart
                    byCategory={analysis.byCategory}
                    total={analysis.totalKg}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your breakdown will appear here once you log an activity.
                  </p>
                )}
              </Section>
            </div>

            <Section
              title="Personalized insights"
              labelledBy="insights-heading"
              description="Logical, quantified suggestions based on what you've logged."
            >
              <InsightList insights={analysis.insights} />
            </Section>

            <div className="grid gap-8 lg:grid-cols-2">
              <Section title="Recent activities" labelledBy="recent-heading">
                <ActivityList />
              </Section>

              <Section
                title="Ask the assistant"
                labelledBy="assistant-heading"
                description="A smart assistant that answers using your real footprint."
              >
                <Assistant />
              </Section>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground">
          <p>
            Estimates are for educational guidance using public emission
            factors, not a certified audit. Your data is stored locally in your
            browser.
          </p>
        </div>
      </footer>
    </>
  );
}

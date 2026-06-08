"use client";

import { Lightbulb, Globe, Target, TrendingDown } from "lucide-react";
import { BENCHMARKS } from "@/lib/insights/analyze";
import { useFootprint } from "@/components/app/useFootprint";
import { PageHeader } from "@/components/app/PageHeader";
import { InsightList } from "@/components/app/InsightList";
import { EmptyState } from "@/components/app/EmptyState";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
  formatKg,
} from "@/components/ui";
import { PageSkeleton } from "@/components/app/Skeletons";

/** A labelled comparison row used in the "where you stand" card. */
function CompareRow({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Globe;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-surface-3"
      >
        <Icon className="size-4 text-fg-muted" />
      </span>
      <div className="flex-1">
        <p className="text-sm text-fg-muted">{label}</p>
        <p className="tnum font-semibold text-fg">{value}</p>
      </div>
      <p className="text-right text-sm text-fg-subtle">{detail}</p>
    </div>
  );
}

export function InsightsClient() {
  const { hydrated, analysis, activityCount } = useFootprint();

  if (!hydrated) return <PageSkeleton />;

  if (activityCount === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Insights"
          title="Personalized guidance"
          description="Quantified, logical recommendations based on what you log."
        />
        <Card>
          <EmptyState
            icon={Lightbulb}
            title="No insights yet"
            description="Once you log a few activities, we'll surface the highest-impact ways for you to cut emissions."
            actionLabel="Log an activity"
            actionHref="/app/log"
          />
        </Card>
      </>
    );
  }

  const { comparison, dailyAverageKg } = analysis;

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Personalized guidance"
        description="Every recommendation is computed from your real data and quantified, so you know where effort pays off most."
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle as="h2">Where you stand</CardTitle>
          <CardDescription>
            Your daily average against common benchmarks.
          </CardDescription>
        </CardHeader>
        <CardBody className="divide-y divide-[var(--border-faint)] py-0">
          <CompareRow
            icon={Globe}
            label="Your daily average"
            value={`${formatKg(dailyAverageKg)} CO2e`}
            detail={
              comparison.vsGlobalPct <= 0
                ? `${Math.abs(comparison.vsGlobalPct)}% below global avg`
                : `${comparison.vsGlobalPct}% above global avg`
            }
          />
          <CompareRow
            icon={Globe}
            label="Global average"
            value={`${BENCHMARKS.globalDailyAvg} kg/day`}
            detail="~4 t per year"
          />
          <CompareRow
            icon={Target}
            label="Sustainable target"
            value={`${BENCHMARKS.sustainableDailyTarget} kg/day`}
            detail={
              comparison.vsTarget === "under" ? "On track" : "Above target"
            }
          />
        </CardBody>
      </Card>

      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-fg">
        <TrendingDown aria-hidden="true" className="size-4 text-[var(--accent)]" />
        Recommendations
      </h2>
      <InsightList insights={analysis.insights} />
    </>
  );
}

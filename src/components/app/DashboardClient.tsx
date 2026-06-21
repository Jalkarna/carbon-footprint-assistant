"use client";

import Link from "next/link";
import {
  ArrowRight,
  Cloud,
  Gauge,
  Target,
  Sparkles,
  PlusCircle,
} from "lucide-react";
import { useCarbonStore } from "@/lib/store/carbon-store";
import { dailyTotals } from "@/lib/emissions/calculate";
import { BENCHMARKS } from "@/lib/insights/analyze";
import { useFootprint } from "@/components/app/useFootprint";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { InsightList } from "@/components/app/InsightList";
import { ActivityList } from "@/components/app/ActivityList";
import { EmptyState } from "@/components/app/EmptyState";
import { BreakdownChart } from "@/components/charts/BreakdownChart";
import { TrendChart } from "@/components/charts/TrendChart";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardDescription,
  ProgressRing,
  formatKg,
} from "@/components/ui";
import { DashboardSkeleton } from "@/components/app/Skeletons";

export function DashboardClient() {
  const { hydrated, analysis, activityCount } = useFootprint();
  const activities = useCarbonStore((s) => s.activities);
  const goal = useCarbonStore((s) => s.goal);

  if (!hydrated) return <DashboardSkeleton />;

  if (activityCount === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Dashboard"
          title="Your footprint at a glance"
          description="Track emissions across transport, energy, diet, and shopping — and see exactly where you can make the biggest difference."
        />
        <Card>
          <EmptyState
            icon={PlusCircle}
            title="Nothing logged yet"
            description="Log your first activity — a commute, a meal, your electricity — to see your footprint and personalized guidance."
            actionLabel="Log your first activity"
            actionHref="/app/log"
          />
        </Card>
      </>
    );
  }

  const trend = dailyTotals(activities);
  const target = goal?.dailyTargetKg ?? BENCHMARKS.sustainableDailyTarget;
  const goalPct = target > 0 ? (analysis.dailyAverageKg / target) * 100 : 0;
  const headlineInsights = analysis.insights
    .filter((i) => i.id !== "headline")
    .slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Your footprint at a glance"
        description="A live view of your logged emissions and where they come from."
      />

      {/* Headline stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total logged"
          value={formatKg(analysis.totalKg)}
          unit="CO2e"
          icon={Cloud}
          hint={`Across ${activityCount} ${activityCount === 1 ? "activity" : "activities"}`}
        />
        <StatCard
          label="Daily average"
          value={formatKg(analysis.dailyAverageKg)}
          unit="CO2e"
          icon={Gauge}
          delta={{ value: analysis.comparison.vsGlobalPct }}
          hint="vs. global average"
        />
        <StatCard
          label="Sustainable target"
          value={String(target)}
          unit="kg/day"
          icon={Target}
          hint={
            analysis.comparison.vsTarget === "under"
              ? "You're on track"
              : "Room to improve"
          }
        />
      </div>

      {/* Trend + goal */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle as="h2">Daily emissions</CardTitle>
            <CardDescription>Your logged footprint over time.</CardDescription>
          </CardHeader>
          <CardBody>
            <TrendChart data={trend} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Goal progress</CardTitle>
            <CardDescription>Daily average vs. target.</CardDescription>
          </CardHeader>
          <CardBody className="flex flex-col items-center gap-3">
            <ProgressRing
              value={goalPct}
              tone={goalPct <= 100 ? "accent" : "critical"}
              label={`${Math.round(goalPct)}%`}
              sublabel="of target"
              ariaLabel={`Daily average is ${Math.round(goalPct)}% of your target`}
              size={120}
            />
            <p className="text-center text-sm text-fg-muted">
              {formatKg(analysis.dailyAverageKg)} of {target} kg/day
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Breakdown + recent */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">By category</CardTitle>
            <CardDescription>Where your emissions come from.</CardDescription>
          </CardHeader>
          <CardBody>
            <BreakdownChart
              byCategory={analysis.byCategory}
              total={analysis.totalKg}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle as="h2">Recent activity</CardTitle>
              <CardDescription>Your latest entries.</CardDescription>
            </div>
            <Link
              href="/app/log"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
            >
              View all
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </CardHeader>
          <CardBody>
            <ActivityList limit={5} />
          </CardBody>
        </Card>
      </div>

      {/* Insight highlights */}
      {headlineInsights.length > 0 && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-fg">
              <Sparkles
                aria-hidden="true"
                className="size-4 text-[var(--accent)]"
              />
              Top recommendations
            </h2>
            <Link
              href="/app/insights"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
            >
              All insights
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
          <InsightList insights={headlineInsights} />
        </div>
      )}
    </>
  );
}

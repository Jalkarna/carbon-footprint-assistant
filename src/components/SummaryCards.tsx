"use client";

import { useId, useState } from "react";
import type { FootprintAnalysis } from "@/lib/insights/analyze";
import { BENCHMARKS } from "@/lib/insights/analyze";
import { useCarbonStore } from "@/lib/store/carbon-store";
import { formatKg } from "./ui";

/** A single headline statistic. */
function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-sm">{sub}</p>}
    </div>
  );
}

/**
 * Headline statistics plus a daily goal control.
 *
 * The benchmark comparison gives the bare number meaning, and the goal lets the
 * user set a personal target the assistant can reference.
 */
export function SummaryCards({ analysis }: { analysis: FootprintAnalysis }) {
  const goal = useCarbonStore((s) => s.goal);
  const setGoal = useCarbonStore((s) => s.setGoal);
  const goalFieldId = useId();
  const [goalInput, setGoalInput] = useState<string>(
    goal ? String(goal.dailyTargetKg) : "",
  );

  const vsGlobal = analysis.comparison.vsGlobalPct;
  const underTarget = analysis.comparison.vsTarget === "under";

  const goalProgress =
    goal && goal.dailyTargetKg > 0
      ? Math.round((analysis.dailyAverageKg / goal.dailyTargetKg) * 100)
      : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Stat label="Total logged" value={`${formatKg(analysis.totalKg)} CO2e`} />

      <Stat
        label="Daily average"
        value={`${formatKg(analysis.dailyAverageKg)} CO2e`}
        sub={
          analysis.activityCount > 0 ? (
            <span className={vsGlobal <= 0 ? "text-win" : "text-opportunity"}>
              {vsGlobal <= 0
                ? `${Math.abs(vsGlobal)}% below`
                : `${vsGlobal}% above`}{" "}
              the global average
            </span>
          ) : (
            <span className="text-muted-foreground">Log activities to see this</span>
          )
        }
      />

      <div className="rounded-lg border border-border bg-surface p-4">
        <label
          htmlFor={goalFieldId}
          className="text-sm text-muted-foreground"
        >
          Daily target (kg CO2e)
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id={goalFieldId}
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onBlur={() =>
              setGoal(goalInput.trim() === "" ? null : Number(goalInput))
            }
            placeholder={String(BENCHMARKS.sustainableDailyTarget)}
            className="w-24 rounded-md border border-border bg-surface px-2 py-1 tabular-nums"
          />
          {goalProgress !== null && (
            <span
              className={`text-sm font-medium ${
                underTarget ? "text-win" : "text-opportunity"
              }`}
            >
              {goalProgress}% of target
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Climate-friendly target ≈ {BENCHMARKS.sustainableDailyTarget} kg/day
        </p>
      </div>
    </div>
  );
}
